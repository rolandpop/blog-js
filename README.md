# Roland's Blog

A minimal static blog built with [Eleventy](https://www.11ty.dev/). Write posts in Markdown, run one build step, deploy to GitHub Pages.

## Why this stack

- **Markdown in, HTML out** — no React, no Contentlayer, no Next.js dependency churn
- **Tiny footprint** — two dev dependencies (`@11ty/eleventy`, syntax highlighting)
- **GitHub Pages native** — builds via Actions, serves static files from `_site/`
- **Custom domain** — `CNAME` is set for `rolandpop.com`

## Quick start

```bash
npm install
npm run dev     # local preview at http://localhost:8080
npm run build   # output to _site/
```

## Writing posts

Add a file to `src/posts/`:

```markdown
---
layout: layouts/post.njk
permalink: /blog/my-post/index.html
title: My Post Title
date: 2024-06-24
tags: ['Architecture']
description: A short summary for listings and SEO.
---

Your markdown content here.
```

Set `draft: true` to exclude a post from the build.

## Deploying to GitHub Pages

1. In your repo **Settings → Pages**, set source to **GitHub Actions**
2. Add a repository secret `UMAMI_WEBSITE_ID` if you use Umami analytics (optional)
3. Push to `main` — the workflow in `.github/workflows/pages.yml` builds and deploys

## Project structure

```
src/
  _data/site.json       Site metadata
  _includes/            Layouts and partials
  posts/                Blog posts (markdown)
  css/site.css          Styles
  js/theme.js           Dark/light toggle
public/                 Static assets (logo, favicons, CNAME)
```

## Migrating from the old Next.js template

Your existing posts were converted from `data/blog/*.mdx` to `src/posts/*.md`. The frontmatter field `summary` was renamed to `description`. No React components were used in your posts, so the migration is straightforward.
