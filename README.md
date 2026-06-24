# Roland's Blog

A zero-dependency static blog. Write posts in Markdown, run one Node.js build script, deploy to GitHub Pages.

## Why this stack

- **No npm dependencies** — `build.mjs` uses only Node.js built-ins
- **Markdown in, HTML out** — no React, no Eleventy, no dependency churn
- **GitHub Pages native** — builds via Actions, serves static files from `_site/`
- **Custom domain** — `CNAME` is set for `rolandpop.com`

## Quick start

```bash
npm run build   # output to _site/
npm run dev     # build and preview at http://localhost:8080
```

No `npm install` required.

## Writing posts

Add a file to `src/posts/` named `my-post.md`:

```markdown
---
title: My Post Title
date: 2024-06-24
tags: ['Architecture']
description: A short summary for listings and SEO.
---

Your markdown content here.
```

The post URL becomes `/blog/my-post/`.

## Deploying to GitHub Pages

1. In your repo **Settings → Pages**, set source to **GitHub Actions**
2. Push to `main` — the workflow in `.github/workflows/pages.yml` builds and deploys

## Project structure

```
build.mjs             Site generator (Node.js, zero deps)
src/
  _data/site.json     Site metadata
  posts/              Blog posts (markdown)
  pages/              Static pages (about, projects)
  css/site.css        Styles
  js/theme.js         Dark/light toggle
public/               Static assets (logo, favicons, CNAME)
```
