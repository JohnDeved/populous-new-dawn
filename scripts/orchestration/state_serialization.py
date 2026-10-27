"""Exact supported pnpm state serializations, never semantic-only acceptance."""
import json

TOP = ('lastValidatedTimestamp', 'projects', 'pnpmfiles', 'settings', 'filteredInstall')
SETTINGS = (
    'enableGlobalVirtualStore', 'autoInstallPeers', 'catalogs', 'dedupeDirectDeps',
    'dedupeInjectedDeps', 'dedupePeerDependents', 'dedupePeers', 'dev',
    'excludeLinksFromLockfile', 'hoistPattern', 'hoistWorkspacePackages',
    'injectWorkspacePackages', 'linkWorkspacePackages', 'minimumReleaseAge',
    'minimumReleaseAgeIgnoreMissingTime', 'nodeLinker', 'optional',
    'peersSuffixMaxLength', 'preferWorkspacePackages', 'production',
    'publicHoistPattern', 'workspacePackagePatterns',
)


def require(value, message):
    if not value:
        raise ValueError(message)


def unique(pairs):
    value = {}
    for key, item in pairs:
        require(key not in value, 'Duplicate state JSON key')
        value[key] = item
    return value


def reject_nonfinite(_):
    raise ValueError('Nonfinite state JSON')


def decode(body):
    require(type(body) is bytes and len(body) <= 1024 * 1024, 'Bounded state bytes required')
    value = json.loads(body, object_pairs_hook=unique, parse_constant=reject_nonfinite)
    require(type(value) is dict and set(value) == set(TOP), 'Unsupported state schema')
    require(type(value['lastValidatedTimestamp']) is int, 'Integer state timestamp required')
    return value


def compact(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=True, allow_nan=False) + '\n').encode()


def ordered(value):
    if type(value) is dict:
        return {key: ordered(value[key]) for key in sorted(value)}
    if type(value) is list:
        return [ordered(item) for item in value]
    return value


def pnpm_bytes(value):
    require(type(value['settings']) is dict and set(value['settings']) == set(SETTINGS),
            'Unsupported compact state settings')
    require(type(value['projects']) is dict and len(value['projects']) == 1,
            'Unsupported compact project count')
    require(all(type(project) is dict and set(project) == {'name', 'version'}
                for project in value['projects'].values()), 'Unsupported compact project schema')
    require(value['pnpmfiles'] == [] and type(value['filteredInstall']) is bool,
            'Unsupported compact state hooks/filter')
    output = {key: ordered(value[key]) for key in TOP}
    output['settings'] = {key: ordered(value['settings'][key]) for key in SETTINGS}
    return (json.dumps(output, indent=2, ensure_ascii=False, allow_nan=False) + '\n').encode()


def profile(body):
    value = decode(body)
    if body == compact(value):
        pnpm_bytes(value)  # Check the compact-to-pnpm schema during planning.
        return 'sorted-compact-to-pnpm-v11', value
    marker = ('"lastValidatedTimestamp": ' + str(value['lastValidatedTimestamp'])).encode()
    pretty = (json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + '\n').encode()
    require(body == pretty and body.count(marker) == 1, 'Unsupported state byte serialization')
    return 'exact-two-space-timestamp', value


def expected_after(before, new_value):
    name, old = profile(before)
    if name == 'sorted-compact-to-pnpm-v11':
        return pnpm_bytes(new_value), name
    marker = ('"lastValidatedTimestamp": ' + str(old['lastValidatedTimestamp'])).encode()
    replacement = ('"lastValidatedTimestamp": ' + str(new_value['lastValidatedTimestamp'])).encode()
    return before.replace(marker, replacement, 1), name
