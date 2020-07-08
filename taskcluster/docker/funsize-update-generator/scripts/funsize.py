#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import absolute_import, division, print_function

import asyncio
import aiohttp
import configparser
import argparse
import hashlib
import json
import logging
import os
import shutil
import tempfile
import requests
from distutils.util import strtobool

import redo
from scriptworker.utils import retry_async
from mardor.reader import MarReader
from mardor.signing import get_keysize


log = logging.getLogger(__name__)


ROOT_URL = os.environ['TASKCLUSTER_ROOT_URL']
QUEUE_PREFIX = ROOT_URL + '/api/queue/'
ALLOWED_URL_PREFIXES = (
    "http://download.cdn.mozilla.net/pub/mozilla.org/firefox/nightly/",
    "http://download.cdn.mozilla.net/pub/firefox/nightly/",
    "https://mozilla-nightly-updates.s3.amazonaws.com",
    "http://ftp.mozilla.org/",
    "http://download.mozilla.org/",
    "https://archive.mozilla.org/",
    "http://archive.mozilla.org/",
    QUEUE_PREFIX,
)
STAGING_URL_PREFIXES = (
    "http://ftp.stage.mozaws.net/",
    "https://ftp.stage.mozaws.net/",
)

BCJ_OPTIONS = {
    'x86': ['--x86'],
    'x86_64': ['--x86'],
    'aarch64': [],
}


def verify_signature(mar, certs):
    log.info("Checking %s signature", mar)
    with open(mar, 'rb') as mar_fh:
        m = MarReader(mar_fh)
        m.verify(verify_key=certs.get(m.signature_type))


def is_lzma_compressed_mar(mar):
    log.info("Checking %s for lzma compression", mar)
    result = MarReader(open(mar, 'rb')).compression_type == 'xz'
    if result:
        log.info("%s is lzma compressed", mar)
    else:
        log.info("%s is not lzma compressed", mar)
    return result


def validate_mar_channel_id(mar, channel_ids):
    log.info("Checking %s for MAR_CHANNEL_ID %s", mar, channel_ids)
    # We may get a string with a list representation, or a single entry string.
    channel_ids = set(channel_ids.split(','))

    product_info = MarReader(open(mar, 'rb')).productinfo
    if not isinstance(product_info, tuple):
        raise ValueError("Malformed product information in mar: {}".format(product_info))

    found_channel_ids = set(product_info[1].split(','))

    if not found_channel_ids.issubset(channel_ids):
        raise ValueError("MAR_CHANNEL_ID mismatch, {} not in {}".format(
            product_info[1], channel_ids))

    log.info("%s channel %s in %s", mar, product_info[1], channel_ids)


@redo.retriable()
def get_secret(secret_name):
    secrets_url = "http://taskcluster/secrets/v1/secret/{}"
    log.debug("Fetching {}".format(secret_name))
    r = requests.get(secrets_url.format(secret_name))
    # 403: If unauthorized, just give up.
    if r.status_code == 403:
        log.info("Unable to get secret key")
        return {}
    r.raise_for_status()
    return r.json().get('secret', {})


async def retry_download(*args, **kwargs):  # noqa: E999
    """Retry download() calls."""
    await retry_async(
        download,
        retry_exceptions=(
            aiohttp.ClientError,
            asyncio.TimeoutError
        ),
        args=args,
        kwargs=kwargs
    )


async def download(url, dest, mode=None):  # noqa: E999
    log.info("Downloading %s to %s", url, dest)
    chunk_size = 4096
    bytes_downloaded = 0
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.get(url, timeout=120) as resp:
            # Additional early logging for download timeouts.
            log.debug("Fetching from url %s", resp.url)
            for history in resp.history:
                log.debug("Redirection history: %s", history.url)
            if 'Content-Length' in resp.headers:
                log.debug('Content-Length expected for %s: %s',
                          url, resp.headers['Content-Length'])
            log_interval = chunk_size * 1024
            with open(dest, 'wb') as fd:
                while True:
                    chunk = await resp.content.read(chunk_size)
                    if not chunk:
                        break
                    fd.write(chunk)
                    bytes_downloaded += len(chunk)
                    log_interval -= len(chunk)
                    if log_interval <= 0:
                        log.debug("Bytes downloaded for %s: %d", url, bytes_downloaded)
                        log_interval = chunk_size * 1024

            log.debug('Downloaded %s bytes', bytes_downloaded)
            if mode:
                log.debug("chmod %o %s", mode, dest)
                os.chmod(dest, mode)


