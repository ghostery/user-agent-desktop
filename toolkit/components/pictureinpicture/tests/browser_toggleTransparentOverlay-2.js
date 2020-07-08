/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

/**
 * Tests that the Picture-in-Picture toggle can appear and be clicked
 * when the video is overlaid with elements that have zero and
 * partial opacity.
 */
add_task(async () => {
  const PAGE = TEST_ROOT + "test-transparent-overlay-2.html";
  await testToggle(PAGE, {
    "video-zero-opacity": { canToggle: true },
    "video-partial-opacity": { canToggle: true },
  });
});
