import argparse
import os.path
import json
import subprocess
from balrogclient import Release, SingleLocale, Rule
from uadpy.common import balrog_api_opts, get_build_target_for_platform, get_update_url, get_file_hash
from uadpy.const import PRODUCT_NAME, RELEASE_CHANNELS, NIGHTLY_RULE_ID

parser = argparse.ArgumentParser()
parser.add_argument("action", help="'release', 'build', or 'nightly")
parser.add_argument("--tag", help="Tag name for this release")
parser.add_argument("--bid", help="CI buildId")
parser.add_argument("--client-id", help="M2M Client ID for auth")
parser.add_argument("--client-secret", help="M2M Client secret for auth")
parser.add_argument("--mar", help="Mar file for this build")
parser.add_argument('--moz-root', help="Path to mozilla-release")
args = parser.parse_args()

balrog_opts = balrog_api_opts(args.client_id, args.client_secret)
name = f"{PRODUCT_NAME}-{args.tag}"

app_version = open(os.path.join(args.moz_root, 'browser',
                                'config', 'version.txt'), 'r').read()
display_version = open(os.path.join(
    args.moz_root, 'browser', 'config', 'version_display.txt'), 'r').read()

fileUrls = {}
for channel in RELEASE_CHANNELS + ['*']:
    fileUrls[channel] = {
        "completes": {
            "*": get_update_url(args.tag, PRODUCT_NAME, app_version)
        }
    }

if args.action == "release":
    release_data = {
        "name": name,
        "schema_version": 9,
        "hashFunction": "sha512",
        "appVersion": app_version,
        "displayVersion": display_version,
        "updateLine": [{
            "fields": {
                "actions": "showURL",
                "openURL": f"https://get.ghosterybrowser.com/releasenotes/{args.tag}"
            },
            "for": {}
        }],
        "fileUrls": fileUrls,
        "platforms": {
            "Darwin_x86_64-gcc3": {
                "OS_BOUNCER": "mac"
            },
            "WINNT_x86_64-msvc": {
                "OS_BOUNCER": "win64"
            },
            "Linux_x86_64-gcc3": {
                "OS_BOUNCER": "linux-x86_64"
            },
            "Darwin_aarch64-gcc3": {
                "alias": "Darwin_x86_64-gcc3"
            }
        }
    }
    print(json.dumps(release_data, indent=2))
    api = Release(name=name, **balrog_opts)
    api.update_release(product=PRODUCT_NAME, hashFunction='sha512',
                       releaseData=json.dumps(release_data), schemaVersion=9)

elif args.action == 'build':
    mar_path = os.path.split(args.mar)
    [_, locale, platform, _, _] = mar_path[-1].rsplit('.', 4)
    print(f'Locale={locale}; Platform={platform}')
    api = SingleLocale(name=name,
                       build_target=get_build_target_for_platform(platform),
                       locale=locale,
                       **balrog_opts)
    url = get_update_url(args.tag, PRODUCT_NAME,
                         app_version, locale, platform)

    file_hash = get_file_hash(args.mar)
    build_data = {
        "buildID": args.bid,
        "appVersion": app_version,
        "displayVersion": app_version,
        "completes": [{
            "from": "*",
            "filesize": os.path.getsize(args.mar),
            "hashValue": file_hash,
            "fileUrl": url
        }]
    }
    print(json.dumps(build_data, indent=2))
    api.update_build(product=PRODUCT_NAME,
                     hashFunction='sha512',
                     buildData=json.dumps(build_data),
                     schemaVersion=9)

elif args.action == 'nightly':
    # get the nightly Rule and update mapping
    nightly_rule = Rule(NIGHTLY_RULE_ID, **balrog_opts)
    nightly_rule.update_rule(mapping=name)
