/**
 * Generate target positions from text and images
 * Renders to offscreen canvas and extracts filled/edge pixels
 */

/**
 * Load an image and return a promise
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Generate target positions for particles to form text and headshot silhouette
 * @param {string} text - Text to render (e.g., "NICK LUDWIG")
 * @param {string} imagePath - Path to headshot image
 * @param {number} canvasWidth - Width of the main canvas
 * @param {number} canvasHeight - Height of the main canvas
 * @param {number} particleCount - Number of particles to generate targets for
 * @returns {Promise<Array<{x: number, y: number}>>} Array of target positions
 */
export async function generateTargets(text, imagePath, canvasWidth, canvasHeight, particleCount) {
  // Create offscreen canvas for rendering
  const offscreen = document.createElement('canvas')
  const ctx = offscreen.getContext('2d', { willReadFrequently: true })

  // Use a scaled-down resolution for sampling (faster)
  const scale = Math.min(1, 600 / canvasWidth)
  const width = Math.floor(canvasWidth * scale)
  const height = Math.floor(canvasHeight * scale)

  offscreen.width = width
  offscreen.height = height

  // Clear canvas with black
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  // Calculate font size to fit text nicely
  const fontSize = calculateFontSize(ctx, text, width * 0.85, height * 0.25)

  // Draw text centered in upper portion
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const textY = height * 0.22
  ctx.fillText(text, width / 2, textY)

  // Load and draw headshot below text
  if (imagePath) {
    try {
      const img = await loadImage(imagePath)

      // Calculate image size and position
      const imgMaxHeight = height * 0.55
      const imgMaxWidth = width * 0.5
      const imgAspect = img.width / img.height

      let imgWidth, imgHeight
      if (imgAspect > imgMaxWidth / imgMaxHeight) {
        imgWidth = imgMaxWidth
        imgHeight = imgMaxWidth / imgAspect
      } else {
        imgHeight = imgMaxHeight
        imgWidth = imgMaxHeight * imgAspect
      }

      const imgX = (width - imgWidth) / 2
      const imgY = height * 0.38

      // Draw image to canvas
      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)
    } catch (e) {
      console.warn('Failed to load headshot, using fallback square:', e)
      // Fallback: draw a square
      const squareSize = Math.min(width, height) * 0.3
      const squareX = (width - squareSize) / 2
      const squareY = height * 0.45
      ctx.fillRect(squareX, squareY, squareSize, squareSize)
    }
  }

  // Extract edge pixels using threshold detection
  // Since headshot has white background, we detect non-white pixels
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const filledPixels = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b

      // For text (white on black): detect white pixels
      // For headshot (on white bg drawn on black): detect non-black pixels
      // Since we draw on black canvas, any non-black pixel is part of our content
      if (luminance > 30) {
        filledPixels.push({
          x: x / scale,
          y: y / scale
        })
      }
    }
  }

  // Subsample to match particle count
  return subsamplePixels(filledPixels, particleCount)
}

/**
 * Simple version without image (for fallback)
 */
export function generateTargetsSimple(text, canvasWidth, canvasHeight, particleCount) {
  const offscreen = document.createElement('canvas')
  const ctx = offscreen.getContext('2d', { willReadFrequently: true })

  const scale = Math.min(1, 600 / canvasWidth)
  const width = Math.floor(canvasWidth * scale)
  const height = Math.floor(canvasHeight * scale)

  offscreen.width = width
  offscreen.height = height

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  const fontSize = calculateFontSize(ctx, text, width * 0.85, height * 0.3)

  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height * 0.5)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const filledPixels = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (data[idx] > 128) {
        filledPixels.push({
          x: x / scale,
          y: y / scale
        })
      }
    }
  }

  return subsamplePixels(filledPixels, particleCount)
}

/**
 * Calculate optimal font size to fit text within width
 */
function calculateFontSize(ctx, text, maxWidth, maxHeight) {
  let fontSize = 100

  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
  let metrics = ctx.measureText(text)

  // Scale down if too wide
  if (metrics.width > maxWidth) {
    fontSize = Math.floor(fontSize * (maxWidth / metrics.width))
  }

  // Also check height
  if (fontSize > maxHeight) {
    fontSize = Math.floor(maxHeight)
  }

  return Math.max(fontSize, 20) // Minimum size
}

/**
 * Subsample pixels to match desired count
 */
function subsamplePixels(pixels, targetCount) {
  if (pixels.length === 0) {
    // No pixels found, return empty array
    console.warn('No pixels found for targets')
    return []
  }

  if (pixels.length <= targetCount) {
    // Not enough pixels, pad with duplicates
    const result = [...pixels]
    while (result.length < targetCount) {
      const idx = Math.floor(Math.random() * pixels.length)
      result.push({ ...pixels[idx] })
    }
    return result
  }

  // Shuffle and take first N
  const shuffled = shuffleArray([...pixels])
  return shuffled.slice(0, targetCount)
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
