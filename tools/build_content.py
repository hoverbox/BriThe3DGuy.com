from pathlib import Path
import json
import re
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]


def slugify(value):
    value = str(value or '').lower().strip().replace('&', 'and')
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', value))


def read_markdown(path):
    text = path.read_text(encoding='utf-8')
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', text, re.S)
    if not match:
        raise ValueError(f'Missing YAML front matter: {path}')
    return yaml.safe_load(match.group(1)) or {}, match.group(2).strip()


def read_grouped_collection(folder, list_key):
    items = []
    for path in sorted(folder.glob('*.md')):
        meta, body = read_markdown(path)
        grouped = meta.get(list_key)
        if grouped is not None:
            if not isinstance(grouped, list):
                raise ValueError(f'`{list_key}` must be a list in {path}')
            default_section = meta.get('section')
            for entry in grouped:
                if not isinstance(entry, dict):
                    raise ValueError(f'Every `{list_key}` entry must be a mapping in {path}')
                item = dict(entry)
                if default_section and not item.get('section'):
                    item['section'] = default_section
                item['_source'] = path.relative_to(ROOT).as_posix()
                items.append(item)
        else:
            # Backward-compatible support for a single entry in one Markdown file.
            item = dict(meta)
            item['id'] = str(item.get('id') or path.stem)
            if body and not item.get('description'):
                item['description'] = re.sub(r'\s+', ' ', body)
            item['_source'] = path.relative_to(ROOT).as_posix()
            items.append(item)
    return items


def youtube_id(url):
    value = str(url or '')
    match = re.search(r'(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})', value)
    return match.group(1) if match else value


def validate_unique(items, field, label):
    seen = {}
    for item in items:
        value = str(item.get(field) or '').strip()
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


tutorials = read_grouped_collection(ROOT / 'content' / 'tutorials', 'tutorials')
require_fields(tutorials, ['id', 'title', 'section', 'topic', 'youtube'], 'Tutorial')
validate_unique(tutorials, 'id', 'tutorial id')
validate_unique(tutorials, 'youtube', 'YouTube URL')
for item in tutorials:
    item['youtubeId'] = youtube_id(item.pop('youtube', item.get('youtubeId', '')))
    item['topicSlug'] = slugify(item.get('topic'))
    item['publishedOrder'] = item.pop('published_order', item.get('publishedOrder', 0))
    item.pop('_source', None)


updates_path = ROOT / 'content' / 'updates' / 'updates.md'
updates_meta, updates_body = read_markdown(updates_path) if updates_path.exists() else ({}, '')
featured_x_post = updates_meta.get('featured_x_post') or {}
if not isinstance(featured_x_post, dict):
    raise ValueError('`featured_x_post` must be a mapping in content/updates/updates.md')
featured_x_post = {
    'title': str(featured_x_post.get('title') or 'Featured update from BriThe3DGuy'),
    'xPostUrl': str(featured_x_post.get('x_post_url') or '').strip(),
    'description': str(featured_x_post.get('description') or '').strip(),
}

downloads = read_grouped_collection(ROOT / 'content' / 'downloads', 'downloads')
require_fields(downloads, ['id', 'title', 'category', 'provider', 'url'], 'Download')
validate_unique(downloads, 'id', 'download id')
validate_unique(downloads, 'url', 'download URL')
for item in downloads:
    item['categorySlug'] = slugify(item.get('category'))
    item['publishedOrder'] = item.pop('published_order', item.get('publishedOrder', 0))
    item.pop('_source', None)

(ROOT / 'data').mkdir(exist_ok=True)
(ROOT / 'data' / 'tutorials.json').write_text(json.dumps(tutorials, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
(ROOT / 'data' / 'tutorials-data.js').write_text('// Generated from the three subject Markdown files. Do not edit directly.\nwindow.TUTORIAL_DATA = ' + json.dumps(tutorials, indent=2, ensure_ascii=False) + ';\n', encoding='utf-8')
(ROOT / 'data' / 'downloads.json').write_text(json.dumps(downloads, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
(ROOT / 'data' / 'downloads-data.js').write_text('// Generated from content/downloads/downloads.md. Do not edit directly.\nwindow.DOWNLOAD_DATA = ' + json.dumps(downloads, indent=2, ensure_ascii=False) + ';\n', encoding='utf-8')
(ROOT / 'data' / 'updates.json').write_text(json.dumps(featured_x_post, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
(ROOT / 'data' / 'updates-data.js').write_text('// Generated from content/updates/updates.md. Do not edit directly.\nwindow.FEATURED_X_POST = ' + json.dumps(featured_x_post, indent=2, ensure_ascii=False) + ';\n', encoding='utf-8')

section_counts = {}
for item in tutorials:
    section_counts[item['section']] = section_counts.get(item['section'], 0) + 1
print(f'Built {len(tutorials)} tutorials, {len(downloads)} downloads, and the featured X post settings from Markdown.')
for section in ('3D Graphics', 'Animation', 'Game Development'):
    print(f'  {section}: {section_counts.get(section, 0)} tutorials')
print(f'  Downloads: {len(downloads)} products')
