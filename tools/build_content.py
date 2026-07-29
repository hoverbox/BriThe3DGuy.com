from pathlib import Path
from datetime import date, datetime, timezone
import json
import re
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'


def slugify(value):
    value = str(value or '').lower().strip().replace('&', 'and')
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', value))


def read_markdown(path):
    text = path.read_text(encoding='utf-8')
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', text, re.S)
    if not match:
        raise ValueError(f'Missing YAML front matter: {path.relative_to(ROOT)}')
    return yaml.safe_load(match.group(1)) or {}, match.group(2).strip()


def read_grouped_file(path, key):
    if not path.exists():
        return []
    meta, _body = read_markdown(path)
    items = meta.get(key, [])
    if items is None:
        return []
    if not isinstance(items, list):
        raise ValueError(f'`{key}` must be a list in {path.relative_to(ROOT)}')
    result = []
    for index, raw in enumerate(items, start=1):
        if not isinstance(raw, dict):
            raise ValueError(f'Entry {index} under `{key}` must be a mapping in {path.relative_to(ROOT)}')
        item = dict(raw)
        item['_source'] = f'{path.relative_to(ROOT).as_posix()} entry {index}'
        result.append(item)
    return result


def read_tutorials():
    files = [
        CONTENT / 'tutorials' / '3d-graphics.md',
        CONTENT / 'tutorials' / 'animation.md',
        CONTENT / 'tutorials' / 'game-development.md',
    ]
    items = []
    for path in files:
        items.extend(read_grouped_file(path, 'tutorials'))
    return items

def youtube_id(url):
    value = str(url or '')
    match = re.search(r'(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})', value)
    return match.group(1) if match else value


def validate_unique(items, field, label, allow_blank=False):
    seen = {}
    for item in items:
        value = str(item.get(field) or '').strip()
        if not value and allow_blank:
            continue
        if not value:
            raise ValueError(f'Missing {field} in {item.get("_source", "content")}: {item.get("title", "Untitled")}')
        if value in seen:
            raise ValueError(f'Duplicate {label} `{value}` in {seen[value]} and {item.get("_source")}')
        seen[value] = item.get('_source')


def require_fields(items, fields, label):
    for item in items:
        missing = [field for field in fields if not str(item.get(field) or '').strip()]
        if missing:
            raise ValueError(f'{label} `{item.get("title", item.get("id", "Untitled"))}` is missing: {", ".join(missing)} ({item.get("_source")})')


def normalize_date(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()[:10]
    return str(value or '').strip()


def date_sort_value(value):
    value = normalize_date(value)
    try:
        return datetime.fromisoformat(value).replace(tzinfo=timezone.utc).timestamp()
    except ValueError:
        return 0


def write_json_and_js(name, js_global, data, comment):
    data_dir = ROOT / 'data'
    data_dir.mkdir(exist_ok=True)
    payload = json.dumps(data, indent=2, ensure_ascii=False)
    (data_dir / f'{name}.json').write_text(payload + '\n', encoding='utf-8')
    (data_dir / f'{name}-data.js').write_text(
        f'// {comment} Do not edit directly.\nwindow.{js_global} = {payload};\n',
        encoding='utf-8'
    )


def build():
    tutorials = read_tutorials()
    require_fields(tutorials, ['id', 'title', 'section', 'topic', 'youtube'], 'Tutorial')
    validate_unique(tutorials, 'id', 'tutorial id')
    validate_unique(tutorials, 'youtube', 'YouTube URL')
    for item in tutorials:
        item['youtubeId'] = youtube_id(item.pop('youtube'))
        item['topicSlug'] = slugify(item.get('topic'))
        item['publishedOrder'] = item.pop('published_order', item.get('publishedOrder', 0))
        if item.get('date'):
            item['date'] = normalize_date(item['date'])
        item.pop('_source', None)
    tutorials.sort(key=lambda item: (int(item.get('publishedOrder') or 0), item.get('title', '')), reverse=True)

    downloads = read_grouped_file(CONTENT / 'downloads' / 'downloads.md', 'downloads')
    require_fields(downloads, ['id', 'title', 'category', 'provider', 'url'], 'Download')
    validate_unique(downloads, 'id', 'download id')
    validate_unique(downloads, 'url', 'download URL')
    for item in downloads:
        item['categorySlug'] = slugify(item.get('category'))
        item['publishedOrder'] = item.pop('published_order', item.get('publishedOrder', 0))
        if item.get('date'):
            item['date'] = normalize_date(item['date'])
        item.pop('_source', None)
    downloads.sort(key=lambda item: (int(item.get('publishedOrder') or 0), item.get('title', '')), reverse=True)

    updates = read_grouped_file(CONTENT / 'updates' / 'x-updates.md', 'updates')
    require_fields(updates, ['id', 'title'], 'Update')
    validate_unique(updates, 'id', 'update id')
    for item in updates:
        item['date'] = normalize_date(item.get('date'))
    updates.sort(key=lambda item: (date_sort_value(item.get('date')), item.get('title', '')), reverse=True)

    featured_candidates = [u for u in updates if bool(u.get('featured')) and str(u.get('x_post_url') or '').strip()]
    featured = featured_candidates[0] if featured_candidates else (updates[0] if updates else {})
    featured_x_post = {
        'title': str(featured.get('title') or 'Featured update from BriThe3DGuy'),
        'xPostUrl': str(featured.get('x_post_url') or '').strip(),
        'description': str(featured.get('description') or '').strip(),
    }

    write_json_and_js('tutorials', 'TUTORIAL_DATA', tutorials, 'Generated from grouped tutorial Markdown files.')
    write_json_and_js('downloads', 'DOWNLOAD_DATA', downloads, 'Generated from the grouped downloads Markdown file.')
    write_json_and_js('updates', 'FEATURED_X_POST', featured_x_post, 'Generated from the grouped X updates Markdown file.')

    section_counts = {}
    for item in tutorials:
        section_counts[item['section']] = section_counts.get(item['section'], 0) + 1

    print(f'Built {len(tutorials)} tutorials, {len(downloads)} downloads, and {len(updates)} updates from Markdown.')
    for section in ('3D Graphics', 'Animation', 'Game Development'):
        print(f'  {section}: {section_counts.get(section, 0)} tutorials')
    print(f'  Downloads: {len(downloads)} products')
    print(f'  Featured X post: {featured_x_post["title"]}')


if __name__ == '__main__':
    try:
        build()
    except Exception as exc:
        print(f'CONTENT BUILD FAILED: {exc}', file=sys.stderr)
        sys.exit(1)
