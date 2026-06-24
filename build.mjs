import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const srcDir = join(root, 'src')
const outDir = join(root, '_site')
const site = JSON.parse(await readFile(join(srcDir, '_data/site.json'), 'utf8'))

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: source }

  const data = {}
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const colon = trimmed.indexOf(':')
    if (colon === -1) continue

    const key = trimmed.slice(0, colon).trim()
    let value = trimmed.slice(colon + 1).trim()

    if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (value.startsWith('[') && value.endsWith(']')) {
      value = [...value.slice(1, -1).matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2])
    } else if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1)
    }

    data[key] = value
  }

  return { data, content: match[2] }
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

function renderMarkdown(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const html = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = line.match(/^```(.*)$/)
    if (fence) {
      const language = fence[1].trim()
      const code = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      const langClass = language ? ` class="language-${escapeHtml(language)}"` : ''
      html.push(`<pre><code${langClass}>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`)
      index += 1
      continue
    }

    if (line.trim().startsWith('![')) {
      const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
      if (image) {
        html.push(`<p><img src="${escapeHtml(image[2])}" alt="${escapeHtml(image[1])}"></p>`)
        index += 1
        continue
      }
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const items = []
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s/, ''))
        index += 1
        while (index < lines.length && !lines[index].trim()) index += 1
      }
      html.push(`<ol>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ol>`)
      continue
    }

    if (line.trim().startsWith('- ')) {
      const items = []
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2))
        index += 1
        while (index < lines.length && !lines[index].trim()) index += 1
      }
      html.push(`<ul>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`)
      continue
    }

    const paragraph = []
    while (index < lines.length && lines[index].trim() && !lines[index].startsWith('#')) {
      if (lines[index].startsWith('```')) break
      if (lines[index].startsWith('- ')) break
      if (/^\d+\.\s/.test(lines[index])) break
      if (lines[index].trim().startsWith('![')) break
      paragraph.push(lines[index])
      index += 1
    }

    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`)
      continue
    }

    index += 1
  }

  return html.join('\n')
}

function readableDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function isoDate(value) {
  return new Date(value).toISOString()
}

function pageUrl(pathname) {
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function layout({ title, description, pathname, body, type = 'website' }) {
  const pageTitle = title ? `${escapeHtml(title)} | ${escapeHtml(site.title)}` : escapeHtml(site.title)
  const metaDescription = escapeHtml(description || site.description)
  const canonical = `${site.url}${pageUrl(pathname)}`

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  <link rel="canonical" href="${canonical}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="icon" href="/favicons/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
  <link rel="manifest" href="/favicons/site.webmanifest">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${escapeHtml(title || site.title)}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="site">
    <header class="header">
      <a class="brand" href="/">
        <img src="/logo.svg" alt="" width="40" height="40" class="brand-logo">
        <span class="brand-title">${escapeHtml(site.title)}</span>
      </a>
      <nav class="nav" aria-label="Main">
        <a href="/blog/">Blog</a>
        <a href="/projects/">Projects</a>
        <a href="/about/">About</a>
        <button type="button" class="theme-toggle" aria-label="Toggle color theme">
          <span class="theme-icon theme-icon-sun" aria-hidden="true">☀</span>
          <span class="theme-icon theme-icon-moon" aria-hidden="true">☾</span>
        </button>
      </nav>
    </header>
    <main id="main" class="main">
      ${body}
    </main>
    <footer class="footer">
      <div class="footer-links">
        <a href="mailto:${escapeHtml(site.email)}">Email</a>
        <a href="${escapeHtml(site.github)}" rel="noopener noreferrer">GitHub</a>
        <a href="${escapeHtml(site.linkedin)}" rel="noopener noreferrer">LinkedIn</a>
        <a href="/feed.xml">RSS</a>
      </div>
      <p class="footer-copy">&copy; ${escapeHtml(site.author)} ${new Date().getFullYear()}</p>
    </footer>
  </div>
  <script src="/js/theme.js" defer></script>
</body>
</html>`
}

