/* import-globals-from ../../../common/tests/unit/head_helpers.js */

const { AppConstants } = ChromeUtils.import(
  "resource://gre/modules/AppConstants.jsm"
);
const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { TestUtils } = ChromeUtils.import(
  "resource://testing-common/TestUtils.jsm"
);

const { RemoteSettingsWorker } = ChromeUtils.import(
  "resource://services-settings/RemoteSettingsWorker.jsm"
);
const { Kinto } = ChromeUtils.import(
  "resource://services-common/kinto-offline-client.js"
);

XPCOMUtils.defineLazyGlobalGetters(this, ["indexedDB"]);

const IS_ANDROID = AppConstants.platform == "android";

add_task(async function test_canonicaljson() {
  const records = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
  ];
  const timestamp = 42;

  const serialized = await RemoteSettingsWorker.canonicalStringify(
    records,
    timestamp
  );

  Assert.equal(
    serialized,
    '{"data":[{"id":"1","title":"title 1"},{"id":"2","title":"title 2"}],"last_modified":"42"}'
  );
});

add_task(async function test_import_json_dump_into_idb() {
  if (IS_ANDROID) {
    // Skip test: we don't ship remote settings dumps on Android (see package-manifest).
    return;
  }
  const kintoCollection = new Kinto({
    bucket: "main",
    adapter: Kinto.adapters.IDB,
    adapterOptions: { dbName: "remote-settings" },
  }).collection("language-dictionaries");
  const { data: before } = await kintoCollection.list();
  Assert.equal(before.length, 0);

  await RemoteSettingsWorker.importJSONDump("main", "language-dictionaries");

  const { data: after } = await kintoCollection.list();
  Assert.ok(after.length > 0);
  // Close this connection, so that we can delete the DB further down.
  await kintoCollection.db.close();
});

add_task(async function test_throws_error_if_worker_fails() {
  let error;
  try {
    await RemoteSettingsWorker.canonicalStringify(null, 42);
  } catch (e) {
    error = e;
  }
  Assert.equal(error.message.endsWith("records is null"), true);
});

add_task(async function test_throws_error_if_worker_fails_async() {
  // Delete the Remote Settings database, and try to import a dump.
  // This is not supported, and the error thrown asynchronously in the worker
  // should be reported to the caller.
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("remote-settings");
    request.onsuccess = event => resolve();
    request.onblocked = event => reject(new Error("Cannot delete DB"));
    request.onerror = event => reject(event.target.error);
  });
  let error;
  try {
    await RemoteSettingsWorker.importJSONDump("main", "language-dictionaries");
  } catch (e) {
    error = e;
  }
  Assert.ok(/IndexedDB: Error accessing remote-settings/.test(error.message));
});

add_task(async function test_throws_error_if_worker_crashes() {
  // This simulates a crash at the worker level (not within a promise).
  let error;
  try {
    await RemoteSettingsWorker._execute("unknown_method");
  } catch (e) {
    error = e;
  }
  Assert.equal(error.message, "TypeError: Agent[method] is not a function");
});

add_task(async function test_stops_worker_after_timeout() {
  // Change the idle time.
  Services.prefs.setIntPref(
    "services.settings.worker_idle_max_milliseconds",
    1
  );
  // Run a task:
  let serialized = await RemoteSettingsWorker.canonicalStringify([], 42);
  Assert.equal(serialized, '{"data":[],"last_modified":"42"}', "API works.");
  // Check that the worker gets stopped now the task is done:
  await TestUtils.waitForCondition(() => !RemoteSettingsWorker.worker);
  // Ensure the worker stays alive for 10 minutes instead:
  Services.prefs.setIntPref(
    "services.settings.worker_idle_max_milliseconds",
    600000
  );
  // Run another task:
  serialized = await RemoteSettingsWorker.canonicalStringify([], 42);
  Assert.equal(
    serialized,
    '{"data":[],"last_modified":"42"}',
    "API still works."
  );
  Assert.ok(RemoteSettingsWorker.worker, "Worker should stay alive a bit.");

  // Clear the pref.
  Services.prefs.clearUserPref(
    "services.settings.worker_idle_max_milliseconds"
  );
});