async def run_command(cmd, cwd='/', env=None, label=None, silent=False):
    if not env:
        env = dict()
    process = await asyncio.create_subprocess_shell(cmd,
                                                    stdout=asyncio.subprocess.PIPE,
                                                    stderr=asyncio.subprocess.PIPE,
                                                    cwd=cwd, env=env)
    if label:
        label = "{}: ".format(label)
    else:
        label = ""

    async def read_output(stream, label, printcmd):
        while True:
            line = await stream.readline()
            if line == b'':
                break
            printcmd("%s%s", label, line.decode('utf-8').rstrip())

    if silent:
        await process.wait()
    else:
        await asyncio.gather(
            read_output(process.stdout, label, log.info),
            read_output(process.stderr, label, log.warn)
            )
        await process.wait()


async def unpack(work_env, mar, dest_dir):
    os.mkdir(dest_dir)
    log.debug("Unwrapping %s", mar)
    env = work_env.env
    if not is_lzma_compressed_mar(mar):
        env['MAR_OLD_FORMAT'] = '1'
    elif 'MAR_OLD_FORMAT' in env:
        del env['MAR_OLD_FORMAT']

    cmd = "{} {}".format(work_env.paths['unwrap_full_update.pl'], mar)
    await run_command(cmd, cwd=dest_dir, env=env, label=dest_dir)


def find_file(directory, filename):
    log.debug("Searching for %s in %s", filename, directory)
    for root, _, files in os.walk(directory):
        if filename in files:
            f = os.path.join(root, filename)
            log.debug("Found %s", f)
            return f


def get_option(directory, filename, section, option):
    log.debug("Extracting [%s]: %s from %s/**/%s", section, option, directory,
              filename)
    f = find_file(directory, filename)
    config = configparser.ConfigParser()
    config.read(f)
    rv = config.get(section, option)
    log.debug("Found %s", rv)
    return rv


async def generate_partial(work_env, from_dir, to_dir, dest_mar, mar_data,
                           use_old_format):
    log.info("Generating partial %s", dest_mar)
    env = work_env.env
    env["MOZ_PRODUCT_VERSION"] = mar_data['version']
    env["MAR_CHANNEL_ID"] = mar_data["MAR_CHANNEL_ID"]
    env['BRANCH'] = mar_data['branch']
    if use_old_format:
        env['MAR_OLD_FORMAT'] = '1'
    elif 'MAR_OLD_FORMAT' in env:
        del env['MAR_OLD_FORMAT']
    make_incremental_update = os.path.join(work_env.workdir,
                                           "make_incremental_update.sh")
    cmd = " ".join([make_incremental_update, dest_mar, from_dir, to_dir])

    await run_command(cmd, cwd=work_env.workdir, env=env, label=dest_mar.split('/')[-1])
    validate_mar_channel_id(dest_mar, mar_data["MAR_CHANNEL_ID"])


def get_hash(path, hash_type="sha512"):
    h = hashlib.new(hash_type)
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


