/**
 * Main particle system orchestrator
 * Coordinates particles, physics, rendering, and user input
 */

import { ParticleData } from './particles.js'
import { updatePhysics, areParticlesSettled } from './physics.js'
import { generateTargets, generateTargetsSimple, generatePotentialView } from './potentialField.js'
import { getParticleCount, RESPONSIVE, PHYSICS } from './constants.js'
import { Renderer } from '../rendering/Renderer.js'
import { setupCanvas, setupResizeHandler } from '../rendering/canvasSetup.js'
import { GameLoop } from '../utils/gameLoop.js'
import { refreshRandomTable } from '../utils/random.js'

export class ParticleSystem {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.text = options.text || 'NICK LUDWIG'
    this.imagePath = options.imagePath || null
    this.temperature = options.initialTemperature || 15

    // Initialize canvas
    const { width, height } = setupCanvas(canvas)
    this.width = width
    this.height = height

    // Create renderer
    this.renderer = new Renderer(canvas)
    this.renderer.setDimensions(width, height)

    // Create particles (will be populated after async init)
    this.particles = new ParticleData(Math.max(...Object.values(RESPONSIVE)))
    this.particles.initializeGrid(width, height, getParticleCount(width))

    // Create game loop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (alpha, dt) => this.render(alpha, dt)
    )

    // Setup resize handler
    this.cleanupResize = setupResizeHandler(canvas, (oldW, oldH, newW, newH) => {
      this.handleResize(oldW, oldH, newW, newH)
    })

    // Visibility handling
    this.setupVisibilityHandler()

    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Track if particles have settled (for scroll indicator)
    this.hasSettled = false
    this.onSettled = options.onSettled || null

    // Track initialization state
    this.initialized = false

    // Pointer position for repulsion effect (null = not active)
    this.pointer = null
  }

  /**
   * Async initialization - load image and generate targets
   */
  async init() {
    const particleCount = getParticleCount(this.width)

    try {
      // Generate targets with image (async)
      const targets = await generateTargets(
        this.text,
        this.imagePath,
        this.width,
        this.height,
        particleCount
      )
      this.particles.setTargets(targets)
      this.currentTargets = targets
    } catch (e) {
      console.warn('Failed to generate targets with image, using simple fallback:', e)
      // Fallback to simple text-only targets
      const targets = generateTargetsSimple(this.text, this.width, this.height, particleCount)
      this.particles.setTargets(targets)
      this.currentTargets = targets
    }

    // Generate the potential view image
    const potentialCanvas = await generatePotentialView(
      this.text,
      this.imagePath,
      this.width,
      this.height,
      this.renderer.particleColor
    )
    this.renderer.setPotentialImage(potentialCanvas)

    this.initialized = true
    return this
  }

  /**
   * Toggle between particle view and potential view
   */
  toggleView() {
    return this.renderer.togglePotentialView()
  }

  /**
   * Physics update (called at fixed timestep)
   * Runs multiple steps per frame for faster convergence
   */
  update(dt) {
    if (!this.initialized) return

    // Run multiple physics steps per frame for faster convergence
    const steps = PHYSICS.STEPS_PER_FRAME || 1
    for (let i = 0; i < steps; i++) {
      updatePhysics(this.particles, this.temperature, this.pointer)
    }

    // Check if particles have settled
    if (!this.hasSettled && areParticlesSettled(this.particles, 0.3)) {
      this.hasSettled = true
      if (this.onSettled) {
        this.onSettled()
      }
    }
  }

  /**
   * Set pointer position for repulsion effect
   * @param {number|null} x - Canvas x coordinate, or null to disable
   * @param {number|null} y - Canvas y coordinate, or null to disable
   */
  setPointer(x, y) {
    if (x === null || y === null) {
      this.pointer = null
    } else {
      this.pointer = { x, y }
    }
  }

  /**
   * Clear pointer (particles return to targets)
   */
  clearPointer() {
    this.pointer = null
  }

  /**
   * Render (called every frame with interpolation)
   */
  render(alpha, dt = 1 / 60) {
    if (!this.initialized) return
    this.renderer.render(this.particles, alpha, dt)
  }

  /**
   * Handle window resize
   * Always regenerate targets to avoid distortion when aspect ratio changes
   */
  async handleResize(oldWidth, oldHeight, newWidth, newHeight) {
    this.width = newWidth
    this.height = newHeight
    this.renderer.setDimensions(newWidth, newHeight)

    const newCount = getParticleCount(newWidth)

    // Always regenerate targets on resize to avoid aspect ratio distortion
    // Re-initialize particle grid at new size
    this.particles.initializeGrid(newWidth, newHeight, newCount)

    try {
      const targets = await generateTargets(
        this.text,
        this.imagePath,
        newWidth,
        newHeight,
        newCount
      )
      this.particles.setTargets(targets)
      this.currentTargets = targets

      // Also regenerate potential view
      const potentialCanvas = await generatePotentialView(
        this.text,
        this.imagePath,
        newWidth,
        newHeight,
        this.renderer.particleColor
      )
      this.renderer.setPotentialImage(potentialCanvas)
    } catch (e) {
      const targets = generateTargetsSimple(this.text, newWidth, newHeight, newCount)
      this.particles.setTargets(targets)
      this.currentTargets = targets
    }

    this.hasSettled = false

    // Refresh random table occasionally
    refreshRandomTable()
  }

  /**
   * Setup visibility change handler to pause when hidden
   */
  setupVisibilityHandler() {
    // Intersection Observer for scroll-based visibility
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.resume()
          } else {
            this.pause()
          }
        })
      },
      { threshold: 0.1 }
    )
    this.observer.observe(this.canvas.parentElement)

    // Document visibility for tab switching
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.pause()
      } else {
        this.resume()
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  /**
   * Set temperature (0-100)
   */
  setTemperature(value) {
    this.temperature = Math.max(0, Math.min(100, value))
  }

  /**
   * Start the simulation
   */
  start() {
    if (!this.initialized) {
      console.warn('ParticleSystem not initialized. Call init() first.')
      return
    }

    if (this.prefersReducedMotion) {
      // Skip animation, show final state immediately
      this.particles.snapToTargets()
      this.renderer.render(this.particles, 1)
      this.hasSettled = true
      if (this.onSettled) {
        this.onSettled()
      }
      return
    }

    this.gameLoop.start()
  }

  /**
   * Pause simulation (e.g., when scrolled out of view)
   */
  pause() {
    this.gameLoop.stop()
  }

  /**
   * Resume simulation
   */
  resume() {
    if (!this.prefersReducedMotion && !document.hidden && this.initialized) {
      this.gameLoop.start()
    }
  }

  /**
   * Check if simulation is running
   */
  isRunning() {
    return this.gameLoop.isRunning()
  }

  /**
   * Cleanup
   */
  destroy() {
    this.gameLoop.stop()
    this.cleanupResize()
    this.observer.disconnect()
    document.removeEventListener('visibilitychange', this.visibilityHandler)
    this.renderer.destroy()
  }
}
