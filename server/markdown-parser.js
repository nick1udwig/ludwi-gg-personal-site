import fs from 'fs'
import path from 'path'
import { marked } from 'marked'

/**
 * Parse markdown file with H1 date (YYMMDD) and H2 title format
 *
 * Expected format:
 * # 201122
 *
 * ## My Post Title
 *
 * Content here...
 */
export function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  return parseMarkdown(content, path.basename(filePath, '.md'))
}

export function parseMarkdown(content, slug) {
  const lines = content.split('\n')

  let dateStr = null
  let title = null
  let contentStartIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Look for H1 with date (# YYMMDD)
    if (!dateStr && line.match(/^#\s+\d{6}\s*$/)) {
      dateStr = line.replace(/^#\s+/, '').trim()
      contentStartIndex = i + 1
      continue
    }

    // Look for H2 with title (## Title)
    if (dateStr && !title && line.match(/^##\s+.+$/)) {
      title = line.replace(/^##\s+/, '').trim()
      contentStartIndex = i + 1
      continue
    }

    // Once we have both, stop looking
    if (dateStr && title) {
      // Skip any blank lines after the title
      while (contentStartIndex < lines.length && lines[contentStartIndex].trim() === '') {
        contentStartIndex++
      }
      break
    }
  }

  if (!dateStr) {
    throw new Error(`No date header (# YYMMDD) found in markdown`)
  }

  if (!title) {
    throw new Error(`No title header (## Title) found in markdown`)
  }

  // Parse date from YYMMDD format
  const year = 2000 + parseInt(dateStr.slice(0, 2), 10)
  const month = parseInt(dateStr.slice(2, 4), 10) - 1 // 0-indexed
  const day = parseInt(dateStr.slice(4, 6), 10)
  const date = new Date(year, month, day)

  // Extract content (everything after the title)
  const bodyContent = lines.slice(contentStartIndex).join('\n').trim()
  const html = marked(bodyContent)

  return {
    slug,
    title,
    date,
    content: html,
    rawContent: bodyContent
  }
}

/**
 * Get all posts from a directory
 */
export function getPostsFromDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return []
  }

  const files = fs.readdirSync(directory).filter(f => f.endsWith('.md'))
  const posts = []

  for (const file of files) {
    try {
      const post = parseMarkdownFile(path.join(directory, file))
      posts.push(post)
    } catch (err) {
      console.error(`Error parsing ${file}: ${err.message}`)
    }
  }

  // Sort by date descending (newest first)
  return posts.sort((a, b) => b.date - a.date)
}