class WorkEnv(object):
    def __init__(self, allowed_url_prefixes, mar=None, mbsdiff=None, arch=None):
        self.paths = dict()
        self.urls = {
            'unwrap_full_update.pl': 'https://hg.mozilla.org/mozilla-central/raw-file/default/'
            'tools/update-packaging/unwrap_full_update.pl',
            'mar': 'https://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/'
            'latest-mozilla-central/mar-tools/linux64/mar',
            'mbsdiff': 'https://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/'
            'latest-mozilla-central/mar-tools/linux64/mbsdiff'
        }
        self.allowed_url_prefixes = allowed_url_prefixes
        if mar:
            self.urls['mar'] = mar
        if mbsdiff:
            self.urls['mbsdiff'] = mbsdiff
        self.arch = arch

    async def setup(self, mar=None, mbsdiff=None):
        self.workdir = tempfile.mkdtemp()
        for filename, url in self.urls.items():
            if filename in self.paths:
                os.unlink(self.paths[filename])
            self.paths[filename] = os.path.join(self.workdir, filename)
            await retry_download(url, dest=self.paths[filename], mode=0o755)

    async def download_buildsystem_bits(self, repo, revision):
        prefix = "{repo}/raw-file/{revision}/tools/update-packaging"
        prefix = prefix.format(repo=repo, revision=revision)
        for f in ('make_incremental_update.sh', 'common.sh'):
            url = "{prefix}/{f}".format(prefix=prefix, f=f)
            await retry_download(url, dest=os.path.join(self.workdir, f), mode=0o755)

    def cleanup(self):
        shutil.rmtree(self.workdir)

    @property
    def env(self):
        my_env = os.environ.copy()
        my_env['LC_ALL'] = 'C'
        my_env['MAR'] = self.paths['mar']
        my_env['MBSDIFF'] = self.paths['mbsdiff']
        if self.arch:
            my_env['BCJ_OPTIONS'] = ' '.join(BCJ_OPTIONS[self.arch])
        return my_env


def verify_allowed_url(mar, allowed_url_prefixes):
    if not any(mar.startswith(prefix) for prefix in allowed_url_prefixes):
        raise ValueError("{mar} is not in allowed URL prefixes: {p}".format(
            mar=mar, p=allowed_url_prefixes
        ))


async def manage_partial(partial_def, artifacts_dir,
                         allowed_url_prefixes, signing_certs, arch=None):
    """Manage the creation of partial mars based on payload."""

    work_env = WorkEnv(
        allowed_url_prefixes=allowed_url_prefixes,
        mar=partial_def.get('mar_binary'),
        mbsdiff=partial_def.get('mbsdiff_binary'),
        arch=arch,
    )
    await work_env.setup()

    for mar in (partial_def["from_mar"], partial_def["to_mar"]):
        verify_allowed_url(mar, allowed_url_prefixes)

    complete_mars = {}
    use_old_format = False
    check_channels_in_files = list()
    for mar_type, f in (("from", partial_def["from_mar"]), ("to", partial_def["to_mar"])):
        dest = os.path.join(work_env.workdir, "{}.mar".format(mar_type))
        unpack_dir = os.path.join(work_env.workdir, mar_type)

        await retry_download(f, dest)

        if not os.getenv("MOZ_DISABLE_MAR_CERT_VERIFICATION"):
            verify_signature(dest, signing_certs)

        complete_mars["%s_size" % mar_type] = os.path.getsize(dest)
        complete_mars["%s_hash" % mar_type] = get_hash(dest)

        await unpack(work_env, dest, unpack_dir)

        if mar_type == 'to':
            check_channels_in_files.append(dest)

        if mar_type == 'from':
            version = get_option(unpack_dir, filename="application.ini",
                                 section="App", option="Version")
            major = int(version.split(".")[0])
            # The updater for versions less than 56.0 requires BZ2
            # compressed MAR files
            if major < 56:
                use_old_format = True
                log.info("Forcing BZ2 compression for %s", f)

        log.info("Done.")

    to_path = os.path.join(work_env.workdir, "to")
    from_path = os.path.join(work_env.workdir, "from")

    mar_data = {
        "MAR_CHANNEL_ID": os.environ["MAR_CHANNEL_ID"],
        "version": get_option(to_path, filename="application.ini",
                              section="App", option="Version"),
        "to_buildid": get_option(to_path, filename="application.ini",
                                 section="App", option="BuildID"),
        "from_buildid": get_option(from_path, filename="application.ini",
                                   section="App", option="BuildID"),
        "appName": get_option(from_path, filename="application.ini",
                              section="App", option="Name"),
        # Use Gecko repo and rev from platform.ini, not application.ini
        "repo": get_option(to_path, filename="platform.ini", section="Build",
                           option="SourceRepository"),
        "revision": get_option(to_path, filename="platform.ini",
                               section="Build", option="SourceStamp"),
        "from_mar": partial_def["from_mar"],
        "to_mar": partial_def["to_mar"],
        "locale": partial_def["locale"],
    }

    for filename in check_channels_in_files:
        validate_mar_channel_id(filename, mar_data["MAR_CHANNEL_ID"])

    for field in ("update_number", "previousVersion", "previousBuildNumber",
                  "toVersion", "toBuildNumber"):
        if field in partial_def:
            mar_data[field] = partial_def[field]
    mar_data.update(complete_mars)

    # if branch not set explicitly use repo-name
    mar_data['branch'] = partial_def.get('branch', mar_data['repo'].rstrip('/').split('/')[-1])

    mar_name = partial_def['dest_mar']

    mar_data['mar'] = mar_name
    dest_mar = os.path.join(work_env.workdir, mar_name)

    # TODO: download these once
    await work_env.download_buildsystem_bits(repo=mar_data["repo"],
                                             revision=mar_data["revision"])

    await generate_partial(work_env, from_path, to_path, dest_mar,
                           mar_data, use_old_format)

    mar_data["size"] = os.path.getsize(dest_mar)

    mar_data["hash"] = get_hash(dest_mar)

    shutil.copy(dest_mar, artifacts_dir)
    work_env.cleanup()

    return mar_data


