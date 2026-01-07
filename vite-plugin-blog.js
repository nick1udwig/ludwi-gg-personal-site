import fs from 'fs'
import path from 'path'
import { marked } from 'marked'
import matter from 'gray-matter'

const POSTS_DIR = 'posts'
const OUTPUT_DIR = 'blog'

// HTML template for blog posts
function postTemplate(title, date, content) {
  const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '.')
  const isoDate = date.toISOString().split('T')[0]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Nick Ludwig</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/blog.css">
</head>
<body>
  <article class="post-container">
    <a href="/#journal" class="back-link">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      back to journal
    </a>

    <header class="post-header">
      <h1 class="post-title">${title}</h1>
      <time class="post-date" datetime="${isoDate}">${formattedDate}</time>
    </header>

    <div class="post-content">
      ${content}
    </div>
  </article>

  <footer class="site-footer">
    <p class="footer-text">&copy; Nick Ludwig</p>
  </footer>
</body>
</html>`
}

// Generate journal list HTML for index.html injection
function generateJournalList(posts) {
  return posts
    .sort((a, b) => b.date - a.date)
    .map(post => {
      const formattedDate = post.date.toISOString().split('T')[0].replace(/-/g, '.')
      const isoDate = post.date.toISOString().split('T')[0]
      return `      <li class="journal-entry">
        <time class="entry-date" datetime="${isoDate}">${formattedDate}</time>
        <a href="/blog/${post.slug}.html" class="entry-title">${post.title}</a>
      </li>`
    })
    .join('\n')
}

export default function blogPlugin() {
  let posts = []

  return {
    name: 'vite-plugin-blog',

    // During dev, serve generated HTML for blog posts
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/blog/') && req.url?.endsWith('.html')) {
          const slug = req.url.replace('/blog/', '').replace('.html', '')
          const mdPath = path.join(POSTS_DIR, `${slug}.md`)

          if (fs.existsSync(mdPath)) {
            const fileContent = fs.readFileSync(mdPath, 'utf-8')
            const { data, content } = matter(fileContent)
            const html = marked(content)
            const date = new Date(data.date)
            const title = data.title || slug

            res.setHeader('Content-Type', 'text/html')
            res.end(postTemplate(title, date, html))
            return
          }
        }
        next()
      })
    },

    // Build: generate HTML files for each post
    buildStart() {
      posts = []

      if (!fs.existsSync(POSTS_DIR)) {
        console.warn(`[blog] No ${POSTS_DIR}/ directory found`)
        return
      }

      const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))

      for (const file of files) {
        const slug = file.replace('.md', '')
        const filePath = path.join(POSTS_DIR, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(fileContent)

        posts.push({
          slug,
          title: data.title || slug,
          date: new Date(data.date),
          content: marked(content)
        })
      }

      console.log(`[blog] Found ${posts.length} posts`)
    },

    // Transform index.html to inject journal list
    transformIndexHtml(html) {
      if (posts.length === 0) return html

      const journalList = generateJournalList(posts)

      // Replace the journal list placeholder
      return html.replace(
        /<ul class="journal-list">[\s\S]*?<\/ul>/,
        `<ul class="journal-list">\n${journalList}\n    </ul>`
      )
    },

    // Generate blog HTML files during build
    generateBundle() {
      for (const post of posts) {
        const html = postTemplate(post.title, post.date, post.content)

        this.emitFile({
          type: 'asset',
          fileName: `blog/${post.slug}.html`,
          source: html
        })
      }
    }
  }
}
