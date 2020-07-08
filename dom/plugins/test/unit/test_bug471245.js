/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

function run_test() {
  allow_all_plugins();
  do_get_profile_startup();

  var plugin = get_test_plugintag();
  Assert.ok(plugin == null);

  // Initialises a profile folder
  do_get_profile();

  plugin = get_test_plugintag();
  Assert.equal(false, plugin == null);

  // Clean up
  Services.prefs.clearUserPref("plugin.importedState");
}
