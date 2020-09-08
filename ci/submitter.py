import argparse
import os.path
import json
import subprocess
from balrogclient import Release, SingleLocale

parser = argparse.ArgumentParser()
parser.add_argument("action", help="'release', 'build', or 'nightly")
parser.add_argument("--tag", help="Tag name for this release")
parser.add_argument("--bid", help="CI buildId")
parser.add_argument("--client-id", help="M2M Client ID for auth")
parser.add_argument("--client-secret", help="M2M Client secret for auth")
parser.add_argument("--mar", help="Mar file for this build")
parser.add_argument('--moz-root', help="Path to mozilla-release")
args = parser.parse_args()


def get_update_url(release_name, product_name, app_version, locale='%LOCALE%', platform='%OS_BOUNCER%'):
    return f"https://github.com/human-web/user-agent-desktop/releases/download/{release_name}/{product_name}-{app_version}.{locale}.{platform}.complete.mar"


auth0_secrets = {
    'client_id': args.client_id,
    'client_secret': args.client_secret,
    'audience': 'ghostery-balrog',
    'domain': 'ghostery-balrog.eu.auth0.com'
}
api_root = 'http://balrogadmin.ghosterydev.com/api'

product_name = "Ghostery"
name = f"{product_name}-{args.tag}"
release_channels = ["release"]
platform_to_build_target = {
    'mac': "Darwin_x86_64-gcc3",
    'win64': 'WINNT_x86_64-msvc',
    'linux-x86_64': 'Linux_x86_64-gcc3',
}

app_version = open(os.path.join(args.moz_root, 'browser',
                                'config', 'version.txt'), 'r').read()
display_version = open(os.path.join(
    args.moz_root, 'browser', 'config', 'version_display.txt'), 'r').read()

fileUrls = {}
for channel in release_channels + ['*']:
    fileUrls[channel] = {
        "completes": {
            "*": get_update_url(args.tag, product_name, app_version)
        }
    }

if args.action == "release":
    release_data = {
        "name": name,
        "schema_version": 9,
        "hashFunction": "sha512",
        "appVersion": app_version,
        "displayVersion": display_version,
        "updateLine": [],
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
            }
        }
    }
    print(json.dumps(release_data, indent=2))
    api = Release(name=name,
                  auth0_secrets=auth0_secrets,
                  api_root=api_root)
    api.update_release(product=product_name, hashFunction='sha512',
                       releaseData=json.dumps(release_data), schemaVersion=9)

elif args.action == 'build':
    mar_path = os.path.split(args.mar)
    [_, locale, platform, _, _] = mar_path[-1].rsplit('.', 4)
    print(f'Locale={locale}; Platform={platform}')
    api = SingleLocale(name=name,
                       build_target=platform_to_build_target[platform],
                       locale=locale,
                       auth0_secrets=auth0_secrets,
                       api_root=api_root)
    url = get_update_url(args.tag, product_name,
                         app_version, locale, platform)

    file_hash = subprocess.run(
        ['sha512sum', args.mar], capture_output=True).stdout.decode('utf-8').split(' ')[0]
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
    api.update_build(product=product_name,
                     hashFunction='sha512',
                     buildData=json.dumps(build_data),
                     schemaVersion=9)

elif args.action == 'nightly':
    # copy the state of the tagged release to nightly
    current = Release(name=name,
                      auth0_secrets=auth0_secrets,
                      api_root=api_root)
    data = current.get_data()[0]
    nightly = Release(name=f"{product_name}-nightly",
                      auth0_secrets=auth0_secrets,
                      api_root=api_root)
    nightly_data = nightly.get_data()[0]
    data["name"] = nightly.name
    print(json.dumps(data, indent=2))
    if data == nightly_data:
        print(f"Nightly already points at {current.name}")
    else:
        nightly.update_release(product=product_name, hashFunction='sha512',
                               releaseData=json.dumps(data), schemaVersion=9)
