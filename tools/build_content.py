from pathlib import Path
from datetime import date, datetime, timezone
import json
import math
import re
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'

RANK_META = [
    ('Peon', '🪨', '#888899', 'Every master starts with a blank viewport.'),
    ('Squire', '🛡️', '#78909C', 'You have picked up the tools and learned the basics.'),
    ('Fighter', '⚔️', '#42A5F5', 'You are building confidence and finishing real projects.'),
    ('Ranger', '🏹', '#66BB6A', 'You move quickly and know where to find the right tool.'),
    ('Mage', '🔮', '#AB47BC', 'Materials, nodes, and systems are beginning to bend to your will.'),
    ('Rogue', '🗡️', '#FFA726', 'You work efficiently and know the shortcuts others miss.'),
    ('Dragoon', '🐉', '#EF5350', 'You can leap between tools and carry ideas across the pipeline.'),
    ('Paladin', '✨', '#FFD600', 'Your workflow is disciplined, reliable, and powerful.'),
    ('Archmage', '🌌', '#00E5FF', 'You have mastered advanced creative techniques.'),
    ('Legendary', '👑', '#FF5722', 'You have conquered nearly every challenge currently available.'),
]


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


def parse_duration(value):
    """Convert M:SS or H:MM:SS into seconds. Blank durations earn 0 XP."""
    text = str(value or '').strip()
    if not text:
        return 0
    parts = text.split(':')
    if len(parts) not in (2, 3) or any(not p.isdigit() for p in parts):
        raise ValueError(f'Invalid duration `{text}`. Use M:SS or H:MM:SS.')
    numbers = [int(p) for p in parts]
    if len(numbers) == 2:
        minutes, seconds = numbers
        if seconds >= 60:
            raise ValueError(f'Invalid duration `{text}`: seconds must be under 60.')
        return minutes * 60 + seconds
    hours, minutes, seconds = numbers
    if minutes >= 60 or seconds >= 60:
        raise ValueError(f'Invalid duration `{text}`: minutes and seconds must be under 60.')
    return hours * 3600 + minutes * 60 + seconds


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


def build_progression(total_xp):
    rank_count = len(RANK_META)
    legendary_xp = max(0, int(round(total_xp * 0.90)))
    curve_power = 1.58
    ranks = []
    previous = -1
    for index, (title, badge, color, desc) in enumerate(RANK_META):
        if index == 0 or legendary_xp == 0:
            threshold = 0
        else:
            fraction = index / (rank_count - 1)
            raw = legendary_xp * (fraction ** curve_power)
            threshold = int(round(raw / 5.0) * 5)
            threshold = max(previous + 1, threshold)
        previous = threshold
        ranks.append({
            'level': index + 1,
            'title': title,
            'minXP': threshold,
            'badge': badge,
            'color': color,
            'desc': desc,
        })
    if ranks:
        ranks[-1]['minXP'] = legendary_xp
    return {
        'generated': datetime.now(timezone.utc).isoformat(),
        'xpRule': '1 second of tutorial video equals 1 XP',
        'totalAvailableXP': total_xp,
        'legendaryXP': legendary_xp,
        'curvePower': curve_power,
        'ranks': ranks,
    }


def build():
    tutorials = read_tutorials()
    require_fields(tutorials, ['id', 'title', 'section', 'topic', 'youtube'], 'Tutorial')
    validate_unique(tutorials, 'id', 'tutorial id')
    validate_unique(tutorials, 'youtube', 'YouTube URL')
    missing_durations = []
    for item in tutorials:
        duration = str(item.get('duration') or '').strip()
        try:
            duration_seconds = parse_duration(duration)
        except ValueError as exc:
            raise ValueError(f'{exc} ({item.get("_source")}: {item.get("title")})') from exc
        if not duration:
            missing_durations.append(item.get('title', item.get('id')))
        item['duration'] = duration
        item['durationSeconds'] = duration_seconds
        item['xp'] = duration_seconds
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
        item.pop('_source', None)
    updates.sort(key=lambda item: (date_sort_value(item.get('date')), item.get('title', '')), reverse=True)

    featured_candidates = [u for u in updates if bool(u.get('featured')) and str(u.get('x_post_url') or '').strip()]
    featured = featured_candidates[0] if featured_candidates else (updates[0] if updates else {})
    featured_x_post = {
        'title': str(featured.get('title') or 'Featured update from BriThe3DGuy'),
        'xPostUrl': str(featured.get('x_post_url') or '').strip(),
        'description': str(featured.get('description') or '').strip(),
    }

    section_stats = {}
    topic_stats = {}
    total_xp = 0
    total_seconds = 0
    for item in tutorials:
        section = item['section']
        topic_slug = item['topicSlug']
        xp = int(item.get('xp') or 0)
        seconds = int(item.get('durationSeconds') or 0)
        total_xp += xp
        total_seconds += seconds
        section_entry = section_stats.setdefault(section, {'tutorialCount': 0, 'xp': 0, 'durationSeconds': 0, 'topics': 0})
        section_entry['tutorialCount'] += 1
        section_entry['xp'] += xp
        section_entry['durationSeconds'] += seconds
        topic_key = f'{section}::{topic_slug}'
        topic_entry = topic_stats.setdefault(topic_key, {
            'section': section,
            'topic': item['topic'],
            'topicSlug': topic_slug,
            'tutorialCount': 0,
            'xp': 0,
            'durationSeconds': 0,
        })
        topic_entry['tutorialCount'] += 1
        topic_entry['xp'] += xp
        topic_entry['durationSeconds'] += seconds
    for section, section_entry in section_stats.items():
        section_entry['topics'] = sum(1 for entry in topic_stats.values() if entry['section'] == section)

    progression = build_progression(total_xp)
    stats = {
        'tutorialCount': len(tutorials),
        'totalAvailableXP': total_xp,
        'totalDurationSeconds': total_seconds,
        'sections': section_stats,
        'topics': list(topic_stats.values()),
    }

    write_json_and_js('tutorials', 'TUTORIAL_DATA', tutorials, 'Generated from grouped tutorial Markdown files.')
    write_json_and_js('downloads', 'DOWNLOAD_DATA', downloads, 'Generated from the grouped downloads Markdown file.')
    write_json_and_js('updates', 'FEATURED_X_POST', featured_x_post, 'Generated from the grouped X updates Markdown file.')
    write_json_and_js('progression', 'BRI_PROGRESSION', progression, 'Generated RPG rank curve and XP totals.')
    write_json_and_js('content-stats', 'BRI_CONTENT_STATS', stats, 'Generated section and topic statistics.')

    print(f'Built {len(tutorials)} tutorials, {downloads and len(downloads) or 0} downloads, and {len(updates)} updates from Markdown.')
    for section in ('3D Graphics', 'Animation', 'Game Development'):
        section_entry = section_stats.get(section, {})
        print(f'  {section}: {section_entry.get("tutorialCount", 0)} tutorials / {section_entry.get("xp", 0):,} XP')
    print(f'  Total available XP: {total_xp:,}')
    print(f'  Legendary threshold: {progression["legendaryXP"]:,} XP')
    if missing_durations:
        print('WARNING: These tutorials have no duration and currently award 0 XP:')
        for title in missing_durations:
            print(f'  - {title}')


if __name__ == '__main__':
    try:
        build()
    except Exception as exc:
        print(f'CONTENT BUILD FAILED: {exc}', file=sys.stderr)
        sys.exit(1)
