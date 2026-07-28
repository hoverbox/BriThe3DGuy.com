# Markdown Content System

Markdown is the source of truth for tutorials and downloads. The files in `data/` are generated browser files and should not be edited directly.

## Tutorial files

Tutorials are organized into three Markdown files:

- `content/tutorials/3d-graphics.md`
- `content/tutorials/animation.md`
- `content/tutorials/game-development.md`

Each file has a YAML `tutorials` list at the top. To publish another video, add one entry to the appropriate list:

```yaml
- id: enemy-ai
  title: Enemy AI With Logic Bricks
  section: Game Development
  topic: Artificial Intelligence
  difficulty: Beginner
  youtube: https://www.youtube.com/watch?v=VIDEO_ID
  duration: '8:30'
  tags:
  - Logic Bricks
  - AI
  published_order: 210
  description: Create an enemy that detects and follows the player.
```

The website discovers topics automatically. The first tutorial using `topic: Artificial Intelligence` creates that topic button and its count on the Game Development page.

Use a unique `id`, YouTube URL, and `published_order`. Larger `published_order` values appear first.

## Download file

All products and downloads are kept in:

- `content/downloads/downloads.md`

Add a Ko-fi product to its YAML `downloads` list:

```yaml
- id: logic-bricks-starter-project
  title: Logic Bricks Starter Project
  category: Project Files
  provider: Ko-fi
  url: https://ko-fi.com/s/YOUR_PRODUCT_ID
  image: images/logic-bricks-starter-project.png
  tags:
  - Godot
  - Logic Bricks
  published_order: 110
  description: A ready-to-open Godot starter project.
```

The first download using a new `category` automatically creates that category filter and count.

## Update the website data

Double-click:

```text
update-content-data.bat
```

Or run:

```bash
python tools/build_content.py
```

The builder validates required fields and rejects duplicate tutorial IDs, YouTube URLs, download IDs, and product URLs. It then generates:

- `data/tutorials.json`
- `data/tutorials-data.js`
- `data/downloads.json`
- `data/downloads-data.js`

The JavaScript files allow the site to work when opened directly from a Windows folder. The JSON files are used when the site is hosted online.

## Animation visibility

The Animation content file remains available at `content/tutorials/animation.md`, but the Animation hub is currently hidden from the main navigation and sitemap until real tutorials are added. The homepage displays Animation as a non-clickable Coming Soon card.

## Featured X post

Edit `content/updates/updates.md` and paste the full URL of the public X post into `x_post_url`.

```yaml
featured_x_post:
  title: Logic Bricks update
  x_post_url: https://x.com/brithe3dguy/status/POST_NUMBER
  description: A short fallback description shown when X embeds are blocked.
```

Run `update-content-data.bat`. The homepage will embed that single post. If X cannot load it, visitors see the title, description, and a direct link instead of an empty panel.
