# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import absolute_import, print_function, unicode_literals

from .transform import loader as base_loader


def loader(kind, path, config, params, loaded_tasks):
    """
    Generate inputs implementing PushApk jobs. These depend on signed multi-locales nightly builds.
    """
    jobs = base_loader(kind, path, config, params, loaded_tasks)

    for job in jobs:
        dependent_tasks = get_dependent_loaded_tasks(config, params, loaded_tasks)
        if not dependent_tasks:
            # PushApk must depend on signed APK. If no dependent task was found,
            # this means another plaform (like windows) is being processed
            continue

        job['dependent-tasks'] = dependent_tasks
        job['label'] = job['name']

        yield job


def get_dependent_loaded_tasks(config, params, loaded_tasks):
    nightly_tasks = (
        task for task in loaded_tasks if task.attributes.get('nightly')
    )
    tasks_with_matching_kind = (
        task for task in nightly_tasks if task.kind in config.get('kind-dependencies')
    )
    return [
        task for task in tasks_with_matching_kind
        if task.attributes.get('build_platform', '').startswith('android') and
        # Bug 1522581: Some GeckoView-only tasks produce APKs that shouldn't be pushed.
        not task.attributes.get('disable-push-apk', False)
    ]
