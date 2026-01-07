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
    this.particleColor = '#2563eb' // Light mode default (blue)
    this.glowColor = 'rgba(37, 99, 235, 0.3)'
    this.isDarkMode = false

    // Potential view (shows text + image instead of particles)
    this.showPotentialView = false
    this.potentialImage = null

    // Transition animation state
    this.transitionProgress = 0 // 0 = particles, 1 = potential
    this.transitionTarget = 0
    this.transitionSpeed = 4 // Units per second (0.25s for full transition)
    this.isTransitioning = false

    // Detect initial theme
    this.updateTheme()

    // Listen for theme changes
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.themeChangeHandler = () => this.updateTheme()
    this.mediaQuery.addEventListener('change', this.themeChangeHandler)
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
      // Light mode: blue
      this.particleColor = '#2563eb'
      this.glowColor = 'rgba(37, 99, 235, 0.3)'
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
    this.transitionTarget = this.showPotentialView ? 1 : 0
    this.isTransitioning = true
    return this.showPotentialView
  }

  /**
   * Update transition animation
   * @param {number} dt - Delta time in seconds
   */
  updateTransition(dt) {
    if (!this.isTransitioning) return

    const diff = this.transitionTarget - this.transitionProgress
    const step = this.transitionSpeed * dt

    if (Math.abs(diff) <= step) {
      this.transitionProgress = this.transitionTarget
      this.isTransitioning = false
    } else {
      this.transitionProgress += Math.sign(diff) * step
    }
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
   * @param {number} dt - Delta time for transition animation
   */
  render(particles, alpha = 1, dt = 1 / 60) {
    const { ctx, width, height, particleColor } = this

    // Update transition animation
    this.updateTransition(dt)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    const t = this.transitionProgress

    // Draw particles layer (fades out as t approaches 1)
    if (t < 1) {
      const { count, posX, posY, prevX, prevY } = particles
      const radius = RENDERING.PARTICLE_RADIUS

      ctx.save()
      ctx.globalAlpha = 1 - t
      ctx.fillStyle = particleColor
      ctx.beginPath()

      for (let i = 0; i < count; i++) {
        const x = prevX[i] + (posX[i] - prevX[i]) * alpha
        const y = prevY[i] + (posY[i] - prevY[i]) * alpha
        ctx.rect(x - radius, y - radius, radius * 2, radius * 2)
      }

      ctx.fill()
      ctx.restore()
    }

    // Draw potential view layer (fades in as t approaches 1)
    if (t > 0 && this.potentialImage) {
      ctx.save()
      ctx.globalAlpha = t
      ctx.drawImage(this.potentialImage, 0, 0, width, height)
      ctx.restore()
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.mediaQuery.removeEventListener('change', this.themeChangeHandler)
  }
}
