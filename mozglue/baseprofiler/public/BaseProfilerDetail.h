/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Internal Base Profiler utilities.

#ifndef BaseProfilerDetail_h
#define BaseProfilerDetail_h

#include "mozilla/Maybe.h"
#include "mozilla/PlatformMutex.h"

#ifdef DEBUG
#  include "BaseProfiler.h"
#  ifdef MOZ_BASE_PROFILER
#    include "mozilla/Atomics.h"
// When #defined, safety-checking code is added. By default: DEBUG builds,
// and we need `MOZ_BASE_PROFILER` to use `profiler_current_thread_id()`.
#    define MOZ_BASE_PROFILER_DEBUG
#  endif  // MOZ_BASE_PROFILER
#endif    // DEBUG

namespace mozilla {
namespace baseprofiler {
namespace detail {

// Thin shell around mozglue PlatformMutex, for Base Profiler internal use.
class BaseProfilerMutex : private ::mozilla::detail::MutexImpl {
 public:
  BaseProfilerMutex() : ::mozilla::detail::MutexImpl() {}

  BaseProfilerMutex(const BaseProfilerMutex&) = delete;
  BaseProfilerMutex& operator=(const BaseProfilerMutex&) = delete;
  BaseProfilerMutex(BaseProfilerMutex&&) = delete;
  BaseProfilerMutex& operator=(BaseProfilerMutex&&) = delete;

#ifdef MOZ_BASE_PROFILER_DEBUG
  ~BaseProfilerMutex() { MOZ_ASSERT(mOwningThreadId == 0); }
#endif  // MOZ_BASE_PROFILER_DEBUG

  void Lock() {
#ifdef MOZ_BASE_PROFILER_DEBUG
    // This is only designed to catch recursive locking.
    const int tid = baseprofiler::profiler_current_thread_id();
    MOZ_ASSERT(tid != 0);
    MOZ_ASSERT(mOwningThreadId != tid);
#endif  // MOZ_BASE_PROFILER_DEBUG
    ::mozilla::detail::MutexImpl::lock();
#ifdef MOZ_BASE_PROFILER_DEBUG
    MOZ_ASSERT(mOwningThreadId == 0);
    mOwningThreadId = tid;
#endif  // MOZ_BASE_PROFILER_DEBUG
  }

  void Unlock() {
#ifdef MOZ_BASE_PROFILER_DEBUG
    // This should never trigger! But check just in case something has gone
    // very wrong.
    MOZ_ASSERT(mOwningThreadId == baseprofiler::profiler_current_thread_id());
    // We're still holding the mutex here, so it's safe to just reset
    // `mOwningThreadId`.
    mOwningThreadId = 0;
#endif  // MOZ_BASE_PROFILER_DEBUG
    ::mozilla::detail::MutexImpl::unlock();
  }

  void AssertCurrentThreadOwns() const {
#ifdef MOZ_BASE_PROFILER_DEBUG
    MOZ_ASSERT(mOwningThreadId == baseprofiler::profiler_current_thread_id());
#endif  // MOZ_BASE_PROFILER_DEBUG
  }

#ifdef MOZ_BASE_PROFILER_DEBUG
 private:
  Atomic<int, MemoryOrdering::SequentiallyConsistent> mOwningThreadId{0};
#endif  // MOZ_BASE_PROFILER_DEBUG
};

// RAII class to lock a mutex.
class MOZ_RAII BaseProfilerAutoLock {
 public:
  explicit BaseProfilerAutoLock(BaseProfilerMutex& aMutex) : mMutex(aMutex) {
    mMutex.Lock();
  }

  BaseProfilerAutoLock(const BaseProfilerAutoLock&) = delete;
  BaseProfilerAutoLock& operator=(const BaseProfilerAutoLock&) = delete;
  BaseProfilerAutoLock(BaseProfilerAutoLock&&) = delete;
  BaseProfilerAutoLock& operator=(BaseProfilerAutoLock&&) = delete;

  ~BaseProfilerAutoLock() { mMutex.Unlock(); }

 private:
  BaseProfilerMutex& mMutex;
};

// Thin shell around mozglue PlatformMutex, for Base Profiler internal use.
// Actual mutex may be disabled at construction time.
class BaseProfilerMaybeMutex : private ::mozilla::detail::MutexImpl {
 public:
  explicit BaseProfilerMaybeMutex(bool aActivate) {
    if (aActivate) {
      mMaybeMutex.emplace();
    }
  }

  BaseProfilerMaybeMutex(const BaseProfilerMaybeMutex&) = delete;
  BaseProfilerMaybeMutex& operator=(const BaseProfilerMaybeMutex&) = delete;
  BaseProfilerMaybeMutex(BaseProfilerMaybeMutex&&) = delete;
  BaseProfilerMaybeMutex& operator=(BaseProfilerMaybeMutex&&) = delete;

  ~BaseProfilerMaybeMutex() = default;

  bool IsActivated() const { return mMaybeMutex.isSome(); }

  void Lock() {
    if (IsActivated()) {
      mMaybeMutex->Lock();
    }
  }

  void Unlock() {
    if (IsActivated()) {
      mMaybeMutex->Unlock();
    }
  }

  void AssertCurrentThreadOwns() const {
#ifdef MOZ_BASE_PROFILER_DEBUG
    if (IsActivated()) {
      mMaybeMutex->AssertCurrentThreadOwns();
    }
#endif  // MOZ_BASE_PROFILER_DEBUG
  }

 private:
  Maybe<BaseProfilerMutex> mMaybeMutex;
};

// RAII class to lock a mutex.
class MOZ_RAII BaseProfilerMaybeAutoLock {
 public:
  explicit BaseProfilerMaybeAutoLock(BaseProfilerMaybeMutex& aMaybeMutex)
      : mMaybeMutex(aMaybeMutex) {
    mMaybeMutex.Lock();
  }

  BaseProfilerMaybeAutoLock(const BaseProfilerMaybeAutoLock&) = delete;
  BaseProfilerMaybeAutoLock& operator=(const BaseProfilerMaybeAutoLock&) =
      delete;
  BaseProfilerMaybeAutoLock(BaseProfilerMaybeAutoLock&&) = delete;
  BaseProfilerMaybeAutoLock& operator=(BaseProfilerMaybeAutoLock&&) = delete;

  ~BaseProfilerMaybeAutoLock() { mMaybeMutex.Unlock(); }

 private:
  BaseProfilerMaybeMutex& mMaybeMutex;
};

}  // namespace detail
}  // namespace baseprofiler
}  // namespace mozilla

#endif  // BaseProfilerDetail_h
