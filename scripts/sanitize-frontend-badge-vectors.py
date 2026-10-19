"""Sanitize the two reviewed local SVG inputs; no network, rasterization or path edits.
Usage: python3 scripts/sanitize-frontend-badge-vectors.py <research-input-directory>
Source identity and rights caveats: references/frontend-badge-vectors.json.
"""
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
namespace = 'http://www.w3.org/2000/svg'
ET.register_namespace('', namespace)
tags = {'svg', 'g', 'defs', 'clipPath', 'path'}
attributes = {'width', 'height', 'viewBox', 'version', 'id', 'transform', 'd',
              'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'clip-path', 'clipPathUnits'}
style_properties = {'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width'}
records = json.loads((root / 'references/frontend-badge-vectors.json').read_text())
for item in records['assets']:
    data = (Path(sys.argv[1]) / item['sourceFile']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == item['sourceSha256']
    source = ET.fromstring(data)
    def clean(node):
        if node.tag not in {f'{{{namespace}}}{tag}' for tag in tags}:
            return None
        result = ET.Element(node.tag)
        for name, value in node.attrib.items():
            if name == 'style':
                for pair in value.split(';'):
                    if not pair.strip(): continue
                    key, val = pair.split(':', 1)
                    assert key.strip() in style_properties, key
                    result.set(key.strip(), val.strip())
            elif name in attributes:
                assert '<' not in value and '>' not in value
                result.set(name, value)
        for name, value in result.attrib.items():
            if name == 'clip-path':
                assert re.fullmatch(r'url\(#[A-Za-z0-9_-]+\)', value)
            else:
                assert 'url(' not in value and 'javascript:' not in value and 'data:' not in value
        for child in node:
            sanitized = clean(child)
            if sanitized is not None: result.append(sanitized)
        return result
    result = clean(source)
    if 'viewBox' not in result.attrib:
        result.set('viewBox', f"0 0 {result.get('width')} {result.get('height')}")
    assert len(list(result.iter(f'{{{namespace}}}path'))) == item['pathCount']
    output = ET.tostring(result, encoding='utf-8', xml_declaration=True) + b'\n'
    assert hashlib.sha256(output).hexdigest() == item['sanitizedSha256'], 'Reviewed output identity changed'
    (root / item['output']).write_bytes(output)
