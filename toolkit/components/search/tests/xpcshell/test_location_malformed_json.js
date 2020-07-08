/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

// A console listener so we can listen for a log message from nsSearchService.
function promiseTimezoneMessage() {
  return new Promise(resolve => {
    let listener = {
      QueryInterface: ChromeUtils.generateQI([Ci.nsIConsoleListener]),
      observe(msg) {
        if (
          msg.message.startsWith(
            "getIsUS() fell back to a timezone check with the result="
          )
        ) {
          Services.console.unregisterListener(listener);
          resolve(msg);
        }
      },
    };
    Services.console.registerListener(listener);
  });
}

add_task(async function setup() {
  await AddonTestUtils.promiseStartupManager();
  Services.prefs.setBoolPref("browser.search.geoSpecificDefaults", true);
});

add_task(async function test_location_malformed_json() {
  // Here we have malformed JSON
  Services.prefs.setCharPref(
    "geo.provider-country.network.url",
    'data:application/json,{"country_code"'
  );
  await Services.search.init();
  ok(
    !Services.prefs.prefHasUserValue("browser.search.region"),
    "should be no region pref"
  );
  // fetch the engines - this should not persist any prefs.
  await Services.search.getEngines();
  ok(
    !Services.prefs.prefHasUserValue("browser.search.region"),
    "should be no region pref"
  );
  // should have recorded SUCCESS_WITHOUT_DATA
  checkCountryResultTelemetry(TELEMETRY_RESULT_ENUM.SUCCESS_WITHOUT_DATA);
});
