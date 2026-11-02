#!/usr/bin/env python3
"""Add Inji's public sandbox catalog to the local BFF's AIT issuer config."""
import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CONFIG = ROOT / 'tools/local-issuer/state/mimoto-issuers-config.json'
DEFAULT_CATALOG = 'https://api.qainji.mosip.net/v1/mimoto/issuers'


def merge_catalog(local, upstream):
    """Preserve local entries and their endpoints; deduplicate by issuer ID."""
    issuers = local.get('issuers')
    remote = upstream.get('response', upstream).get('issuers')
    if not isinstance(issuers, list) or not isinstance(remote, list) or not remote:
        raise ValueError('Both inputs must contain issuer lists; upstream must not be empty')
    merged, seen = [], set()
    for entry in [*issuers, *remote]:
        issuer_id = entry.get('issuer_id')
        if not isinstance(issuer_id, str) or not issuer_id:
            raise ValueError('Every catalog entry must have an issuer_id')
        if issuer_id not in seen:
            merged.append(entry)
            seen.add(issuer_id)
    return {**local, 'issuers': merged}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=DEFAULT_CONFIG)
    parser.add_argument('--catalog-url', default=DEFAULT_CATALOG)
    parser.add_argument('--catalog-file', type=Path, help='Use an already downloaded public catalog')
    args = parser.parse_args()
    local = json.loads(args.config.read_text())
    if args.catalog_file:
        upstream = json.loads(args.catalog_file.read_text())
    else:
        if not args.catalog_url.startswith('https://'):
            parser.error('The remote catalog must use HTTPS')
        result = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--max-time', '30', args.catalog_url], check=True, capture_output=True, text=True)
        upstream = json.loads(result.stdout)
    merged = merge_catalog(local, upstream)
    # Write in place: existing Docker bind mounts must continue to see this inode.
    args.config.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + '\n')
    print(f"Issuer catalog updated: {len(merged['issuers'])} entries. Restart the BFF to clear its catalog cache.")


if __name__ == '__main__':
    main()
