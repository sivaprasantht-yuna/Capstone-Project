"""
DNS Fix: Patches Python's socket resolver to use Google DNS (8.8.8.8)
for Supabase hostnames when the local DNS server is broken/misconfigured.

Import this module BEFORE any database connections are made.
"""
import socket
import struct
import os

# --------------------------------------------------------------------------- #
#  Lightweight DNS-over-UDP resolver (no external dependencies)               #
# --------------------------------------------------------------------------- #

def _query_dns(hostname: str, dns_server: str = "8.8.8.8", timeout: float = 3.0):
    """
    Send a DNS A/AAAA query to dns_server and return the first IP address.
    Works without any third-party library.
    """
    # Build minimal DNS query for hostname (type A = 1, AAAA = 28)
    def _build_query(name: str, qtype: int) -> bytes:
        txid = os.urandom(2)
        flags = b"\x01\x00"          # standard query, recursion desired
        qdcount = b"\x00\x01"
        ancount = arcount = nscount = b"\x00\x00"
        header = txid + flags + qdcount + ancount + nscount + arcount
        # Encode QNAME
        qname = b""
        for label in name.split("."):
            encoded = label.encode()
            qname += bytes([len(encoded)]) + encoded
        qname += b"\x00"
        qtype_b = struct.pack(">H", qtype)
        qclass = b"\x00\x01"          # IN
        return header + qname + qtype_b + qclass

    def _parse_ip(data: bytes, offset: int, qtype: int) -> str | None:
        """Parse answer RR and return IP string, or None."""
        # Skip name (may be pointer)
        if (data[offset] & 0xC0) == 0xC0:
            offset += 2
        else:
            while data[offset] != 0:
                offset += data[offset] + 1
            offset += 1
        rtype = struct.unpack(">H", data[offset:offset+2])[0]
        offset += 8  # skip type, class, ttl
        rdlength = struct.unpack(">H", data[offset:offset+2])[0]
        offset += 2
        rdata = data[offset:offset+rdlength]
        if rtype == 1 and rdlength == 4:   # A record
            return ".".join(str(b) for b in rdata)
        if rtype == 28 and rdlength == 16: # AAAA record
            groups = [struct.unpack(">H", rdata[i:i+2])[0] for i in range(0, 16, 2)]
            return ":".join(f"{g:04x}" for g in groups)
        return None

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    try:
        for qtype in (1, 28):  # Try A first, then AAAA
            query = _build_query(hostname, qtype)
            sock.sendto(query, (dns_server, 53))
            try:
                response, _ = sock.recvfrom(512)
            except socket.timeout:
                continue
            ancount = struct.unpack(">H", response[6:8])[0]
            if ancount == 0:
                continue
            # Skip header (12 bytes) + question section
            offset = 12
            # Skip QNAME
            while response[offset] != 0:
                if (response[offset] & 0xC0) == 0xC0:
                    offset += 2
                    break
                offset += response[offset] + 1
            else:
                offset += 1
            offset += 4  # QTYPE + QCLASS
            # Parse first answer
            ip = _parse_ip(response, offset, qtype)
            if ip:
                return ip
    finally:
        sock.close()
    return None


# --------------------------------------------------------------------------- #
#  Monkeypatch socket.getaddrinfo for *.supabase.co / *.supabase.com         #
# --------------------------------------------------------------------------- #

_PATCHED_HOSTS: dict[str, str] = {}   # cache
_original_getaddrinfo = socket.getaddrinfo


def _patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    host_str = str(host) if host else ""
    if "supabase" in host_str:
        if host_str not in _PATCHED_HOSTS:
            resolved = _query_dns(host_str)
            if resolved:
                print(f"[DNS-Fix] Resolved {host_str} → {resolved} via 8.8.8.8")
                _PATCHED_HOSTS[host_str] = resolved
            else:
                print(f"[DNS-Fix] Could not resolve {host_str} via 8.8.8.8, using original resolver")

        if host_str in _PATCHED_HOSTS:
            # Use the resolved IP; let AF_UNSPEC pick the right family
            return _original_getaddrinfo(_PATCHED_HOSTS[host_str], port, family, type, proto, flags)

    return _original_getaddrinfo(host, port, family, type, proto, flags)


socket.getaddrinfo = _patched_getaddrinfo
print("[DNS-Fix] Socket resolver patched — Supabase hostnames will use Google DNS (8.8.8.8)")
