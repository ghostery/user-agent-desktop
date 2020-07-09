import yaml
import argparse
from os import listdir

parser = argparse.ArgumentParser(description='Generate Dockerfile based on taskcluster config')
parser.add_argument('config', help='config file name')
parser.add_argument('job', help='job name')

args = parser.parse_args()

CONFIG = args.config
JOB_KEY = args.job
MOZ_FETCHES_DIR = '/builds/worker/fetches/'
TOOLCHAIN_PATH = '../mozilla-release/taskcluster/ci/toolchain/'

with open(f'../mozilla-release/taskcluster/ci/build/{CONFIG}.yml') as fp:
    builds = yaml.load(fp)
    job = builds.get(JOB_KEY)

with open('../mozilla-release/taskcluster/ci/fetch/toolchains.yml') as fp:
    fetches = yaml.load(fp)

toolchains = {}
for file in listdir(TOOLCHAIN_PATH):
    if file.endswith('.yml'):
        with open(f'{TOOLCHAIN_PATH}{file}') as fp:
            default_artifact = ''
            for k, v in yaml.load(fp).items():
                toolchains[k] = v
                if 'run' not in v:
                    # print(k, v)
                    continue
                if 'toolchain-alias' in v['run']:
                    toolchains[v['run']['toolchain-alias']] = v
                    v['name'] = k
                if k == 'job-defaults':
                    default_artifact = v['run'].get('toolchain-artifact', '')
                if 'toolchain-artifact' not in v['run']:
                    v['run']['toolchain-artifact'] = default_artifact

def generate_fetch(key):
    d = fetches[key]['fetch']
    if d['type'] == 'static-url':
        filename = d['url'].split('/')[-1]
        return f'''RUN /builds/worker/bin/fetch-content {d['type']} \\
    --sha256 {d['sha256']} \\
    --size {d['size']} \\
    {d['url']} \\
    {MOZ_FETCHES_DIR}{filename} && \\
    cd {MOZ_FETCHES_DIR} && \\
    unzip {filename} && \\
    rm {filename}'''


statements = ['FROM mozbuild:base', '']
env = '\\\n    '.join([f'{k}={v}' for k, v in job['worker']['env'].items()])
statements.append('ENV ' + env)
statements.append('')

if 'fetch' in job['fetches']:
    for key in job['fetches']['fetch']:
        statements.append(generate_fetch(key))

for key in job['fetches']['toolchain']:
    if 'toolchain-artifact' in toolchains[key]['run']:
        name = toolchains[key].get('name', key)
        artifact = toolchains[key]['run']['toolchain-artifact']
        filename = artifact.split('/')[-1]
        statements.append(f'''RUN wget -O {MOZ_FETCHES_DIR}{filename} https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/gecko.cache.level-3.toolchains.v3.{name}.latest/artifacts/{artifact} && \\
    cd {MOZ_FETCHES_DIR} && \\
    tar -xf {filename} && \\
    rm {filename}''')

statements.append(f'''ENV TOOLTOOL_DIR={MOZ_FETCHES_DIR} \\
    RUSTC={MOZ_FETCHES_DIR}rustc/bin/rustc \\
    CARGO={MOZ_FETCHES_DIR}rustc/bin/cargo \\
    RUSTFMT={MOZ_FETCHES_DIR}rustc/bin/rustfmt \\
    CBINDGEN={MOZ_FETCHES_DIR}cbindgen/cbindgen
''')

if CONFIG == 'windows':
    statements.append(f'ADD vs2017_15.8.4.zip {MOZ_FETCHES_DIR}')
    statements.append(f'RUN cd {MOZ_FETCHES_DIR} && unzip vs2017_15.8.4.zip && rm vs2017_15.8.4.zip')

if 'extra-config' in job['run']:
    extra_env = '\\\n    '.join([f'{k}={v}' for k, v in job['run']['extra-config']['env'].items()])
    statements.append(f'ENV {extra_env}')

statements.append('''ENV MOZ_FETCHES_DIR=/builds/worker/fetches/ \\
    MOZCONFIG=/builds/worker/workspace/.mozconfig''')
statements.append('USER worker')

print('\n'.join(statements))
