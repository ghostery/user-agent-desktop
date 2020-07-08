// Copyright (C) 2019 Leo Balter. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-properties-of-the-finalization-registry-constructor
description: >
  FinalizationRegistryCleanupIteratorPrototype.next.name property descriptor
info: |
  FinalizationRegistry.prototype.cleanupSome ( [ callback ] )

  1. Let finalizationRegistry be the this value.
  ...
  5. Perform ! CleanupFinalizationRegistry(finalizationRegistry, callback).
  ...

  CleanupFinalizationRegistry ( finalizationRegistry [ , callback ] )

  ...
  3. Let iterator be ! CreateFinalizationRegistryCleanupIterator(finalizationRegistry).
  ...
  6. Let result be Call(callback, undefined, « iterator »).
  ...

  17 ECMAScript Standard Built-in Objects

  Every built-in function object, including constructors, that is not
  identified as an anonymous function has a name property whose value
  is a String. Unless otherwise specified, this value is the name that
  is given to the function in this specification. For functions that
  are specified as properties of objects, the name value is the
  property name string used to access the function. [...]

  Unless otherwise specified, the name property of a built-in function
  object, if it exists, has the attributes { [[Writable]]: false,
  [[Enumerable]]: false, [[Configurable]]: true }.
includes: [async-gc.js, propertyHelper.js]
flags: [async, non-deterministic]
features: [FinalizationRegistry, host-gc-required, Symbol]
---*/

var FinalizationRegistryCleanupIteratorPrototype;
var called = 0;
var finalizationRegistry = new FinalizationRegistry(function() {});

function callback(iterator) {
  called += 1;
  FinalizationRegistryCleanupIteratorPrototype = Object.getPrototypeOf(iterator);
}

function emptyCells() {
  var target = {};
  finalizationRegistry.register(target);

  var prom = asyncGC(target);
  target = null;

  return prom;
}

emptyCells().then(function() {
  finalizationRegistry.cleanupSome(callback);

  assert.sameValue(called, 1, 'cleanup successful');

  assert.sameValue(typeof FinalizationRegistryCleanupIteratorPrototype.next, 'function');

  var next = FinalizationRegistryCleanupIteratorPrototype.next;

  verifyProperty(next, 'name', {
    value: 'next',
    enumerable: false,
    writable: false,
    configurable: true,
  });
}).then($DONE, resolveAsyncGC);
