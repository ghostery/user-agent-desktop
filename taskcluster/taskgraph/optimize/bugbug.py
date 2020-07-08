# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import absolute_import, print_function, unicode_literals

import json
import logging
import time

import requests
from mozbuild.util import memoize, memoized_property
from six.moves.urllib.parse import urlsplit

from taskgraph.optimize import register_strategy, OptimizationStrategy
from taskgraph.util.taskcluster import requests_retry_session

logger = logging.getLogger(__name__)


class BugbugTimeoutException(Exception):
    pass


class platform(object):
    """Strategies for dealing with platforms."""

    @staticmethod
    def all(task, params):
        """Don't filter any platforms."""
        return False

    @staticmethod
    def debug(task, params):
        """Only run debug platforms."""
        return not (task.attributes.get('build_type') == "debug")


@register_strategy("bugbug-all", args=(platform.all,))
@register_strategy("bugbug-debug", args=(platform.debug,))
class BugBugPushSchedules(OptimizationStrategy):
    """Query the 'bugbug' service to retrieve relevant tasks and manifests.

    Args:
        filterfn (func): A function to further reduce tasks after the bugbug
                         algorithm.
    """
    BUGBUG_BASE_URL = "https://bugbug.herokuapp.com"
    RETRY_TIMEOUT = 4 * 60  # seconds
    RETRY_INTERVAL = 5      # seconds

    def __init__(self, filterfn):
        self.filterfn = filterfn

    @memoized_property
    def session(self):
        s = requests.Session()
        s.headers.update({'X-API-KEY': 'gecko-taskgraph'})
        return requests_retry_session(retries=5, session=s)

    @memoize
    def run_query(self, query, data=None):
        url = self.BUGBUG_BASE_URL + query

        attempts = self.RETRY_TIMEOUT / self.RETRY_INTERVAL
        i = 0
        while i < attempts:
            r = self.session.get(url)
            r.raise_for_status()

            if r.status_code != 202:
                break

            time.sleep(self.RETRY_INTERVAL)
            i += 1

        data = r.json()
        logger.debug("Bugbug scheduler service returns:\n{}".format(
                     json.dumps(data, indent=2)))

        if r.status_code == 202:
            raise BugbugTimeoutException("Timed out waiting for result from '{}'".format(url))

        return data

    def should_remove_task(self, task, params, arg):
        branch = urlsplit(params['head_repository']).path.strip('/')
        rev = params['head_rev']
        data = self.run_query('/push/{branch}/{rev}/schedules'.format(branch=branch, rev=rev))

        test_manifests = task.attributes.get('test_manifests')
        if test_manifests is None:
            if task.label not in data.get('tasks', {}):
                return True

        elif not bool(set(task.attributes['test_manifests']) & set(data.get('groups', {}))):
            return True

        return self.filterfn(task, params)
