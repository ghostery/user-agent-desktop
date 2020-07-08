GeckoView
=========

Supporting GeckoView in the Telemetry core means enabling GeckoView to easily add and
record Telemetry. Since GeckoView can be embedded and have a short life cycle, due to
the OS killing the application to spare memory or the user completing a short task and
then bailing out, we need to support measurements across different sessions. The current
GeckoView support is limited to :doc:`scalars <../collection/scalars>` and
:doc:`histograms <../collection/histograms>`.

Overview
--------
GeckoView does not make use of the same `JavaScript modules <https://dxr.mozilla.org/mozilla-central/search?q=path%3Atoolkit%2Fcomponents%2Ftelemetry+ext%3Ajsm+-path%3Ageckoview&redirect=false>`_
used in Firefox Desktop. Instead, Telemetry gets setup on this product by `GeckoViewTelemetryController.jsm <https://dxr.mozilla.org/mozilla-central/rev/1800b8895c08bc0c60302775dc0a4b5ea4deb310/toolkit/components/telemetry/geckoview/GeckoViewTelemetryController.jsm>`_ .

More importantly, users do not need to worry about handling measurements' persistence across
sessions: this means measurements accumulate across application sessions until cleared. In
contrast with Firefox Desktop, for which Telemetry defines a strict :doc:`session <../concepts/sessions>`
model, for GeckoView, the Telemetry module does not define it: it just provides accumulation
and storage.
Defining a session model is the responsibility of the application.

Persistence
-----------
Measurement persistence across sessions is guaranteed by an automatic serialization and deserialization
process performed, behind the scenes, by the Telemetry core. As soon as Telemetry starts up, it
checks for the existence of the persisted measurements file (``gv_measurements.json``) in the
Android's application `data dir <https://developer.android.com/reference/android/content/pm/ApplicationInfo.html#dataDir>`_. If that file is found, it is parsed and the values of the
contained measurements are loaded in memory.

.. note::

  While it's possible to request a snapshot of the measurements using the GeckoView API before
  the persisted measurements are loaded from the disk, the requests will only be served once
  the state of the persisted measurements is restored from the disk. The
  ``internal-telemetry-geckoview-load-complete`` topic is broadcasted to signal that loading
  is complete.

Once the measurements are restored, their values will be dumped again to the persisted
measurements file after the update interval expires. This interval is defined by the
``toolkit.telemetry.geckoPersistenceTimeout`` preference (defaults to 1 minute), see the
:doc:`preferences docs <preferences>`.

Scalar Semantics
~~~~~~~~~~~~~~~~

Data collection can start very early during the application life cycle and might overlap with the persistence deserialization.
The Telemetry Core therefore takes additional steps to preserve the semantics of scalar operations.

During deserialization of persisted measurements operations on scalar probes are not applied immediately, but recorded into a pending operations list.
Once deserialization is finished, the pending operations are applied in the order they were recorded.
This avoids any data race between operations and scalar values are always in a consistent state.
Snapshots requests will only be fulfilled after the deserialization finished and all pending operations are applied.
Consumers of the recorded data should therefore never see inconsistent data.

An example:

1. Scalar deserialization is started
2. "test" scalar is incremented by "10" by the application -> The operation ``[test, add, 10]`` is recorded into the list.
3. The state of the "test" scalar is loaded off the persistence file, and the value "14" is set.
4. Deserialization is finished and the pending operations are applied.

   * The "test" scalar is incremented by "10", the value is now "24"
5. "test" scalar is incremented via "scalarAdd" by 1. Its value is "25"

To stop growing unbounded in memory while waiting for scalar deserialization to finish, pending operations are applied
immediately if the array reaches a high water mark of 10000 elements.
At that point the deserialization is considered done and following scalar operatins will be applied immediately.
In the case of the deserialization still being in progress, it might overwrite recorded values,
leading to inconsistent data.

The persistence file format
---------------------------
All the supported measurements are serialized to the persistence file using the JSON format.
The top level entries in the file are the measurement types. Each measurement section contains
an entry for all the supported processes. Finally, each process section contains the measurement
specific data required to restore its state in memory.

.. code-block:: js

    {
      "scalars": {
        "content": {
          "telemetry.test.all_processes_uint": 37,
          "<other scalar>": ...
        },
        "<other process>": {
          ...
        }
      },
      "keyedScalars": {
        "parent": {
          "telemetry.test.keyed_unsigned_int": {
            "testKey": 73,
            "<other key>: ..."
          }
        }
      },
      "histograms": {
        "parent": {
          "TELEMETRY_TEST_MULTIPRODUCT": {
            "sum": 31303,
            "counts": [
              3, 5, 7, ...
            ]
          },
          "<other histogram>:" {
            "sum": ...,
            "counts" [
              // the count for each histogram's bucket
            ]
          }
        },
        "<other process>": {
          ...
        }
      },
      "keyedHistograms": {
        "content": {
          "TELEMETRY_TEST_MULTIPRODUCT_KEYED": {
            "niceKey": {
              "sum": 13001,
              "counts": [
                1, 2, 3, ...
              ]
            },
            "<other key>": {
              ..
            }
          },
          "<other keyed histogram>": {
            ...
          }
        },
        "<other process>": {
          ...
        }
      }
    }

The internal C++ API
--------------------
The following API is only exposed to the rest of the Telemetry core and the gtest suite.

.. code-block:: cpp

    /**
     * Initializes the GeckoView persistence.
     * This loads any measure that was previously persisted and then kicks
     * off the persistence timer that regularly serializes telemetry measurements
     * to the disk (off the main thread).
     *
     * Note: while this code should only be used in GeckoView, it's also
     * compiled on other platforms for test-coverage.
     */
    void InitPersistence();

    /**
     * Shuts down the GeckoView persistence.
     */
    void DeInitPersistence();

    /**
     * Clears any GeckoView persisted data.
     * This physically deletes persisted data files.
     */
    void ClearPersistenceData();

Version history
---------------


- Firefox 62:

  - Initial GeckoView support and scalar persistence (`bug 1453591 <https://bugzilla.mozilla.org/show_bug.cgi?id=1453591>`_).
  - Persistence support for histograms (`bug 1457127 <https://bugzilla.mozilla.org/show_bug.cgi?id=1457127>`_).
  - Preserve the semantics of scalar operations when restoring the persisted state (`bug 1454606 <https://bugzilla.mozilla.org/show_bug.cgi?id=1454606>`_)
