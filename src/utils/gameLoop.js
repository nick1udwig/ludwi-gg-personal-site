/**
 * Fixed timestep game loop following Gaffer on Games pattern
 * Ensures consistent physics regardless of frame rate
 */

import { PHYSICS, RENDERING } from '../simulation/constants.js'

export class GameLoop {
  constructor(onUpdate, onRender) {
    this.onUpdate = onUpdate      // (dt) => void - Fixed timestep physics update
    this.onRender = onRender      // (alpha) => void - Render with interpolation

    this.dt = PHYSICS.DT          // Fixed physics timestep (1/60 second)
    this.maxFrameTime = 0.25      // Cap to prevent spiral of death

    this.accumulator = 0
    this.previousTime = 0
    this.rafId = null
    this.running = false
  }

  /**
   * Main loop tick
   */
  tick = (currentTime) => {
    if (!this.running) return

    // Convert to seconds
    const time = currentTime / 1000

    // Calculate frame time
    let frameTime = time - this.previousTime
    this.previousTime = time

    // Clamp frame time to prevent spiral of death on tab switch
    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime
    }

    this.accumulator += frameTime

    // Run physics updates at fixed timestep
    let updates = 0
    while (this.accumulator >= this.dt && updates < RENDERING.MAX_FRAME_SKIP) {
      this.onUpdate(this.dt)
      this.accumulator -= this.dt
      updates++
    }

    // Calculate interpolation alpha for smooth rendering
    const alpha = this.accumulator / this.dt

    // Render with interpolation
    this.onRender(alpha)

    // Schedule next frame
    this.rafId = requestAnimationFrame(this.tick)
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.running) return

    this.running = true
    this.previousTime = performance.now() / 1000
    this.accumulator = 0
    this.rafId = requestAnimationFrame(this.tick)
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * Check if running
   */
  isRunning() {
    return this.running
  }
}
