# BriThe3DGuy Content System

The site is maintained through five grouped Markdown files. Edit a file on GitHub, add a new list entry, and commit the change. GitHub Actions rebuilds and publishes the site automatically.

## Tutorial files

- `content/tutorials/3d-graphics.md`
- `content/tutorials/animation.md`
- `content/tutorials/game-development.md`

Add a tutorial beneath the existing `tutorials:` list:

```yaml
- id: unique-short-id
  title: Tutorial title
  section: 3D Graphics
  topic: Modeling Tools
  difficulty: Beginner
  youtube: https://www.youtube.com/watch?v=VIDEO_ID
  duration: '8:15'
  tags:
  - Blender
  - Modeling
  published_order: 101
  description: A short description shown on the tutorial card.
```

Use the matching section name for each file. A new `topic` value automatically creates a new filter button and count. Every tutorial contributes to the automatic XP totals.

## Downloads

Edit `content/downloads/downloads.md` and add another item beneath `downloads:`:

```yaml
- id: unique-download-id
  title: Product title
  category: Project Files
  provider: Ko-fi
  url: https://ko-fi.com/s/YOUR_PRODUCT_ID
  image: images/example.png
  tags:
  - Godot
  - Logic Bricks
  published_order: 101
  description: A short description shown on the download card.
```

A new `category` value automatically creates a new filter and count.

## Featured X post

Edit `content/updates/x-updates.md` and add another item beneath `updates:`:

```yaml
- id: unique-update-id
  title: Logic Bricks update
  date: '2026-07-29'
  featured: true
  x_post_url: https://x.com/brithe3dguy/status/POST_NUMBER
  description: A short fallback description for the post.
```

The newest dated entry marked `featured: true` is displayed. Older entries may stay in the file; set their `featured` value to `false` when they should no longer be featured.

## Publishing

1. Open the appropriate Markdown file on GitHub.
2. Click the pencil icon.
3. Add or edit an entry without removing the opening and closing `---` lines.
4. Click **Commit changes**.
5. GitHub Actions validates, rebuilds, and deploys the site.

Do not edit files under `data/`; they are generated automatically.
