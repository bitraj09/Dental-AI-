import requests
path = r"d:\all project\dental\public\uploads\1776929946953-panoramic-(1).jpg"
with open(path, 'rb') as f:
    r = requests.post('http://127.0.0.1:8001/landmarks', files={'file': f})
print('status', r.status_code)
print('headers', r.headers.get('content-type'))
print(r.text[:10000])
