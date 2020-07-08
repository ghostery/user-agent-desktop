/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

/* eslint-env mozilla/frame-script */

const { XPCOMUtils } = ChromeUtils.import(
  "resource://gre/modules/XPCOMUtils.jsm"
);

const manager = Cc["@mozilla.org/presentation-device/manager;1"].getService(
  Ci.nsIPresentationDeviceManager
);

var testProvider = {
  QueryInterface: ChromeUtils.generateQI([Ci.nsIPresentationDeviceProvider]),
  forceDiscovery() {
    sendAsyncMessage("force-discovery");
  },
  listener: null,
};

var testDevice = {
  QueryInterface: ChromeUtils.generateQI([Ci.nsIPresentationDevice]),
  establishControlChannel() {
    return null;
  },
  disconnect() {},
  isRequestedUrlSupported(requestedUrl) {
    return true;
  },
  id: null,
  name: null,
  type: null,
  listener: null,
};

var testDevice1 = {
  QueryInterface: ChromeUtils.generateQI([Ci.nsIPresentationDevice]),
  id: "dummyid",
  name: "dummyName",
  type: "dummyType",
  establishControlChannel(url, presentationId) {
    return null;
  },
  disconnect() {},
  isRequestedUrlSupported(requestedUrl) {
    return true;
  },
};

var testDevice2 = {
  QueryInterface: ChromeUtils.generateQI([Ci.nsIPresentationDevice]),
  id: "dummyid",
  name: "dummyName",
  type: "dummyType",
  establishControlChannel(url, presentationId) {
    return null;
  },
  disconnect() {},
  isRequestedUrlSupported(requestedUrl) {
    return true;
  },
};

var mockedDeviceWithoutSupportedURL = {
  QueryInterface: ChromeUtils.generateQI([Ci.nsIPresentationDevice]),
  id: "dummyid",
  name: "dummyName",
  type: "dummyType",
  establishControlChannel(url, presentationId) {
    return null;
  },
  disconnect() {},
  isRequestedUrlSupported(requestedUrl) {
    return false;
  },
};

var mockedDeviceSupportHttpsURL = {
  QueryInterface: ChromeUtils.generateQI([Ci.nsIPresentationDevice]),
  id: "dummyid",
  name: "dummyName",
  type: "dummyType",
  establishControlChannel(url, presentationId) {
    return null;
  },
  disconnect() {},
  isRequestedUrlSupported(requestedUrl) {
    if (requestedUrl.includes("https://")) {
      return true;
    }
    return false;
  },
};

addMessageListener("setup", function() {
  manager.addDeviceProvider(testProvider);

  sendAsyncMessage("setup-complete");
});

addMessageListener("trigger-device-add", function(device) {
  testDevice.id = device.id;
  testDevice.name = device.name;
  testDevice.type = device.type;
  manager.addDevice(testDevice);
});

addMessageListener("trigger-add-unsupport-url-device", function() {
  manager.addDevice(mockedDeviceWithoutSupportedURL);
});

addMessageListener("trigger-add-multiple-devices", function() {
  manager.addDevice(testDevice1);
  manager.addDevice(testDevice2);
});

addMessageListener("trigger-add-https-devices", function() {
  manager.addDevice(mockedDeviceSupportHttpsURL);
});

addMessageListener("trigger-device-update", function(device) {
  testDevice.id = device.id;
  testDevice.name = device.name;
  testDevice.type = device.type;
  manager.updateDevice(testDevice);
});

addMessageListener("trigger-device-remove", function() {
  manager.removeDevice(testDevice);
});

addMessageListener("trigger-remove-unsupported-device", function() {
  manager.removeDevice(mockedDeviceWithoutSupportedURL);
});

addMessageListener("trigger-remove-multiple-devices", function() {
  manager.removeDevice(testDevice1);
  manager.removeDevice(testDevice2);
});

addMessageListener("trigger-remove-https-devices", function() {
  manager.removeDevice(mockedDeviceSupportHttpsURL);
});

addMessageListener("teardown", function() {
  manager.removeDeviceProvider(testProvider);
});
