# BriThe3DGuy Content System

The website is rebuilt automatically by GitHub Actions whenever changes are committed to the `main` branch. You only edit the grouped Markdown files.

## Tutorial files

- `content/tutorials/3d-graphics.md`
- `content/tutorials/animation.md`
- `content/tutorials/game-development.md`

Add another item under `tutorials:` in the appropriate file. The `topic` value does **not** need to exist ahead of time. A new topic name automatically creates a new filter button, tutorial count, available-XP total, and topic statistics.

```yaml
- id: unique-short-id
  title: Tutorial title
  section: Game Development
  topic: New Topic Name
  difficulty: Beginner
  youtube: https://www.youtube.com/watch?v=VIDEO_ID
  duration: '8:32'
  tags:
  - Godot
  - Logic Bricks
  published_order: 204
  description: A short description of the tutorial.
```

### Duration and XP

Use `M:SS` or `H:MM:SS` for `duration`.

- `8:32` becomes 512 XP.
- `1:02:15` becomes 3,735 XP.
- One second of video equals one XP.

A blank duration is allowed during drafting, but that tutorial awards 0 XP until a duration is added. The GitHub build prints a warning for any blank durations.

## Downloads

Edit `content/downloads/downloads.md`. A new `category` value automatically creates a new category filter.

## Featured X post

Edit `content/updates/x-updates.md`. The newest update with `featured: true` and an `x_post_url` becomes the featured post.

## Automatic progression

The build generates:

- Tutorial and download data
- Topic counts and XP totals
- Section XP totals for the homepage
- One-second-per-XP tutorial rewards
- A gradually increasing RPG rank curve
- The Profile page statistics

Ranks never regress for returning learners. The browser remembers the highest rank a learner has earned. When new tutorials expand the XP curve, the learner keeps that rank, although reaching the next rank may require more XP.
