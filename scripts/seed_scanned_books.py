#!/usr/bin/env python3
"""
Импорт отсканированных книг (docx с постраничными картинками) в платформу:
docx → страницы-картинки (в порядке чтения) → Storage(books) → Module «Учебник
(сканы)» + BookPage. Просмотр = InteractiveBookReader (как у детей).

Запуск: python scripts/seed_scanned_books.py [f2|f3|f4|s1|all]
"""
import sys, os, re, io, json, zipfile, urllib.request, urllib.error
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_env():
    for name in ('.env.lingaphone', '.env'):
        p = os.path.join(ROOT, name)
        if os.path.exists(p):
            env = {}
            for line in open(p, encoding='utf-8'):
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip().strip('"')
            if env.get('SUPABASE_URL'):
                return env
    raise SystemExit('no .env with SUPABASE_URL')

ENV = load_env()
SUPA = ENV['SUPABASE_URL'].rstrip('/')
SVC = ENV['SUPABASE_SERVICE_KEY']

BOOKS = {
    'f2': dict(docx='fairyland_2_vocabulary_and_grammar(pdfgear.com).docx',
               book_id='a0000000-0000-4000-8000-0000000000f2', slug='fairyland-2'),
    'f3': dict(docx='fairyland_3 vocabulary grammar practice_(pdfgear.com).docx',
               book_id='a0000000-0000-4000-8000-0000000000f3', slug='fairyland-3'),
    'f4': dict(docx='fairyland_4_v_gr(pdfgear.com).docx',
               book_id='a0000000-0000-4000-8000-0000000000f4', slug='fairyland-4'),
    's1': dict(docx='SPARK GM 1 3500.docx',
               book_id='a0000000-0000-4000-8000-000000000051', slug='spark-1'),
}


def http(method, url, headers=None, data=None):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def rest(path, method='GET', body=None, prefer=None):
    h = {'apikey': SVC, 'Authorization': 'Bearer ' + SVC, 'Content-Type': 'application/json'}
    if prefer:
        h['Prefer'] = prefer
    status, raw = http(method, f'{SUPA}/rest/v1/{path}', h, json.dumps(body).encode() if body is not None else None)
    if status >= 300:
        raise SystemExit(f'{method} {path} -> {status}: {raw[:300]}')
    return json.loads(raw) if raw else None


def extract_pages(docx):
    """Ordered list of (bytes, ext, w, h) for full-page portrait images."""
    z = zipfile.ZipFile(os.path.join(ROOT, docx))
    rels = z.read('word/_rels/document.xml.rels').decode('utf-8', 'ignore')
    rid2t = {m.group(1): m.group(2) for m in re.finditer(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels)}
    xml = z.read('word/document.xml').decode('utf-8', 'ignore')
    order = re.findall(r'(?:r:embed|r:id)="(rId\d+)"', xml)
    seen, out = set(), []
    for rid in order:
        t = rid2t.get(rid)
        if not t or not t.startswith('media/'):
            continue
        media = 'word/' + t
        if media in seen:
            continue
        seen.add(media)
        try:
            data = z.read(media)
            im = Image.open(io.BytesIO(data))
            w, h = im.size
        except Exception:
            continue
        if h > 2000 and h >= w:
            ext = 'png' if media.lower().endswith('.png') else 'jpeg'
            out.append((data, ext, w, h))
    return out


def upload(path, data, ext):
    ctype = 'image/png' if ext == 'png' else 'image/jpeg'
    h = {'apikey': SVC, 'Authorization': 'Bearer ' + SVC, 'Content-Type': ctype, 'x-upsert': 'true'}
    status, raw = http('POST', f'{SUPA}/storage/v1/object/books/{path}', h, data)
    if status >= 300:
        raise SystemExit(f'upload {path} -> {status}: {raw[:200]}')
    return f'{SUPA}/storage/v1/object/public/books/{path}'


def seed(key):
    cfg = BOOKS[key]
    print(f'\n=== {cfg["slug"]} ===')
    pages = extract_pages(cfg['docx'])
    print(f'  извлечено страниц: {len(pages)}')
    if not pages:
        print('  нет страниц — пропуск')
        return

    # чистим прежний модуль сканов (идемпотентность)
    old = rest(f'Module?bookId=eq.{cfg["book_id"]}&title=eq.%D0%A3%D1%87%D0%B5%D0%B1%D0%BD%D0%B8%D0%BA%20(%D1%81%D0%BA%D0%B0%D0%BD%D1%8B)&select=id')
    for m in old or []:
        rest(f'BookPage?moduleId=eq.{m["id"]}', 'DELETE')
        rest(f'Module?id=eq.{m["id"]}', 'DELETE')

    mod = rest('Module', 'POST', {'bookId': cfg['book_id'], 'title': 'Учебник (сканы)', 'order': 999, 'pageCount': 0}, 'return=representation')[0]
    mid = mod['id']

    for i, (data, ext, w, h) in enumerate(pages, start=1):
        url = upload(f'scan/{cfg["slug"]}/page-{i:03}.{ext}', data, ext)
        rest('BookPage', 'POST', {'moduleId': mid, 'pageNumber': i, 'imageUrl': url, 'imageWidth': w, 'imageHeight': h})
        if i % 10 == 0 or i == len(pages):
            print(f'    страница {i}/{len(pages)}')

    rest(f'Module?id=eq.{mid}', 'PATCH', {'pageCount': len(pages)})
    rest(f'Book?id=eq.{cfg["book_id"]}', 'PATCH', {'isPublished': True})
    print(f'  DONE: модуль {mid}, {len(pages)} страниц')


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    keys = list(BOOKS.keys()) if which == 'all' else [which]
    for k in keys:
        seed(k)
