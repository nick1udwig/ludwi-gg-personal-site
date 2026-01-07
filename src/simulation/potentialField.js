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
 * Generate the "potential view" - a canvas showing text + headshot
 * This is displayed when user clicks to toggle view
 */
export async function generatePotentialView(text, imagePath, canvasWidth, canvasHeight, particleColor) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // Calculate font size - allow larger on desktop
  // On desktop (wider screens), we can use more height for text
  const isDesktop = canvasWidth >= 768
  const maxTextHeight = isDesktop ? canvasHeight * 0.18 : canvasHeight * 0.15
  const fontSize = calculateFontSize(ctx, text, canvasWidth * 0.9, maxTextHeight)

  // Draw text
  ctx.fillStyle = particleColor
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const textY = canvasHeight * 0.15
  ctx.fillText(text, canvasWidth / 2, textY)

  // Load and draw headshot
  if (imagePath) {
    try {
      const img = await loadImage(imagePath)

      const imgMaxHeight = canvasHeight * 0.65
      const imgMaxWidth = canvasWidth * 0.55
      const imgAspect = img.width / img.height

      let imgWidth, imgHeight
      if (imgAspect > imgMaxWidth / imgMaxHeight) {
        imgWidth = imgMaxWidth
        imgHeight = imgMaxWidth / imgAspect
      } else {
        imgHeight = imgMaxHeight
        imgWidth = imgMaxHeight * imgAspect
      }

      const imgX = (canvasWidth - imgWidth) / 2
      const imgY = canvasHeight * 0.28

      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)
    } catch (e) {
      console.warn('Failed to load headshot for potential view:', e)
    }
  }

  return canvas
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

  // Calculate font size - match potential view sizing
  const isDesktop = width >= 768 * scale
  const maxTextHeight = isDesktop ? height * 0.18 : height * 0.15
  const fontSize = calculateFontSize(ctx, text, width * 0.9, maxTextHeight)

  // Draw text centered in upper portion
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const textY = height * 0.15
  ctx.fillText(text, width / 2, textY)

  // Load and draw headshot below text
  if (imagePath) {
    try {
      const img = await loadImage(imagePath)

      // Calculate image size and position - match potential view
      const imgMaxHeight = height * 0.65
      const imgMaxWidth = width * 0.55
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
      const imgY = height * 0.28

      // Draw image to canvas
      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)
    } catch (e) {
      console.warn('Failed to load headshot, using fallback square:', e)
      // Fallback: draw a square
      const squareSize = Math.min(width, height) * 0.3
      const squareX = (width - squareSize) / 2
      const squareY = height * 0.35
      ctx.fillRect(squareX, squareY, squareSize, squareSize)
    }
  }

  // Extract pixels, separating text (top) from image (bottom)
  // We'll weight more particles toward the text for clarity
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const textPixels = []
  const imagePixels = []

  // Dividing line between text and image region (text is in top ~25%)
  const textBottomY = height * 0.25

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b

      if (luminance > 30) {
        const pixel = { x: x / scale, y: y / scale }
        if (y < textBottomY) {
          textPixels.push(pixel)
        } else {
          imagePixels.push(pixel)
        }
      }
    }
  }

  // Allocate 60% of particles to text, 40% to image for better text clarity
  const textParticleCount = Math.floor(particleCount * 0.6)
  const imageParticleCount = particleCount - textParticleCount

  const textTargets = subsamplePixels(textPixels, textParticleCount)
  const imageTargets = subsamplePixels(imagePixels, imageParticleCount)

  // Combine and shuffle
  return shuffleArray([...textTargets, ...imageTargets])
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
 * Uses binary search for accuracy
 */
function calculateFontSize(ctx, text, maxWidth, maxHeight) {
  // Start with a large font and scale to fit
  let fontSize = 200

  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
  let metrics = ctx.measureText(text)

  // Scale to fit width
  if (metrics.width > maxWidth) {
    fontSize = Math.floor(fontSize * (maxWidth / metrics.width))
  }

  // Cap at maxHeight
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