function postCard(post) {
  const tags = (post.tags || [])
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('')

  return `<li class="post-card">
    <a href="/blog/${escapeHtml(post.slug)}/">
      <time datetime="${isoDate(post.date)}">${readableDate(post.date)}</time>
      <h${post.headingLevel}>${escapeHtml(post.title)}</h${post.headingLevel}>
      ${post.description ? `<p>${escapeHtml(post.description)}</p>` : ''}
      ${tags ? `<div class="post-tags">${tags}</div>` : ''}
    </a>
  </li>`
}

async function writePage(relativePath, html) {
  const outputPath = join(outDir, relativePath)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html)
}

async function loadPosts() {
  const postsDir = join(srcDir, 'posts')
  const files = (await readdir(postsDir)).filter((file) => extname(file) === '.md')
  const posts = []

  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    const source = await readFile(join(postsDir, file), 'utf8')
    const { data, content } = parseFrontmatter(source)
    if (data.draft) continue

    posts.push({
      slug,
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      description: data.description || '',
      html: renderMarkdown(content),
    })
  }

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const ICON_GITHUB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`
const ICON_LINKEDIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
const ICON_MAIL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>`

async function loadPage(name) {
  const source = await readFile(join(srcDir, 'pages', `${name}.md`), 'utf8')
  const { data, content } = parseFrontmatter(source)
  return { data, html: renderMarkdown(content) }
}

function authorSidebar(data) {
  const socialLinks = [
    data.email ? { href: `mailto:${data.email}`, icon: ICON_MAIL, label: 'Email' } : null,
    data.github ? { href: data.github, icon: ICON_GITHUB, label: 'GitHub' } : null,
    data.linkedin ? { href: data.linkedin, icon: ICON_LINKEDIN, label: 'LinkedIn' } : null,
  ].filter(Boolean)

  return `<div class="author-sidebar">
    ${data.avatar ? `<img src="${escapeHtml(data.avatar)}" alt="${escapeHtml(data.name || '')}" width="192" height="192" class="author-avatar">` : ''}
    ${data.name ? `<h3 class="author-name">${escapeHtml(data.name)}</h3>` : ''}
    ${data.occupation ? `<p class="author-meta">${escapeHtml(data.occupation)}</p>` : ''}
    ${data.company ? `<p class="author-meta">${escapeHtml(data.company)}</p>` : ''}
    ${socialLinks.length ? `<div class="author-social">
      ${socialLinks.map(({ href, icon, label }) => `<a href="${escapeHtml(href)}" class="social-link" aria-label="${label}" rel="noopener noreferrer">${icon}</a>`).join('')}
    </div>` : ''}
  </div>`
}

