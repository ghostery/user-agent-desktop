import argparse
import json
import subprocess
from os.path import join, getsize
from balrogclient import Release, SingleLocale
from uadpy.common import balrog_api_opts, get_platform_for_build_target, get_file_hash
from uadpy.const import PRODUCT_NAME, REPOSITORY_BASE_URL

parser = argparse.ArgumentParser()
parser.add_argument("action", help="'generate', or 'publish'")
parser.add_argument("--old", help="Old release")
parser.add_argument("--to", help="New release")
parser.add_argument("--client-id", help="M2M Client ID for auth")
parser.add_argument("--client-secret", help="M2M Client secret for auth")
parser.add_argument("--mar-dir", help="Location to put/find partial mars")
args = parser.parse_args()

balrog_opts = balrog_api_opts(args.client_id, args.client_secret)
name = f"{PRODUCT_NAME}-{args.to}"

# get release data from Balrog
target_release = Release(name=name, **balrog_opts)
target_release_data = target_release.get_data()[0]

from_release_data = Release(name=f"{PRODUCT_NAME}-{args.old}",
                            **balrog_opts).get_data()[0]

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
for partial in partials:
    # if there isn't a version bump between these releases, put the buildID in the file name
    # so we can tell the difference between different partials.
    from_version = partial['fromVersion']
    to_version = partial['toVersion']
    if from_version == to_version:
        from_version = partial['fromBuildId']
        to_version = partial['buildId']
    mar_name = f'{PRODUCT_NAME}-{to_version}-{from_version}.{partial["locale"]}.{get_platform_for_build_target(partial["platform"])}.partial.mar'
    partial['name'] = mar_name

if args.action == 'generate':
    for partial in partials:
        # use the mar_diff.sh script to generate a partial mar
        subprocess.run(['bash', 'ci/mar_diff.sh', partial['toVersion'], join(args.mar_dir, partial['name']),
                        partial['from_mar'], partial['to_mar']])

elif args.action == 'publish':
    for partial in partials:
        build = SingleLocale(
            name=name, build_target=partial['platform'], locale=partial['locale'], **balrog_opts)
        update_url = f'{REPOSITORY_BASE_URL}/{args.to}/{partial["name"]}'
        file_hash = get_file_hash(join(args.mar_dir, partial["name"]))
        build_data = build.get_data()[0]
        if 'partials' not in build_data:
            build_data['partials'] = []
        build_data['partials'].append({
            "from": partial['fromBuildId'],
            "filesize": getsize(join(args.mar_dir, partial["name"])),
            "hashValue": file_hash,
            "fileUrl": update_url,
        })
        print(f'Add {file_hash} to {PRODUCT_NAME}-{partial["toVersion"]} ({partial["buildId"]})')
        build.update_build(product=PRODUCT_NAME,
                           hashFunction='sha512',
                           buildData=json.dumps(build_data),
                           schemaVersion=9)
