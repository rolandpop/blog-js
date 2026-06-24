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

    if (line.startsWith('- ')) {
      const items = []
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(lines[index].slice(2))
        index += 1
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

async function loadPage(name) {
  const source = await readFile(join(srcDir, 'pages', `${name}.md`), 'utf8')
  const { data, content } = parseFrontmatter(source)
  return {
    title: data.title,
    description: data.description || '',
    html: renderMarkdown(content),
  }
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
    const pathname = `/${name}/`
    await writePage(
      `${name}/index.html`,
      layout({
        title: page.title,
        description: page.description,
        pathname,
        body: `<article class="page">
  <header class="page-header">
    <h1 class="page-title">${escapeHtml(page.title)}</h1>
    ${page.description ? `<p class="page-description">${escapeHtml(page.description)}</p>` : ''}
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
