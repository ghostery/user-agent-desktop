/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "IDTracker.h"

#include "mozilla/Encoding.h"
#include "nsContentUtils.h"
#include "nsIURI.h"
#include "nsIReferrerInfo.h"
#include "nsEscape.h"
#include "nsCycleCollectionParticipant.h"

namespace mozilla {
namespace dom {

static DocumentOrShadowRoot* DocOrShadowFromContent(nsIContent& aContent) {
  ShadowRoot* shadow = aContent.GetContainingShadow();

  // We never look in <svg:use> shadow trees, for backwards compat.
  while (shadow && shadow->Host()->IsSVGElement(nsGkAtoms::use)) {
    shadow = shadow->Host()->GetContainingShadow();
  }

  if (shadow) {
    return shadow;
  }

  return aContent.OwnerDoc();
}

void IDTracker::ResetToURIFragmentID(nsIContent* aFromContent, nsIURI* aURI,
                                     nsIReferrerInfo* aReferrerInfo,
                                     bool aWatch, bool aReferenceImage) {
  MOZ_ASSERT(aFromContent,
             "ResetToURIFragmentID() expects non-null content pointer");

  Unlink();

  if (!aURI) return;

  nsAutoCString refPart;
  aURI->GetRef(refPart);
  // Unescape %-escapes in the reference. The result will be in the
  // document charset, hopefully...
  NS_UnescapeURL(refPart);

  // Get the thing to observe changes to.
  Document* doc = aFromContent->OwnerDoc();
  DocumentOrShadowRoot* docOrShadow = DocOrShadowFromContent(*aFromContent);
  auto encoding = doc->GetDocumentCharacterSet();

  nsAutoString ref;
  nsresult rv = encoding->DecodeWithoutBOMHandling(refPart, ref);
  if (NS_FAILED(rv) || ref.IsEmpty()) {
    return;
  }

  if (aFromContent->IsInNativeAnonymousSubtree()) {
    // This happens, for example, if aFromContent is part of the content
    // inserted by a call to Document::InsertAnonymousContent, which we
    // also want to handle.  (It also happens for other native anonymous content
    // etc.)
    Element* anonRoot =
        doc->GetAnonRootIfInAnonymousContentContainer(aFromContent);
    if (anonRoot) {
      mElement = nsContentUtils::MatchElementId(anonRoot, ref);
      // We don't have watching working yet for anonymous content, so bail out
      // here.
      return;
    }
  }

  bool isEqualExceptRef;
  rv = aURI->EqualsExceptRef(doc->GetDocumentURI(), &isEqualExceptRef);
  if (NS_FAILED(rv) || !isEqualExceptRef) {
    RefPtr<Document::ExternalResourceLoad> load;
    doc = doc->RequestExternalResource(aURI, aReferrerInfo, aFromContent,
                                       getter_AddRefs(load));
    docOrShadow = doc;
    if (!doc) {
      if (!load || !aWatch) {
        // Nothing will ever happen here
        return;
      }

      DocumentLoadNotification* observer =
          new DocumentLoadNotification(this, ref);
      mPendingNotification = observer;
      load->AddObserver(observer);
      // Keep going so we set up our watching stuff a bit
    }
  }

  if (aWatch) {
    mWatchID = NS_Atomize(ref);
  }

  mReferencingImage = aReferenceImage;
  HaveNewDocumentOrShadowRoot(docOrShadow, aWatch, ref);
}

void IDTracker::ResetWithID(Element& aFrom, nsAtom* aID, bool aWatch) {
  MOZ_ASSERT(aID);

  if (aWatch) {
    mWatchID = aID;
  }

  mReferencingImage = false;

  DocumentOrShadowRoot* docOrShadow = DocOrShadowFromContent(aFrom);
  HaveNewDocumentOrShadowRoot(docOrShadow, aWatch, nsDependentAtomString(aID));
}

void IDTracker::HaveNewDocumentOrShadowRoot(DocumentOrShadowRoot* aDocOrShadow,
                                            bool aWatch, const nsString& aRef) {
  if (aWatch) {
    mWatchDocumentOrShadowRoot = nullptr;
    if (aDocOrShadow) {
      mWatchDocumentOrShadowRoot = &aDocOrShadow->AsNode();
      mElement = aDocOrShadow->AddIDTargetObserver(mWatchID, Observe, this,
                                                   mReferencingImage);
    }
    return;
  }

  if (!aDocOrShadow) {
    return;
  }

  Element* e = mReferencingImage ? aDocOrShadow->LookupImageElement(aRef)
                                 : aDocOrShadow->GetElementById(aRef);
  if (e) {
    mElement = e;
  }
}

void IDTracker::Traverse(nsCycleCollectionTraversalCallback* aCB) {
  NS_CYCLE_COLLECTION_NOTE_EDGE_NAME(*aCB, "mWatchDocumentOrShadowRoot");
  aCB->NoteXPCOMChild(mWatchDocumentOrShadowRoot);
  NS_CYCLE_COLLECTION_NOTE_EDGE_NAME(*aCB, "mElement");
  aCB->NoteXPCOMChild(mElement);
}

void IDTracker::Unlink() {
  if (mWatchID) {
    if (DocumentOrShadowRoot* docOrShadow = GetWatchDocOrShadowRoot()) {
      docOrShadow->RemoveIDTargetObserver(mWatchID, Observe, this,
                                          mReferencingImage);
    }
  }
  if (mPendingNotification) {
    mPendingNotification->Clear();
    mPendingNotification = nullptr;
  }
  mWatchDocumentOrShadowRoot = nullptr;
  mWatchID = nullptr;
  mElement = nullptr;
  mReferencingImage = false;
}

bool IDTracker::Observe(Element* aOldElement, Element* aNewElement,
                        void* aData) {
  IDTracker* p = static_cast<IDTracker*>(aData);
  if (p->mPendingNotification) {
    p->mPendingNotification->SetTo(aNewElement);
  } else {
    NS_ASSERTION(aOldElement == p->mElement, "Failed to track content!");
    ChangeNotification* watcher =
        new ChangeNotification(p, aOldElement, aNewElement);
    p->mPendingNotification = watcher;
    nsContentUtils::AddScriptRunner(watcher);
  }
  bool keepTracking = p->IsPersistent();
  if (!keepTracking) {
    p->mWatchDocumentOrShadowRoot = nullptr;
    p->mWatchID = nullptr;
  }
  return keepTracking;
}

NS_IMPL_ISUPPORTS_INHERITED0(IDTracker::ChangeNotification, mozilla::Runnable)
NS_IMPL_ISUPPORTS(IDTracker::DocumentLoadNotification, nsIObserver)

NS_IMETHODIMP
IDTracker::DocumentLoadNotification::Observe(nsISupports* aSubject,
                                             const char* aTopic,
                                             const char16_t* aData) {
  NS_ASSERTION(PL_strcmp(aTopic, "external-resource-document-created") == 0,
               "Unexpected topic");
  if (mTarget) {
    nsCOMPtr<Document> doc = do_QueryInterface(aSubject);
    mTarget->mPendingNotification = nullptr;
    NS_ASSERTION(!mTarget->mElement, "Why do we have content here?");
    // If we got here, that means we had Reset*() called with
    // aWatch == true.  So keep watching if IsPersistent().
    mTarget->HaveNewDocumentOrShadowRoot(doc, mTarget->IsPersistent(), mRef);
    mTarget->ElementChanged(nullptr, mTarget->mElement);
  }
  return NS_OK;
}

}  // namespace dom
}  // namespace mozilla
