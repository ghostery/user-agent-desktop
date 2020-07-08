/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var servicesDiv = document.getElementById("webservices-container");
servicesDiv.style.display = "none";

function showServices() {
  servicesDiv.style.display = "";
}

// Fluent replaces the children of the element being overlayed which prevents us
// from putting an event handler directly on the children.
document.body.addEventListener("click", event => {
  if (event.target.id == "showWebServices") {
    showServices();
  }
});

var disablingServicesDiv = document.getElementById(
  "disabling-webservices-container"
);

function showDisablingServices() {
  disablingServicesDiv.style.display = "";
}

if (disablingServicesDiv != null) {
  disablingServicesDiv.style.display = "none";
  // Same issue here with Fluent replacing the children affecting the event listeners.
  document.body.addEventListener("click", event => {
    if (event.target.id == "showDisablingWebServices") {
      showDisablingServices();
    }
  });
}
