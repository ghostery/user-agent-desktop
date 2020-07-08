/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set sw=2 ts=8 et tw=80 : */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "DocumentChannelParent.h"
#include "mozilla/dom/BrowserParent.h"
#include "mozilla/dom/CanonicalBrowsingContext.h"
#include "mozilla/dom/ClientInfo.h"

extern mozilla::LazyLogModule gDocumentChannelLog;
#define LOG(fmt) MOZ_LOG(gDocumentChannelLog, mozilla::LogLevel::Verbose, fmt)

using namespace mozilla::dom;

namespace mozilla {
namespace net {

DocumentChannelParent::DocumentChannelParent(CanonicalBrowsingContext* aContext,
                                             nsILoadContext* aLoadContext) {
  LOG(("DocumentChannelParent ctor [this=%p]", this));
  // Sometime we can get this called without a BrowsingContext, so that we have
  // an actor to call SendFailedAsyncOpen on.
  if (aContext) {
    mParent = new DocumentLoadListener(aContext, aLoadContext, this);
  }
}

DocumentChannelParent::~DocumentChannelParent() {
  LOG(("DocumentChannelParent dtor [this=%p]", this));
}

bool DocumentChannelParent::Init(const DocumentChannelCreationArgs& aArgs) {
  MOZ_ASSERT(mParent);
  RefPtr<nsDocShellLoadState> loadState =
      new nsDocShellLoadState(aArgs.loadState());
  LOG(("DocumentChannelParent Init [this=%p, uri=%s]", this,
       loadState->URI()->GetSpecOrDefault().get()));

  RefPtr<class LoadInfo> loadInfo;
  nsresult rv = mozilla::ipc::LoadInfoArgsToLoadInfo(Some(aArgs.loadInfo()),
                                                     getter_AddRefs(loadInfo));

  Maybe<ClientInfo> clientInfo;
  if (aArgs.initialClientInfo().isSome()) {
    clientInfo.emplace(ClientInfo(aArgs.initialClientInfo().ref()));
  }

  MOZ_ASSERT(NS_SUCCEEDED(rv));

  rv = NS_ERROR_UNEXPECTED;
  if (!mParent->Open(loadState, loadInfo, aArgs.loadFlags(), aArgs.cacheKey(),
                     aArgs.channelId(), aArgs.asyncOpenTime(),
                     aArgs.timing().refOr(nullptr), std::move(clientInfo),
                     aArgs.outerWindowId(), &rv)) {
    return SendFailedAsyncOpen(rv);
  }

  return true;
}

RefPtr<PDocumentChannelParent::RedirectToRealChannelPromise>
DocumentChannelParent::RedirectToRealChannel(uint32_t aRedirectFlags,
                                             uint32_t aLoadFlags) {
  if (!CanSend()) {
    return PDocumentChannelParent::RedirectToRealChannelPromise::
        CreateAndReject(ResponseRejectReason::ChannelClosed, __func__);
  }
  RedirectToRealChannelArgs args;
  mParent->SerializeRedirectData(args, false, aRedirectFlags, aLoadFlags);
  return SendRedirectToRealChannel(args);
}

void DocumentChannelParent::CSPViolation(
    nsCSPContext* aContext, bool aIsCspToInherit, nsIURI* aBlockedURI,
    nsCSPContext::BlockedContentSource aBlockedContentSource,
    nsIURI* aOriginalURI, const nsAString& aViolatedDirective,
    uint32_t aViolatedPolicyIndex, const nsAString& aObserverSubject) {
  CSPInfo cspInfo;
  Unused << NS_WARN_IF(NS_FAILED(CSPToCSPInfo(aContext, &cspInfo)));
  Unused << SendCSPViolation(
      cspInfo, aIsCspToInherit, aBlockedURI, aBlockedContentSource,
      aOriginalURI, PromiseFlatString(aViolatedDirective), aViolatedPolicyIndex,
      PromiseFlatString(aObserverSubject));
}

}  // namespace net
}  // namespace mozilla

#undef LOG
