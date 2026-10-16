# Revoke the Apple Development certificates earlier CI runs created, so automatic signing on a fresh runner never
# hits Apple's certificate limit. Each run's archive makes one ("Created via API"); they only sign the intermediate
# archive, so they are throwaway. Distribution signing and uploaded builds are untouched.
# Env: KEY_ID, ISSUER, KEY (path to the .p8). Needs: pip install pyjwt cryptography
import json, os, time, urllib.request
import jwt

token = jwt.encode({"iss": os.environ["ISSUER"], "iat": int(time.time()), "exp": int(time.time()) + 600, "aud": "appstoreconnect-v1"},
                   open(os.environ["KEY"]).read(), algorithm="ES256", headers={"kid": os.environ["KEY_ID"], "typ": "JWT"})
api = "https://api.appstoreconnect.apple.com/v1/certificates"

def call(url, method="GET"):
    req = urllib.request.Request(url, method=method, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as r:
        body = r.read()
    return json.loads(body) if body else None

certs = call(f"{api}?filter[certificateType]=DEVELOPMENT,IOS_DEVELOPMENT&limit=200")["data"]
for c in certs:
    a = c["attributes"]
    ci = "Created via API" in (a.get("name") or "") + (a.get("displayName") or "")
    print(f"{'revoke' if ci else 'keep  '}  {a.get('certificateType')}  {a.get('displayName') or a.get('name')}  expires {a.get('expirationDate', '')[:10]}")
    if ci:
        call(f"{api}/{c['id']}", "DELETE")
print(f"{len(certs)} development certificates found")
