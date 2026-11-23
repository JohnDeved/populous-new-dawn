"""Validate the address inventory emitted by ExportFunctionInventory.java."""
import base64
import binascii
import hashlib
import re

SHA256 = re.compile(r'[0-9a-f]{64}\Z')
ENTRY = re.compile(r'[0-9a-f]{8}\Z')
COUNT = re.compile(r'(?:0|[1-9][0-9]{0,8})\Z')
HEADER = 'pnd-ghidra-function-inventory\t1'


def read_bounded(path, max_bytes):
    with path.open('rb') as handle:
        value = handle.read(max_bytes + 1)
    if len(value) > max_bytes:
        raise ValueError(f'Oversized receipt: {path.name}')
    return value


def parse_receipt(report, complete, sections, executable_sha256, expected_version):
    """Reject incomplete, mismatched or ambiguous raw inventories; return stable JSON data."""
    raw_hash = hashlib.sha256(report).hexdigest()
    if complete != (raw_hash + '\n').encode('ascii'):
        raise ValueError('Missing or mismatched inventory completion receipt')
    if not SHA256.fullmatch(executable_sha256):
        raise ValueError('Invalid original executable identity')
    section_rows = []
    for line in sections.decode('ascii').splitlines():
        start, length, digest, name = line.split('\t')
        if not ENTRY.fullmatch(start) or not COUNT.fullmatch(length) or not SHA256.fullmatch(digest) or not name:
            raise ValueError('Malformed verified section pin')
        first = int(start, 16)
        ending = first + int(length)
        if not first < ending <= 0x100000000 or any(lo < ending and first < hi for lo, hi, _ in section_rows):
            raise ValueError('Empty or overlapping verified section pin')
        section_rows.append((first, ending, name))
    if not section_rows:
        raise ValueError('No verified section rows')

    lines = report.decode('ascii').split('\n')
    if len(lines) < 9 or lines[0] != HEADER or lines[-1]:
        raise ValueError('Missing inventory format or newline')
    expected_keys = ['ghidra', 'language', 'compiler', 'imageBase', 'external', 'nonInventoryInternal']
    metadata = {}
    for name, line in zip(expected_keys, lines[1:7]):
        key, value = line.split('\t')
        if key != name or not value:
            raise ValueError(f'Missing or unordered inventory field: {name}')
        metadata[name] = value
    if metadata['ghidra'] != expected_version:
        raise ValueError('Unexpected Ghidra version')
    if not ENTRY.fullmatch(metadata['imageBase']):
        raise ValueError('Malformed image base')
    base = int(metadata['imageBase'], 16)
    if any(not COUNT.fullmatch(metadata[key]) for key in ('external', 'nonInventoryInternal')):
        raise ValueError('Malformed classification counts')

    def decode(value, allow_empty=False):
        try:
            data = base64.b64decode(value, validate=True)
            text = data.decode('utf-8')
        except (binascii.Error, UnicodeDecodeError) as exc:
            raise ValueError('Malformed encoded inventory string') from exc
        if base64.b64encode(data).decode('ascii') != value or (not text and not allow_empty):
            raise ValueError('Malformed encoded inventory string')
        return text

    options = {}
    functions = []
    for line in lines[7:-1]:
        fields = line.split('\t')
        if fields[0] == 'option' and len(fields) == 3 and not functions:
            name = decode(fields[1])
            if name in options:
                raise ValueError('Duplicate analyzer option')
            options[name] = decode(fields[2], allow_empty=True)
        elif fields[0] == 'entry' and len(fields) == 5:
            _, entry, rva, kind, encoded_section = fields
            if not ENTRY.fullmatch(entry) or not ENTRY.fullmatch(rva) or kind not in {'routine', 'thunk'}:
                raise ValueError('Malformed inventory address or kind')
            number = int(entry, 16)
            if number - base != int(rva, 16) or (functions and functions[-1]['entry'] >= entry):
                raise ValueError('Wrong RVA, duplicate or unordered entry address')
            section = decode(encoded_section)
            if not any(lo <= number < hi and name == section for lo, hi, name in section_rows):
                raise ValueError('Address does not belong to the pinned raw section')
            functions.append({'entry': entry, 'rva': rva, 'kind': kind, 'rawSection': section})
        else:
            raise ValueError('Unexpected inventory row')
    if not options or not functions:
        raise ValueError('No analyzer settings or no discovered functions')
    thunks = sum(row['kind'] == 'thunk' for row in functions)
    return {
        'schema': 1,
        'executableSha256': executable_sha256,
        'scope': 'FunctionManager entries in loaded executable file-backed verified PE32 sections',
        'limitations': 'Analyzer-discovered entries, not a guaranteed total of game-authored functions. '
                       'Routine classification can include compiler/library code; external/import thunks are not claimed ports.',
        'analysis': {
            'ghidraVersion': expected_version,
            'language': decode(metadata['language']),
            'compiler': decode(metadata['compiler']),
            'imageBase': metadata['imageBase'],
            'metadataImport': False,
            'parseReceiptSha256': raw_hash,
            'sectionsSha256': hashlib.sha256(sections).hexdigest(),
            'options': dict(sorted(options.items())),
        },
        'counts': {
            'discoveredLocalExecutable': len(functions),
            'routines': len(functions) - thunks,
            'thunks': thunks,
            'external': int(metadata['external']),
            'nonInventoryInternal': int(metadata['nonInventoryInternal']),
        },
        'functions': functions,
    }
