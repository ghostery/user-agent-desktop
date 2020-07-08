// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//
// Copied from Chromium's /src/base/android/java/src/org/chromium/base/StrictModeContext.java.

package org.mozilla.gecko.util;

import android.os.StrictMode;

import java.io.Closeable;

/**
 * Enables try-with-resources compatible StrictMode violation whitelisting.
 *
 * Example:
 * <pre>
 *     try (StrictModeContext unused = StrictModeContext.allowDiskWrites()) {
 *         return Example.doThingThatRequiresDiskWrites();
 *     }
 * </pre>
 *
 * Because the StrictModeContext variable is technically unused, the containing method might have to
 * be annotated with <code>@SuppressWarnings("try")</code>.
 *
 */
public final class StrictModeContext implements Closeable {
    private final StrictMode.ThreadPolicy mThreadPolicy;
    private final StrictMode.VmPolicy mVmPolicy;

    private StrictModeContext(final StrictMode.ThreadPolicy threadPolicy,
                              final StrictMode.VmPolicy vmPolicy) {
        mThreadPolicy = threadPolicy;
        mVmPolicy = vmPolicy;
    }

    private StrictModeContext(final StrictMode.ThreadPolicy threadPolicy) {
        this(threadPolicy, null);
    }

    private StrictModeContext(final StrictMode.VmPolicy vmPolicy) {
        this(null, vmPolicy);
    }

    /**
     * Convenience method for disabling all VM-level StrictMode checks with try-with-resources.
     * Includes everything listed here:
     *     https://developer.android.com/reference/android/os/StrictMode.VmPolicy.Builder.html
     */
    public static StrictModeContext allowAllVmPolicies() {
        StrictMode.VmPolicy oldPolicy = StrictMode.getVmPolicy();
        StrictMode.setVmPolicy(StrictMode.VmPolicy.LAX);
        return new StrictModeContext(oldPolicy);
    }

    /**
     * Convenience method for disabling StrictMode for disk-writes and -reads with
     * try-with-resources.
     */
    public static StrictModeContext allowDiskWrites() {
        StrictMode.ThreadPolicy oldPolicy = StrictMode.allowThreadDiskWrites();
        return new StrictModeContext(oldPolicy);
    }

    /**
     * Convenience method for disabling StrictMode for disk-reads with try-with-resources.
     */
    public static StrictModeContext allowDiskReads() {
        StrictMode.ThreadPolicy oldPolicy = StrictMode.allowThreadDiskReads();
        return new StrictModeContext(oldPolicy);
    }

    /**
     * Convenience method for disabling StrictMode for slow calls with try-with-resources.
     */
    public static StrictModeContext allowSlowCalls() {
        StrictMode.ThreadPolicy oldPolicy = StrictMode.getThreadPolicy();
        StrictMode.setThreadPolicy(
                new StrictMode.ThreadPolicy.Builder(oldPolicy).permitCustomSlowCalls().build());
        return new StrictModeContext(oldPolicy);
    }

    @Override
    public void close() {
        if (mThreadPolicy != null) {
            StrictMode.setThreadPolicy(mThreadPolicy);
        }
        if (mVmPolicy != null) {
            StrictMode.setVmPolicy(mVmPolicy);
        }
    }
}
