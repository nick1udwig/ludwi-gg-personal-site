import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getPostsFromDirectory, parseMarkdownFile } from './markdown-parser.js'
import { postTemplate, listPageTemplate, injectPostLists } from './templates.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.join(__dirname, '..')

const CONTENT_DIR = path.join(ROOT_DIR, 'content')
const BLOG_DIR = path.join(CONTENT_DIR, 'blog')
const TECH_DIR = path.join(CONTENT_DIR, 'tech')
const PUBLIC_DIR = path.join(ROOT_DIR, 'public')
const DIST_DIR = path.join(ROOT_DIR, 'dist')

const app = express()
const PORT = process.env.PORT || 3000

// Determine if we're serving from dist (production) or source (development)
const isProduction = fs.existsSync(DIST_DIR) && fs.existsSync(path.join(DIST_DIR, 'index.html'))

// Serve static files
if (isProduction) {
  // Production: serve from dist
  app.use('/assets', express.static(path.join(DIST_DIR, 'assets')))
  app.use('/styles', express.static(path.join(DIST_DIR, 'styles')))
  app.use('/pdfs', express.static(path.join(DIST_DIR, 'pdfs')))
  app.use(express.static(DIST_DIR, { index: false })) // index: false so we handle / ourselves
} else {
  // Development: serve from source
  app.use('/styles', express.static(path.join(ROOT_DIR, 'styles')))
  app.use('/src', express.static(path.join(ROOT_DIR, 'src')))
  app.use('/pdfs', express.static(path.join(PUBLIC_DIR, 'pdfs')))
  app.use(express.static(PUBLIC_DIR, { index: false }))
}

// Homepage - inject post lists dynamically
app.get('/', (req, res) => {
  try {
    const blogPosts = getPostsFromDirectory(BLOG_DIR)
    const techPosts = getPostsFromDirectory(TECH_DIR)

    const indexPath = isProduction
      ? path.join(DIST_DIR, 'index.html')
      : path.join(ROOT_DIR, 'index.html')

    let indexHtml = fs.readFileSync(indexPath, 'utf-8')
    indexHtml = injectPostLists(indexHtml, blogPosts, techPosts)

    res.type('html').send(indexHtml)
  } catch (err) {
    console.error('Error serving homepage:', err)
    res.status(500).send('Internal Server Error')
  }
})

// Blog list page
app.get('/blog', (req, res) => {
  try {
    const posts = getPostsFromDirectory(BLOG_DIR)
    const html = listPageTemplate('Blog', posts, '/blog', 'blog')
    res.type('html').send(html)
  } catch (err) {
    console.error('Error serving blog list:', err)
    res.status(500).send('Internal Server Error')
  }
})

// Blog post page
app.get('/blog/:slug', (req, res) => {
  try {
    const slug = req.params.slug
    const filePath = path.join(BLOG_DIR, `${slug}.md`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Post not found')
    }

    const post = parseMarkdownFile(filePath)
    const html = postTemplate(post.title, post.date, post.content, 'blog')
    res.type('html').send(html)
  } catch (err) {
    console.error('Error serving blog post:', err)
    res.status(500).send('Internal Server Error')
  }
})

// Tech list page
app.get('/tech', (req, res) => {
  try {
    const posts = getPostsFromDirectory(TECH_DIR)
    const html = listPageTemplate('Technical Writing', posts, '/tech', 'tech')
    res.type('html').send(html)
  } catch (err) {
    console.error('Error serving tech list:', err)
    res.status(500).send('Internal Server Error')
  }
})

// Tech post page
app.get('/tech/:slug', (req, res) => {
  try {
    const slug = req.params.slug
    const filePath = path.join(TECH_DIR, `${slug}.md`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Post not found')
    }

    const post = parseMarkdownFile(filePath)
    const html = postTemplate(post.title, post.date, post.content, 'tech')
    res.type('html').send(html)
  } catch (err) {
    console.error('Error serving tech post:', err)
    res.status(500).send('Internal Server Error')
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(`Mode: ${isProduction ? 'production (serving from dist/)' : 'development (serving from source)'}`)
  console.log(`Blog posts: ${BLOG_DIR}`)
  console.log(`Tech posts: ${TECH_DIR}`)
})
