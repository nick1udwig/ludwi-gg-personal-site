/**
 * Canvas renderer with batch rendering optimization
 * and theme-aware particle colors with glow effects
 */

import { RENDERING } from '../simulation/constants.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = 0
    this.height = 0

    // Theme colors
    this.particleColor = '#e63946' // Light mode default
    this.glowColor = 'rgba(230, 57, 70, 0.3)'
    this.isDarkMode = false

    // Potential view (shows text + image instead of particles)
    this.showPotentialView = false
    this.potentialImage = null

    // Detect initial theme
    this.updateTheme()

    // Listen for theme changes
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQuery.addEventListener('change', () => this.updateTheme())
  }

  /**
   * Update colors based on system theme
   */
  updateTheme() {
    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (this.isDarkMode) {
      // Dark mode: phosphor green
      this.particleColor = '#39ff14'
      this.glowColor = 'rgba(57, 255, 20, 0.4)'
    } else {
      // Light mode: vermillion red
      this.particleColor = '#e63946'
      this.glowColor = 'rgba(230, 57, 70, 0.3)'
    }
  }

  /**
   * Update internal dimensions (call after resize)
   */
  setDimensions(width, height) {
    this.width = width
    this.height = height
  }

  /**
   * Toggle between particle view and potential view
   */
  togglePotentialView() {
    this.showPotentialView = !this.showPotentialView
    return this.showPotentialView
  }

  /**
   * Set the potential image (pre-rendered text + headshot)
   */
  setPotentialImage(imageData) {
    this.potentialImage = imageData
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  /**
   * Render all particles with interpolation for smooth animation
   * @param {ParticleData} particles
   * @param {number} alpha - Interpolation factor (0-1) between physics states
   */
  render(particles, alpha = 1) {
    const { ctx, width, height, particleColor } = this

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // If showing potential view, draw the pre-rendered image instead
    if (this.showPotentialView && this.potentialImage) {
      ctx.drawImage(this.potentialImage, 0, 0, width, height)
      return
    }

    const { count, posX, posY, prevX, prevY } = particles
    const radius = RENDERING.PARTICLE_RADIUS

    // Set fill style once for all particles
    ctx.fillStyle = particleColor

    // Batch render all particles as rectangles (faster than arcs)
    ctx.beginPath()

    for (let i = 0; i < count; i++) {
      // Interpolate position for smooth rendering
      const x = prevX[i] + (posX[i] - prevX[i]) * alpha
      const y = prevY[i] + (posY[i] - prevY[i]) * alpha

      // Draw as small rectangle
      ctx.rect(x - radius, y - radius, radius * 2, radius * 2)
    }

    ctx.fill()
  }

  /**
   * Render with circles instead of rectangles (slightly slower but rounder)
   * Use this if you prefer circular particles
   */
  renderCircles(particles, alpha = 1) {
    const { ctx, width, height, particleColor, isDarkMode, glowColor } = this
    const { count, posX, posY, prevX, prevY } = particles
    const radius = RENDERING.PARTICLE_RADIUS

    ctx.clearRect(0, 0, width, height)

    if (isDarkMode) {
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 6
    }

    ctx.fillStyle = particleColor
    ctx.beginPath()

    for (let i = 0; i < count; i++) {
      const x = prevX[i] + (posX[i] - prevX[i]) * alpha
      const y = prevY[i] + (posY[i] - prevY[i]) * alpha

      ctx.moveTo(x + radius, y)
      ctx.arc(x, y, radius, 0, Math.PI * 2)
    }

    ctx.fill()

    if (isDarkMode) {
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.mediaQuery.removeEventListener('change', () => this.updateTheme())
  }
}
