# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
from functools import partial

import mozunit
import pytest
from moztest.selftest.output import get_mozharness_status, filter_action

from mozharness.base.log import INFO, WARNING, ERROR
from mozharness.mozilla.automation import TBPL_SUCCESS, TBPL_WARNING, TBPL_FAILURE


here = os.path.abspath(os.path.dirname(__file__))
get_mozharness_status = partial(get_mozharness_status, 'mochitest')


def test_output_pass(runtests):
    status, lines = runtests('test_pass.html')
    assert status == 0

    tbpl_status, log_level, summary = get_mozharness_status(lines, status)
    assert tbpl_status == TBPL_SUCCESS
    assert log_level in (INFO, WARNING)

    lines = filter_action('test_status', lines)
    assert len(lines) == 1
    assert lines[0]['status'] == 'PASS'


def test_output_fail(runtests):
    status, lines = runtests('test_fail.html')
    assert status == 1

    tbpl_status, log_level, summary = get_mozharness_status(lines, status)
    assert tbpl_status == TBPL_WARNING
    assert log_level == WARNING

    lines = filter_action('test_status', lines)

    assert len(lines) == 1
    assert lines[0]['status'] == 'FAIL'


@pytest.mark.skip_mozinfo("!crashreporter")
def test_output_crash(runtests):
    status, lines = runtests('test_crash.html', environment=["MOZ_CRASHREPORTER_SHUTDOWN=1"])
    assert status == 1

    tbpl_status, log_level, summary = get_mozharness_status(lines, status)
    assert tbpl_status == TBPL_FAILURE
    assert log_level == ERROR

    crash = filter_action('crash', lines)
    assert len(crash) == 1
    assert crash[0]['action'] == 'crash'
    assert crash[0]['signature']
    assert crash[0]['minidump_path']

    lines = filter_action('test_end', lines)
    assert len(lines) == 0


@pytest.mark.skip_mozinfo("!asan")
def test_output_asan(runtests):
    status, lines = runtests('test_crash.html', environment=["MOZ_CRASHREPORTER_SHUTDOWN=1"])
    assert status == 1

    tbpl_status, log_level, summary = get_mozharness_status(lines, status)
    assert tbpl_status == TBPL_FAILURE
    assert log_level == ERROR

    crash = filter_action('crash', lines)
    assert len(crash) == 0

    process_output = filter_action('process_output', lines)
    assert any('ERROR: AddressSanitizer' in l['data'] for l in process_output)


@pytest.mark.skip_mozinfo("!debug")
def test_output_assertion(runtests):
    status, lines = runtests('test_assertion.html')
    # TODO: mochitest should return non-zero here
    assert status == 0

    tbpl_status, log_level, summary = get_mozharness_status(lines, status)
    assert tbpl_status == TBPL_WARNING
    assert log_level == WARNING

    test_end = filter_action('test_end', lines)
    assert len(test_end) == 1
    # TODO: this should be ASSERT, but moving the assertion check before
    # the test_end action caused a bunch of failures.
    assert test_end[0]['status'] == 'OK'

    assertions = filter_action('assertion_count', lines)
    assert len(assertions) == 1
    assert assertions[0]['count'] == 1


@pytest.mark.skip_mozinfo("!debug")
def test_output_leak(runtests):
    status, lines = runtests('test_leak.html')
    # TODO: mochitest should return non-zero here
    assert status == 0

    tbpl_status, log_level, summary = get_mozharness_status(lines, status)
    assert tbpl_status == TBPL_WARNING
    assert log_level == WARNING

    leak_totals = filter_action('mozleak_total', lines)
    found_leaks = False
    for lt in leak_totals:
        if lt['bytes'] == 0:
            # No leaks in this process.
            assert len(lt['objects']) == 0
            continue

        assert not found_leaks, "Only one process should have leaked"
        found_leaks = True
        assert lt['process'] == "tab"
        assert lt['bytes'] == 1
        assert lt['objects'] == ['IntentionallyLeakedObject']

    assert found_leaks, "At least one process should have leaked"


if __name__ == '__main__':
    mozunit.main()
