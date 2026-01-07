/**
 * Generate target positions from text and shapes
 * Renders to offscreen canvas and extracts filled pixels
 */

/**
 * Generate target positions for particles to form text and a square
 * @param {string} text - Text to render (e.g., "NICK LUDWIG")
 * @param {number} canvasWidth - Width of the main canvas
 * @param {number} canvasHeight - Height of the main canvas
 * @param {number} particleCount - Number of particles to generate targets for
 * @returns {Array<{x: number, y: number}>} Array of target positions
 */
export function generateTargets(text, canvasWidth, canvasHeight, particleCount) {
  // Create offscreen canvas for text rendering
  const offscreen = document.createElement('canvas')
  const ctx = offscreen.getContext('2d', { willReadFrequently: true })

  // Use a scaled-down resolution for sampling (faster)
  const scale = Math.min(1, 600 / canvasWidth)
  const width = Math.floor(canvasWidth * scale)
  const height = Math.floor(canvasHeight * scale)

  offscreen.width = width
  offscreen.height = height

  // Clear canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  // Calculate font size to fit text nicely
  const fontSize = calculateFontSize(ctx, text, width * 0.85, height * 0.3)

  // Draw text centered
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Position text slightly above center to leave room for square below
  const textY = height * 0.38
  ctx.fillText(text, width / 2, textY)

  // Draw square placeholder below text
  const squareSize = Math.min(width, height) * 0.22
  const squareX = (width - squareSize) / 2
  const squareY = height * 0.55

  // Fill the square (for now, just a filled square)
  ctx.fillRect(squareX, squareY, squareSize, squareSize)

  // Extract filled pixels
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const filledPixels = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      // Check if pixel is white (filled)
      if (data[idx] > 128) {
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
 * Uses stratified sampling for better distribution
 */
function subsamplePixels(pixels, targetCount) {
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

/**
 * Regenerate targets when canvas resizes
 * Scales existing targets to new dimensions
 */
export function scaleTargets(targets, oldWidth, oldHeight, newWidth, newHeight) {
  const scaleX = newWidth / oldWidth
  const scaleY = newHeight / oldHeight

  return targets.map(t => ({
    x: t.x * scaleX,
    y: t.y * scaleY
  }))
}
