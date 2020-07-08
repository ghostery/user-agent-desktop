/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

add_task(async function test_no_slash() {
  info("Searching for host match without slash should match host");
  await PlacesTestUtils.addVisits([
    { uri: "http://file.org/test/" },
    { uri: "file:///c:/test.html" },
  ]);
  await check_autocomplete({
    search: "file",
    autofilled: "file.org/",
    completed: "http://file.org/",
  });
  await cleanup();
});

add_task(async function test_w_slash() {
  info("Searching match with slash at the end should match url");
  await PlacesTestUtils.addVisits(
    {
      uri: NetUtil.newURI("http://file.org/test/"),
    },
    {
      uri: NetUtil.newURI("file:///c:/test.html"),
    }
  );
  await check_autocomplete({
    search: "file.org/",
    autofilled: "file.org/",
    completed: "http://file.org/",
  });
  await cleanup();
});

add_task(async function test_middle() {
  info("Searching match with slash in the middle should match url");
  await PlacesTestUtils.addVisits(
    {
      uri: NetUtil.newURI("http://file.org/test/"),
    },
    {
      uri: NetUtil.newURI("file:///c:/test.html"),
    }
  );
  await check_autocomplete({
    search: "file.org/t",
    autofilled: "file.org/test/",
    completed: "http://file.org/test/",
  });
  await cleanup();
});

add_task(async function test_nonhost() {
  info("Searching for non-host match without slash should not match url");
  await PlacesTestUtils.addVisits({
    uri: NetUtil.newURI("file:///c:/test.html"),
  });
  await check_autocomplete({
    search: "file",
    autofilled: "file",
    completed: "file",
  });
  await cleanup();
});