async function build() {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })
  await cp(join(srcDir, 'css'), join(outDir, 'css'), { recursive: true })
  await cp(join(srcDir, 'js'), join(outDir, 'js'), { recursive: true })
  await cp(join(root, 'public'), outDir, { recursive: true })

  const posts = await loadPosts()
  const pages = []

  await writePage(
    'index.html',
    layout({
      title: 'Home',
      pathname: '/',
      body: `<section class="hero">
  <h1 class="hero-title">${escapeHtml(site.title)}</h1>
  <p class="hero-description">${escapeHtml(site.description)}</p>
</section>
<section class="post-list-section">
  <div class="section-heading">
    <h2>Latest posts</h2>
    <a class="text-link" href="/blog/">View all</a>
  </div>
  <ul class="post-list">
    ${posts
      .slice(0, 5)
      .map((post) => postCard({ ...post, headingLevel: 3 }))
      .join('\n')}
  </ul>
</section>`,
    }),
  )
  pages.push('/')

  await writePage(
    'blog/index.html',
    layout({
      title: 'Blog',
      description: 'Articles on software architecture, SOLID principles, and .NET development.',
      pathname: '/blog/',
      body: `<section class="page-header-block">
  <h1>Blog</h1>
  <p>Thoughts on software architecture, design principles, and building maintainable systems.</p>
</section>
<ul class="post-list">
  ${posts.map((post) => postCard({ ...post, headingLevel: 2 })).join('\n')}
</ul>`,
    }),
  )
  pages.push('/blog/')

  for (const post of posts) {
    const tags = post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
    const pathname = `/blog/${post.slug}/`

    await writePage(
      `blog/${post.slug}/index.html`,
      layout({
        title: post.title,
        description: post.description,
        pathname,
        type: 'article',
        body: `<article class="post">
  <header class="post-header">
    <p class="post-meta">
      <time datetime="${isoDate(post.date)}">${readableDate(post.date)}</time>
      ${tags ? `<span class="post-tags">${tags}</span>` : ''}
    </p>
    <h1 class="post-title">${escapeHtml(post.title)}</h1>
    ${post.description ? `<p class="post-description">${escapeHtml(post.description)}</p>` : ''}
  </header>
  <div class="prose">${post.html}</div>
</article>`,
      }),
    )
    pages.push(pathname)
  }

  for (const name of ['about', 'projects']) {
    const page = await loadPage(name)
    const { data } = page
    const pathname = `/${name}/`
    const isAuthorPage = name === 'about' && data.name

    await writePage(
      `${name}/index.html`,
      layout({
        title: data.title,
        description: data.description || '',
        pathname,
        body: isAuthorPage
          ? `<div class="author-layout">
  <div class="author-layout-heading">
    <h1>${escapeHtml(data.title)}</h1>
  </div>
  <div class="author-layout-body">
    ${authorSidebar(data)}
    <div class="prose author-prose">${page.html}</div>
  </div>
</div>`
          : `<article class="page">
  <header class="page-header">
    <h1 class="page-title">${escapeHtml(data.title)}</h1>
    ${data.description ? `<p class="page-description">${escapeHtml(data.description)}</p>` : ''}
  </header>
  <div class="prose">${page.html}</div>
</article>`,
      }),
    )
    pages.push(pathname)
  }

  await writePage(
    '404.html',
    layout({
      title: 'Page not found',
      pathname: '/404.html',
      body: `<section class="not-found">
  <h1>404</h1>
  <p>Sorry, that page doesn't exist.</p>
  <a class="button" href="/">Back home</a>
</section>`,
    }),
  )

  const feedItems = posts
    .map(
      (post) => `<item>
  <title>${escapeHtml(post.title)}</title>
  <link>${site.url}/blog/${escapeHtml(post.slug)}/</link>
  <guid>${site.url}/blog/${escapeHtml(post.slug)}/</guid>
  <pubDate>${new Date(post.date).toUTCString()}</pubDate>
  ${post.description ? `<description>${escapeHtml(post.description)}</description>` : ''}
</item>`,
    )
    .join('\n')

  await writePage(
    'feed.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(site.title)}</title>
    <description>${escapeHtml(site.description)}</description>
    <link>${site.url}/</link>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    ${feedItems}
  </channel>
</rss>`,
  )

  const sitemapEntries = [...new Set(pages)]
    .map((pathname) => {
      const post = posts.find((entry) => `/blog/${entry.slug}/` === pathname)
      const lastmod = post ? `<lastmod>${isoDate(post.date)}</lastmod>` : ''
      return `<url><loc>${site.url}${pathname}</loc>${lastmod}</url>`
    })
    .join('\n')

  await writePage(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`,
  )

  await writePage(
    'robots.txt',
    `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`,
  )

  console.log(`Built ${pages.length + 3} pages into _site/`)
}

async function serve() {
  const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
  }

  createServer(async (request, response) => {
    try {
      let pathname = new URL(request.url, 'http://localhost').pathname
      if (pathname.endsWith('/')) pathname += 'index.html'
      if (extname(pathname) === '') pathname = `${pathname}/index.html`

      const filePath = join(outDir, pathname)
      const data = await readFile(filePath)
      response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' })
      response.end(data)
    } catch {
      try {
        const fallback = await readFile(join(outDir, '404.html'))
        response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        response.end(fallback)
      } catch {
        response.writeHead(500)
        response.end('Build the site first with: npm run build')
      }
    }
  }).listen(8080, () => {
    console.log('Serving _site at http://localhost:8080')
  })
}

await build()

if (process.argv.includes('--serve')) {
  await serve()
}
