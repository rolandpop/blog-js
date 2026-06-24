const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight)

  eleventyConfig.addPassthroughCopy('src/css')
  eleventyConfig.addPassthroughCopy('src/js')
  eleventyConfig.addPassthroughCopy('public')

  eleventyConfig.addGlobalData('umamiId', process.env.UMAMI_WEBSITE_ID || '')

  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })

  eleventyConfig.addFilter('isoDate', (dateObj) => {
    return new Date(dateObj).toISOString()
  })

  eleventyConfig.addFilter('rssDate', (dateObj) => {
    return new Date(dateObj).toUTCString()
  })

  eleventyConfig.addFilter('year', () => new Date().getFullYear())

  eleventyConfig.addCollection('posts', (collection) => {
    return collection
      .getFilteredByGlob('src/posts/*.md')
      .filter((post) => !post.data.draft)
      .sort((a, b) => b.date - a.date)
  })

  eleventyConfig.addCollection('tagList', (collection) => {
    const tagSet = new Set()
    collection.getFilteredByGlob('src/posts/*.md').forEach((post) => {
      if (post.data.draft) return
      ;(post.data.tags || []).forEach((tag) => tagSet.add(tag))
    })
    return [...tagSet].sort()
  })

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    templateFormats: ['md', 'njk', 'html'],
  }
}
