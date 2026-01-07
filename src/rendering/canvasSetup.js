/**
 * Canvas setup and resize handling
 */

/**
 * Initialize canvas with proper DPI scaling
 * @param {HTMLCanvasElement} canvas
 * @returns {{width: number, height: number, dpr: number}}
 */
export function setupCanvas(canvas) {
  const rect = canvas.parentElement.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2) // Cap at 2x for performance

  const width = rect.width
  const height = rect.height

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  return { width, height, dpr }
}

/**
 * Handle canvas resize with debouncing
 * @param {HTMLCanvasElement} canvas
 * @param {Function} onResize - Callback with (oldWidth, oldHeight, newWidth, newHeight)
 * @returns {Function} cleanup function
 */
export function setupResizeHandler(canvas, onResize) {
  let currentWidth = canvas.parentElement.getBoundingClientRect().width
  let currentHeight = canvas.parentElement.getBoundingClientRect().height
  let resizeTimeout = null

  const handleResize = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }

    resizeTimeout = setTimeout(() => {
      const rect = canvas.parentElement.getBoundingClientRect()
      const newWidth = rect.width
      const newHeight = rect.height

      // Only trigger resize if dimensions actually changed significantly
      // On iOS, the address bar showing/hiding causes small height changes
      // which we want to ignore to prevent particle resets during scroll
      const widthChanged = newWidth !== currentWidth
      const heightDiff = Math.abs(newHeight - currentHeight)
      const significantHeightChange = heightDiff > 100 // Ignore small changes from iOS address bar

      if (widthChanged || significantHeightChange) {
        const oldWidth = currentWidth
        const oldHeight = currentHeight

        // Update canvas size
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = newWidth * dpr
        canvas.height = newHeight * dpr
        canvas.style.width = `${newWidth}px`
        canvas.style.height = `${newHeight}px`

        const ctx = canvas.getContext('2d')
        ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
        ctx.scale(dpr, dpr)

        currentWidth = newWidth
        currentHeight = newHeight

        onResize(oldWidth, oldHeight, newWidth, newHeight)
      }
    }, 100) // Debounce 100ms
  }

  window.addEventListener('resize', handleResize)

  // Also use ResizeObserver for more accurate container size changes
  let resizeObserver = null
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(canvas.parentElement)
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize)
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  }
}
