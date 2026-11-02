import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('sync_inji', Path(__file__).with_name('sync-inji-issuers.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CatalogMergeTests(unittest.TestCase):
    def test_preserves_ait_and_upstream_endpoints_and_is_idempotent(self):
        ait = {'issuer_id': 'AITRegistrar', 'token_endpoint': 'http://localhost:8099/v1/mimoto/get-token/AITRegistrar'}
        cloud = {'issuer_id': 'Insurance', 'token_endpoint': 'https://example.org/token'}
        local = {'issuers': [ait]}
        remote = {'response': {'issuers': [cloud, {'issuer_id': 'AITRegistrar'}]}}
        merged = module.merge_catalog(local, remote)
        self.assertEqual(merged['issuers'], [ait, cloud])
        self.assertEqual(module.merge_catalog(merged, remote), merged)

    def test_rejects_invalid_catalog_before_writing(self):
        for remote in [{}, {'response': {'issuers': []}}, {'issuers': [{}]}]:
            with self.assertRaises(ValueError):
                module.merge_catalog({'issuers': []}, remote)


if __name__ == '__main__':
    unittest.main()
