/**
 * Format date for display (YYYY.MM.DD)
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '.')
}

/**
 * Format date for datetime attribute (YYYY-MM-DD)
 */
export function isoDate(date) {
  return date.toISOString().split('T')[0]
}

/**
 * HTML template for a single blog/tech post
 */
export function postTemplate(title, date, content, section = 'blog') {
  const formattedDate = formatDate(date)
  const iso = isoDate(date)
  const backLink = section === 'blog' ? '/#journal' : '/#journal'
  const backText = 'back to journal'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Nick Ludwig</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/blog.css">
</head>
<body>
  <article class="post-container">
    <a href="${backLink}" class="back-link">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      ${backText}
    </a>

    <header class="post-header">
      <h1 class="post-title">${escapeHtml(title)}</h1>
      <time class="post-date" datetime="${iso}">${formattedDate}</time>
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

/**
 * Generate list HTML for posts
 */
export function generatePostList(posts, urlPrefix) {
  if (posts.length === 0) {
    return '      <li class="journal-entry"><span class="entry-title">No posts yet</span></li>'
  }

  return posts
    .map(post => {
      const formattedDate = formatDate(post.date)
      const iso = isoDate(post.date)
      return `      <li class="journal-entry">
        <time class="entry-date" datetime="${iso}">${formattedDate}</time>
        <a href="${urlPrefix}/${post.slug}" class="entry-title">${escapeHtml(post.title)}</a>
      </li>`
    })
    .join('\n')
}

/**
 * Generate list page HTML
 */
export function listPageTemplate(title, posts, urlPrefix, section) {
  const listHtml = generatePostList(posts, urlPrefix)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Nick Ludwig</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/blog.css">
</head>
<body>
  <section class="journal-section" style="padding-top: 4rem;">
    <a href="/" class="back-link" style="margin-bottom: 2rem; display: inline-flex;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      back to home
    </a>

    <h2 class="journal-heading">${escapeHtml(title)}</h2>
    <ul class="journal-list">
${listHtml}
    </ul>
  </section>

  <footer class="site-footer">
    <p class="footer-text">&copy; Nick Ludwig</p>
  </footer>
</body>
</html>`
}

/**
 * Inject post lists into index.html
 */
export function injectPostLists(indexHtml, blogPosts, techPosts) {
  const blogListHtml = generatePostList(blogPosts, '/blog')
  const techListHtml = generatePostList(techPosts, '/tech')

  // Replace the Blog section
  let result = indexHtml.replace(
    /(<h2 class="journal-heading">Blog<\/h2>\s*<ul class="journal-list">)[\s\S]*?(<\/ul>)/,
    `$1\n${blogListHtml}\n    $2`
  )

  // Replace the Technical Writing section
  result = result.replace(
    /(<h2 class="journal-heading">Technical Writing<\/h2>\s*<ul class="journal-list">)[\s\S]*?(<\/ul>)/,
    `$1\n${techListHtml}\n    $2`
  )

  return result
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, char => map[char])
}
