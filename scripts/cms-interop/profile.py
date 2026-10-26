"""Read-only, strict DER shape checks for the ONE generated CMS profile.

No cryptographic operation, general ASN.1 engine, or DER encoder. OpenSSL owns
all encryption/decryption. RFC 5083/5084 AuthEnvelopedData and RFC 3560 OAEP.
Unknown optional fields and non-DER forms fail closed. TEST-ONLY input <=1MiB.
"""
import base64
import hashlib

CAP = 1024 * 1024
OID_AUTHENV = bytes.fromhex('2a864886f70d0109100117')
OID_DATA = bytes.fromhex('2a864886f70d010701')
OID_OAEP = bytes.fromhex('2a864886f70d010107')
OID_MGF1 = bytes.fromhex('2a864886f70d010108')
OID_SHA256 = bytes.fromhex('608648016503040201')
OID_AES256GCM = bytes.fromhex('60864801650304012e')
OID_RSA = bytes.fromhex('2a864886f70d010101')


def require(ok, code):
    if not ok:
        raise ValueError(code)


class DER:
    def __init__(self, data):
        require(isinstance(data, bytes) and 0 < len(data) <= CAP, 'der-size')
        self.data = data
        self.visits = 0

    def item(self, offset, end):
        self.visits += 1
        require(self.visits <= 256, 'der-item-cap')
        require(0 <= offset < end <= len(self.data), 'der-range')
        start = offset
        tag = self.data[offset]
        offset += 1
        require(tag & 31 != 31 and offset < end, 'der-tag')
        size = self.data[offset]
        offset += 1
        if size & 128:
            n = size & 127
            require(1 <= n <= 3 and offset + n <= end, 'der-length-form')
            require(self.data[offset] != 0, 'der-nonminimal-length')
            size = int.from_bytes(self.data[offset:offset + n], 'big')
            require(size >= 128, 'der-nonminimal-length')
            offset += n
        require(offset + size <= end, 'der-truncated')
        return (tag, start, offset, offset + size)

    def root(self):
        node = self.item(0, len(self.data))
        require(node[3] == len(self.data), 'der-trailing')
        return node

    def children(self, node, expected):
        require(node[0] & 32, 'der-not-constructed')
        result = []
        offset = node[2]
        while offset < node[3]:
            require(len(result) < 32, 'der-child-cap')
            child = self.item(offset, node[3])
            result.append(child)
            offset = child[3]
        require(len(result) == len(expected), 'der-field-count')
        require([x[0] for x in result] == list(expected), 'der-field-tags')
        return result

    def value(self, node):
        return self.data[node[2]:node[3]]

    def raw(self, node):
        return self.data[node[1]:node[3]]

    def oid(self, node, expected):
        require(node[0] == 6 and self.value(node) == expected, 'der-oid')

    def integer(self, node, value):
        require(node[0] == 2 and self.value(node) == bytes([value]), 'der-integer')


def cert_identity(pem):
    lines = pem.splitlines()
    require(lines[0] == b'-----BEGIN CERTIFICATE-----' and
            lines[-1] == b'-----END CERTIFICATE-----', 'certificate-pem')
    data = base64.b64decode(b''.join(lines[1:-1]), validate=True)
    d = DER(data)
    root = d.root()
    require(root[0] == 48, 'certificate-root')
    tbs, _, _ = d.children(root, (48, 48, 3))
    # These pinned upstream v3 certificates have extensions but no unique IDs.
    version, serial, _, issuer, _, _, spki, _ = d.children(tbs, (160, 2, 48, 48, 48, 48, 48, 163))
    d.integer(d.children(version, (2,))[0], 2)
    alg, bits = d.children(spki, (48, 3))
    oid, null = d.children(alg, (6, 5))
    d.oid(oid, OID_RSA)
    require(d.value(null) == b'', 'rsa-parameters')
    require(d.value(bits)[0] == 0, 'rsa-bit-string')
    key = DER(d.value(bits)[1:])
    modulus, exponent = key.children(key.root(), (2, 2))
    n = key.value(modulus)
    require(len(n) > 1 and n[0] == 0 and n[1] & 128, 'rsa-modulus-encoding')
    require(key.value(exponent) == b'\x01\x00\x01', 'rsa-exponent')
    return {'certificate_der_sha256': hashlib.sha256(data).hexdigest(),
            'spki_der_sha256': hashlib.sha256(d.raw(spki)).hexdigest(),
            'rsa_bits': int.from_bytes(n, 'big').bit_length(),
            'issuer_der': d.raw(issuer), 'serial_der': d.raw(serial)}



def sha256_algorithm(d, node):
    # RFC4055 section2.1: absent and zero-length NULL are equivalent.
    # Literal standard DER encodings only, not a generic parameter fallback.
    require(d.raw(node) in (
        bytes.fromhex('300b0609608648016503040201'),
        bytes.fromhex('300d06096086480165030402010500'),
    ), 'sha256-algorithm-identifier')


def inspect_cms(data, recipient, payload_size):
    d = DER(data)
    root = d.root()
    require(root[0] == 48, 'cms-root')
    kind, explicit = d.children(root, (6, 160))
    d.oid(kind, OID_AUTHENV)
    authenv, = d.children(explicit, (48,))
    version, recipients, encrypted, mac = d.children(authenv, (2, 49, 48, 4))
    d.integer(version, 0)
    ktri, = d.children(recipients, (48,))
    rv, rid, transport, key = d.children(ktri, (2, 48, 48, 4))
    d.integer(rv, 0)
    issuer, serial = d.children(rid, (48, 2))
    require(d.raw(issuer) == recipient['issuer_der'] and
            d.raw(serial) == recipient['serial_der'], 'cms-recipient')
    oid, params = d.children(transport, (6, 48))
    d.oid(oid, OID_OAEP)
    hashparam, mgfparam = d.children(params, (160, 161))
    hash_alg, = d.children(hashparam, (48,))
    sha256_algorithm(d, hash_alg)
    mgf_alg, = d.children(mgfparam, (48,))
    mgf, mgf_hash = d.children(mgf_alg, (6, 48))
    d.oid(mgf, OID_MGF1)
    sha256_algorithm(d, mgf_hash)
    require(len(d.value(key)) == recipient['rsa_bits'] // 8, 'encrypted-key-size')
    contenttype, alg, ciphertext = d.children(encrypted, (6, 48, 128))
    d.oid(contenttype, OID_DATA)
    cipher, gcm = d.children(alg, (6, 48))
    d.oid(cipher, OID_AES256GCM)
    nonce, taglength = d.children(gcm, (4, 2))
    require(len(d.value(nonce)) == 12, 'gcm-nonce-size')
    d.integer(taglength, 16)
    require(len(d.value(mac)) == 16, 'gcm-tag-size')
    require(len(d.value(ciphertext)) == payload_size, 'ciphertext-size')
    return {'ciphertext_offset': ciphertext[2], 'ciphertext_bytes': ciphertext[3] - ciphertext[2],
            'tag_offset': mac[2], 'tag_bytes': mac[3] - mac[2],
            'profile': 'CMS-AuthEnvelopedData/AES-256-GCM/RSA-OAEP-SHA256-MGF1-SHA256',
            'recipient_certificate_sha256': recipient['certificate_der_sha256'],
            'recipient_spki_sha256': recipient['spki_der_sha256']}
