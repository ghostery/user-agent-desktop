import argparse
import json
import subprocess
from balrogclient import Release, SingleLocale

parser = argparse.ArgumentParser()
# parser.add_argument("action", help="'release', 'build', or 'nightly")
parser.add_argument("--old", help="Old release")
parser.add_argument("--to", help="New release")
parser.add_argument("--client-id", help="M2M Client ID for auth")
parser.add_argument("--client-secret", help="M2M Client secret for auth")
args = parser.parse_args()

auth0_secrets = {
    'client_id': args.client_id,
    'client_secret': args.client_secret,
    'audience': 'ghostery-balrog',
    'domain': 'ghostery-balrog.eu.auth0.com'
}
build_target_to_platform = {
    'Darwin_x86_64-gcc3': 'mac',
    'WINNT_x86_64-msvc-x64': 'win64',
    'Linux_x86_64-gcc3': 'linux-x86_64',
}
api_root = 'http://balrogadmin.ghosterydev.com/api'

product_name = "Ghostery"
name = f"{product_name}-{args.to}"

# get release data from Balrog
target_release = Release(name=name,
              auth0_secrets=auth0_secrets,
              api_root=api_root)
target_release_data = target_release.get_data()[0]
from_release_data = Release(name=f"{product_name}-{args.old}",
                            auth0_secrets=auth0_secrets,
                            api_root=api_root).get_data()[0]

# traverse platforms and locales for partials to build
partials = []

for platform, platform_info in target_release_data['platforms'].items():
    for locale, mars in platform_info.get('locales', {}).items():
        try:
            from_mars = from_release_data['platforms'][platform]['locales'][locale]
            partials.append({
                'buildId': mars['buildID'],
                'toVersion': mars['displayVersion'],
                'to_mar': mars['completes'][0]['fileUrl'],
                'from_mar': from_mars['completes'][0]['fileUrl'],
                'platform': platform,
                'locale': locale,
                'version': mars['displayVersion'],
                'fromVersion': from_mars['displayVersion'],
                'fromBuildId': from_mars['buildID'],
            })
        except KeyError:
            print('error with', platform, locale)
            continue
    # break

# process each partial in turn
for build in partials:
    # if there isn't a version bump between these releases, put the buildID in the file name
    # so we can tell the difference between different partials.
    from_version = build['fromVersion']
    if from_version == build['toVersion']:
        from_version = build['fromBuildId']
    mar_name = f'{product_name}-{build["toVersion"]}-{from_version}.{build["locale"]}.{build_target_to_platform[build["platform"]]}.partial.mar'

    subprocess.run(['bash', 'ci/mar_diff.sh', build['toVersion'], mar_name, build['from_mar'], build['to_mar']])
