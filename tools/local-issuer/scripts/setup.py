#!/usr/bin/env python3
"""Create local-only issuer keys and import its public CA/client key safely."""
from pathlib import Path
import os, subprocess
ROOT=Path(__file__).resolve().parents[3]
STATE=ROOT/'tools/local-issuer/state'
STATE.mkdir(exist_ok=True,mode=0o700)
os.umask(0o077)
def run(*args, env=None):
    return subprocess.run(args,check=True,capture_output=True,text=True,env=env).stdout.strip()
def openssl(*args): return run('openssl',*map(str,args))
(STATE/'ca.cnf').write_text('[req]\ndistinguished_name=dn\nx509_extensions=ca\nprompt=no\n[dn]\nCN=AIT Local Demo Development CA\n[ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\nsubjectKeyIdentifier=hash\n')
if not (STATE/'ca.pem').exists():
    openssl('req','-x509','-newkey','rsa:3072','-nodes','-sha256','-days','365',
        '-keyout',STATE/'ca-key.pem','-out',STATE/'ca.pem','-subj','/CN=AIT Local Demo Development CA',
        '-extensions','ca','-config',STATE/'ca.cnf')
if not (STATE/'tls-key.pem').exists():
    openssl('req','-new','-newkey','rsa:3072','-nodes','-keyout',STATE/'tls-key.pem',
        '-out',STATE/'tls.csr','-subj','/CN=localhost')
    (STATE/'tls.ext').write_text('subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n')
    openssl('x509','-req','-in',STATE/'tls.csr','-CA',STATE/'ca.pem','-CAkey',STATE/'ca-key.pem',
        '-CAcreateserial','-out',STATE/'tls-cert.pem','-days','90','-sha256','-extfile',STATE/'tls.ext')
for name in ['issuer','client']:
    if not (STATE/f'{name}-key.pem').exists():
        openssl('genpkey','-algorithm','RSA','-pkeyopt',f'rsa_keygen_bits:{2048 if name == "issuer" else 3072}','-out',STATE/f'{name}-key.pem')
# Extract the public client JWK using the established jose library.
js="const fs=require('fs'),c=require('crypto');fs.writeFileSync(process.argv[2],JSON.stringify(c.createPublicKey(fs.readFileSync(process.argv[1])).export({format:'jwk'}),null,2)+'\\n');"
run('node','-e',js,str(STATE/'client-key.pem'),str(STATE/'client-public.jwk'))
env=os.environ.copy()
for line in (ROOT/'apps/bff/.env').read_text().splitlines():
    if line.startswith('OIDC_P12_PASSWORD='): env['AIT_KEYSTORE_PASSWORD']=line.split('=',1)[1].strip().strip('"\'')
env.setdefault('AIT_KEYSTORE_PASSWORD','dummypassword')
if not (STATE/'client-cert.pem').exists():
    openssl('req','-new','-x509','-key',STATE/'client-key.pem','-out',STATE/'client-cert.pem','-days','365','-subj','/CN=ait-wallet-mobile-client')
run('openssl','pkcs12','-export','-name','ait-wallet-mobile-client','-inkey',str(STATE/'client-key.pem'),
    '-in',str(STATE/'client-cert.pem'),'-out',str(STATE/'client.p12'),'-passout','env:AIT_KEYSTORE_PASSWORD',env=env)
# Modify only the additional client alias; preserve ROOT, MIMOTO, and all DB state.
run('docker','cp',str(STATE/'client.p12'),'ait-wallet-bff:/tmp/ait-local-client.p12')
result=subprocess.run(['docker','exec','ait-wallet-bff','sh','-c','keytool -list -keystore /home/mosip/certs/oidckeystore.p12 -storepass:env oidc_p12_password -alias ait-wallet-mobile-client'],capture_output=True)
if result.returncode:
    run('docker','exec','ait-wallet-bff','sh','-c',
        'keytool -importkeystore -noprompt -srckeystore /tmp/ait-local-client.p12 -srcstoretype PKCS12 -srcstorepass:env oidc_p12_password -srcalias ait-wallet-mobile-client -destkeystore /home/mosip/certs/oidckeystore.p12 -deststoretype PKCS12 -deststorepass:env oidc_p12_password')
# Refuse an unrelated existing alias instead of replacing a server's key.
actual=run('docker','exec','ait-wallet-bff','sh','-c',
    'keytool -exportcert -rfc -alias ait-wallet-mobile-client -keystore /home/mosip/certs/oidckeystore.p12 -storepass:env oidc_p12_password')
exported=STATE/'registered-client-cert.pem'
exported.write_text(actual+'\n')
expected=openssl('x509','-in',STATE/'client-cert.pem','-noout','-fingerprint','-sha256')
observed=openssl('x509','-in',exported,'-noout','-fingerprint','-sha256')
if expected != observed:
    raise SystemExit('Existing OAuth alias differs from the fixture key. Preserve it; resolve registration before proceeding.')
run('docker','exec','ait-wallet-bff','rm','-f','/tmp/ait-local-client.p12')
trust=STATE/'mimoto-cacerts'
if not trust.exists():
    java_cacerts=run('docker','exec','ait-wallet-bff','sh','-c','readlink -f "$JAVA_HOME/lib/security/cacerts"')
    run('docker','cp',f'ait-wallet-bff:{java_cacerts}',str(trust))
    run('keytool','-importcert','-noprompt','-alias','ait-local-demo-ca','-file',str(STATE/'ca.pem'),'-keystore',str(trust),'-storepass','changeit')
openssl('x509','-in',STATE/'ca.pem','-outform','DER','-out',STATE/'ca.der')
# Only certificate/public material is world-readable. Server runs as the current local UID.
for p in STATE.iterdir(): p.chmod(0o600)
for name in ['ca.pem','ca.der','client-public.jwk','tls-cert.pem','mimoto-cacerts']: (STATE/name).chmod(0o644)
print('Local keys ready; existing Mimoto keystore/DB preserved. JVM truststore retains public roots.')