async def async_main(args, signing_certs):
    tasks = []

    allowed_url_prefixes = list(ALLOWED_URL_PREFIXES)
    if args.allow_staging_prefixes:
        allowed_url_prefixes += STAGING_URL_PREFIXES

    task = json.load(args.task_definition)
    # TODO: verify task["extra"]["funsize"]["partials"] with jsonschema
    for definition in task["extra"]["funsize"]["partials"]:
        tasks.append(asyncio.ensure_future(retry_async(
                                           manage_partial,
                                           retry_exceptions=(
                                               aiohttp.ClientError,
                                               asyncio.TimeoutError
                                           ),
                                           kwargs=dict(
                                               partial_def=definition,
                                               artifacts_dir=args.artifacts_dir,
                                               allowed_url_prefixes=allowed_url_prefixes,
                                               signing_certs=signing_certs,
                                               arch=args.arch
                                           ))))
    manifest = await asyncio.gather(*tasks)
    return manifest


def main():

    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts-dir", required=True)
    parser.add_argument("--sha1-signing-cert", required=True)
    parser.add_argument("--sha384-signing-cert", required=True)
    parser.add_argument("--task-definition", required=True,
                        type=argparse.FileType('r'))
    parser.add_argument("--allow-staging-prefixes",
                        action="store_true",
                        default=strtobool(
                            os.environ.get('FUNSIZE_ALLOW_STAGING_PREFIXES', "false")),
                        help="Allow files from staging buckets.")
    parser.add_argument("-q", "--quiet", dest="log_level",
                        action="store_const", const=logging.WARNING,
                        default=logging.DEBUG)
    parser.add_argument('--arch', type=str, required=True,
                        choices=BCJ_OPTIONS.keys(),
                        help='The archtecture you are building.')
    args = parser.parse_args()

    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s")
    log.setLevel(args.log_level)

    signing_certs = {
        'sha1': open(args.sha1_signing_cert, 'rb').read(),
        'sha384': open(args.sha384_signing_cert, 'rb').read(),
    }

    assert(get_keysize(signing_certs['sha1']) == 2048)
    assert(get_keysize(signing_certs['sha384']) == 4096)

    loop = asyncio.get_event_loop()
    manifest = loop.run_until_complete(async_main(args, signing_certs))
    loop.close()

    manifest_file = os.path.join(args.artifacts_dir, "manifest.json")
    with open(manifest_file, "w") as fp:
        json.dump(manifest, fp, indent=2, sort_keys=True)

    log.debug("{}".format(json.dumps(manifest, indent=2, sort_keys=True)))


if __name__ == '__main__':
    main()
