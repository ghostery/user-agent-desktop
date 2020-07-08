/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef nsHTMLDNSPrefetch_h___
#define nsHTMLDNSPrefetch_h___

#include "nsCOMPtr.h"
#include "nsString.h"

#include "nsIDNSListener.h"
#include "nsIWebProgressListener.h"
#include "nsWeakReference.h"
#include "nsIObserver.h"

class nsITimer;
namespace mozilla {
namespace dom {
class Document;
class Link;
}  // namespace dom
}  // namespace mozilla

namespace mozilla {
namespace net {
class NeckoParent;
}  // namespace net
}  // namespace mozilla

class nsHTMLDNSPrefetch {
 public:
  // The required aDocument parameter is the context requesting the prefetch -
  // under certain circumstances (e.g. headers, or security context) associated
  // with the context the prefetch will not be performed.
  static bool IsAllowed(mozilla::dom::Document* aDocument);

  static nsresult Initialize();
  static nsresult Shutdown();

  // Call one of the Prefetch* methods to start the lookup.
  //
  // The URI versions will defer DNS lookup until pageload is
  // complete, while the string versions submit the lookup to
  // the DNS system immediately. The URI version is somewhat lighter
  // weight, but its request is also more likely to be dropped due to a
  // full queue and it may only be used from the main thread.

  static nsresult PrefetchHigh(mozilla::dom::Link* aElement);
  static nsresult PrefetchMedium(mozilla::dom::Link* aElement);
  static nsresult PrefetchLow(mozilla::dom::Link* aElement);
  static nsresult PrefetchHigh(
      const nsAString& host, bool isHttps,
      const mozilla::OriginAttributes& aOriginAttributes,
      nsIRequest::TRRMode aTRRMode);
  static nsresult PrefetchMedium(
      const nsAString& host, bool isHttps,
      const mozilla::OriginAttributes& aOriginAttributes,
      nsIRequest::TRRMode aTRRMode);
  static nsresult PrefetchLow(
      const nsAString& host, bool isHttps,
      const mozilla::OriginAttributes& aOriginAttributes,
      nsIRequest::TRRMode aTRRMode);
  static nsresult CancelPrefetchLow(
      const nsAString& host, bool isHttps,
      const mozilla::OriginAttributes& aOriginAttributes,
      nsIRequest::TRRMode aTRRMode, nsresult aReason);
  static nsresult CancelPrefetchLow(mozilla::dom::Link* aElement,
                                    nsresult aReason);

  static void LinkDestroyed(mozilla::dom::Link* aLink);

 private:
  static nsresult Prefetch(const nsAString& host, bool isHttps,
                           const mozilla::OriginAttributes& aOriginAttributes,
                           uint32_t flags);
  static nsresult Prefetch(mozilla::dom::Link* aElement, uint32_t flags);
  static nsresult CancelPrefetch(
      const nsAString& hostname, bool isHttps,
      const mozilla::OriginAttributes& aOriginAttributes, uint32_t flags,
      nsresult aReason);
  static nsresult CancelPrefetch(mozilla::dom::Link* aElement, uint32_t flags,
                                 nsresult aReason);

 public:
  class nsListener final : public nsIDNSListener {
    // This class exists to give a safe callback no-op DNSListener
   public:
    NS_DECL_THREADSAFE_ISUPPORTS
    NS_DECL_NSIDNSLISTENER

    nsListener() = default;

   private:
    ~nsListener() = default;
  };

  class nsDeferrals final : public nsIWebProgressListener,
                            public nsSupportsWeakReference,
                            public nsIObserver {
   public:
    NS_DECL_ISUPPORTS
    NS_DECL_NSIWEBPROGRESSLISTENER
    NS_DECL_NSIOBSERVER

    nsDeferrals();

    void Activate();
    nsresult Add(uint32_t flags, mozilla::dom::Link* aElement);

    void RemoveUnboundLinks();

   private:
    ~nsDeferrals();
    void Flush();

    void SubmitQueue();

    uint16_t mHead;
    uint16_t mTail;
    uint32_t mActiveLoaderCount;

    nsCOMPtr<nsITimer> mTimer;
    bool mTimerArmed;
    static void Tick(nsITimer* aTimer, void* aClosure);

    static const int sMaxDeferred = 512;  // keep power of 2 for masking
    static const int sMaxDeferredMask = (sMaxDeferred - 1);

    struct deferred_entry {
      uint32_t mFlags;
      // Link implementation clears this raw pointer in its destructor.
      mozilla::dom::Link* mElement;
    } mEntries[sMaxDeferred];
  };

  friend class mozilla::net::NeckoParent;
};

#endif
