"""Dependency-free integration check of Hugo output, including project subpaths."""
import argparse
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

parser = argparse.ArgumentParser()
parser.add_argument('--base-path', default='/')
parser.add_argument('--directory', default='public')
args = parser.parse_args()
root = Path(args.directory)
errors = []

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                errors.append(f'Duplicate id: {attrs["id"]}')
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.urls.append(attrs[key])

pages = list(root.rglob('*.html'))
assert pages, 'No generated HTML'
for page in pages:
    document = Links()
    document.feed(page.read_text())
    for link in document.urls:
        url = urlsplit(link)
        if url.scheme or url.netloc or not url.path:
            continue
        path = unquote(url.path)
        if path.startswith('/'):
            if not path.startswith(args.base_path):
                errors.append(f'{page}: link escapes configured base path: {link}')
                continue
            target = root / path[len(args.base_path):]
        else:
            target = page.parent / path
        if target.is_dir():
            target = target / 'index.html'
        if not target.is_file():
            errors.append(f'{page}: missing {link}')
for css in root.rglob('*.css'):
    for link in re.findall(r'url\([\"\']?([^\)\"\']+)', css.read_text()):
        url = urlsplit(link)
        if not url.scheme and not url.netloc and not (css.parent / unquote(url.path)).is_file():
            errors.append(f'{css}: missing CSS asset {link}')
for profile in Path('data/profiles').glob('*.yaml'):
    if not (root / 'people' / profile.stem / 'index.html').is_file():
        errors.append(f'Missing profile page: {profile.stem}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Checked {len(pages)} pages: all local links, assets, IDs, and profile routes pass.')
