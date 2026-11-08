#!/usr/bin/env python3
"""Freeze actual prepared-host inputs; does not install or infer installation.

The trusted existing job supplies the actual installation receipt and an explicit
narrow tool-root list. Unknown/missing tools fail rather than expanding mounts.
"""
import argparse
import json
from pathlib import Path
import sys
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import controller as policy
import execution
import fresh_projection as fresh
import hosted_entry
import qualification_review


def prepare(shared, checkout, installation, tools, browser, destination):
    value = {'version':1, 'kind':'material-hosted-prepared-inputs',
             'checkout':str(policy.physical(checkout)), 'git':'/usr/bin/git',
             'installation':installation, 'sharedAdapter':qualification_review.reference(shared, shared.__file__),
             'tools':tools, 'toolRoots':{name:shared.inventory_hash(hosted_entry.tool_root(shared, name, tools['readonly'])) for name in tools['readonly']},
             'browser':{'path':str(policy.physical(browser)), 'archiveSha256':policy.ARCHIVE_SHA256}}
    hosted_entry.admit(shared, value)
    fresh.inspect(shared, Path(checkout), Path('/usr/bin/git'))
    output = policy.physical(destination)
    policy.require(not any(output.is_relative_to(Path(path)) for path in [checkout, *tools['readonly']]),
                   'Manifest must not mutate a protected root')
    return hosted_entry.save_reference(shared, output, value)


def main():
    parser = argparse.ArgumentParser()
    for name in ('checkout','installation','installation-sha256','shared-adapter','shared-adapter-sha256',
                 'tools','tools-sha256','browser','output'):
        parser.add_argument('--'+name, required=True)
    args = parser.parse_args()
    shared = execution.load_shared({'path':args.shared_adapter,'sha256':args.shared_adapter_sha256})
    policy.require(policy.sha256_file(args.tools) == args.tools_sha256, 'Prepared tools manifest differs')
    tools = json.loads(Path(args.tools).read_bytes())
    with shared.envelope(120):
        result = prepare(shared, args.checkout, {'path':args.installation,'sha256':args.installation_sha256},
                         tools, args.browser, args.output)
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
