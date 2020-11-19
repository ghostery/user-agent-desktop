import subprocess
from .const import *


def balrog_api_opts(client_id, client_secret):
    auth0_secrets = {
        'client_id': client_id,
        'client_secret': client_secret,
        'audience': AUTH0_AUDIENCE,
        'domain': AUTH0_DOMAIN
    }
    return {
        'auth0_secrets': auth0_secrets,
        'api_root': API_ROOT,
    }


build_target_to_platform = {
    'Darwin_x86_64-gcc3': 'mac',
    'WINNT_x86_64-msvc-x64': 'win64',
    'Linux_x86_64-gcc3': 'linux-x86_64',
    'WINNT_aarch64-msvc-aarch64': 'win64-aarch64',
}
platform_to_build_target = {
    v: k for k, v in build_target_to_platform.items()
}


def get_platform_for_build_target(target):
    return build_target_to_platform[target]


def get_build_target_for_platform(platform):
    return platform_to_build_target[platform]


def get_update_url(release_name, product_name, app_version, locale='%LOCALE%', platform='%OS_BOUNCER%', kind='complete'):
    return f"{REPOSITORY_BASE_URL}/{release_name}/{product_name}-{app_version}.{locale}.{platform}.{kind}.mar"


def get_file_hash(path):
    return subprocess.run(['sha512sum', path], capture_output=True).stdout.decode('utf-8').split(' ')[0]
