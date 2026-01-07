/**
 * Particle data management using Structure of Arrays (SoA)
 * with TypedArrays for cache-efficient memory access
 */

export class ParticleData {
  constructor(maxParticles) {
    this.maxParticles = maxParticles
    this.count = 0

    // Current positions
    this.posX = new Float32Array(maxParticles)
    this.posY = new Float32Array(maxParticles)

    // Previous positions (for Verlet integration)
    this.prevX = new Float32Array(maxParticles)
    this.prevY = new Float32Array(maxParticles)

    // Target positions (where particles want to go)
    this.targetX = new Float32Array(maxParticles)
    this.targetY = new Float32Array(maxParticles)
  }

  /**
   * Initialize particles on a square lattice grid
   */
  initializeGrid(width, height, count) {
    this.count = Math.min(count, this.maxParticles)

    // Calculate grid dimensions
    const aspectRatio = width / height
    const cols = Math.ceil(Math.sqrt(this.count * aspectRatio))
    const rows = Math.ceil(this.count / cols)

    // Spacing between particles
    const spacingX = width / (cols + 1)
    const spacingY = height / (rows + 1)

    let idx = 0
    for (let row = 0; row < rows && idx < this.count; row++) {
      for (let col = 0; col < cols && idx < this.count; col++) {
        const x = spacingX * (col + 1)
        const y = spacingY * (row + 1)

        this.posX[idx] = x
        this.posY[idx] = y
        this.prevX[idx] = x
        this.prevY[idx] = y

        // Initially, target = current position (will be set later)
        this.targetX[idx] = x
        this.targetY[idx] = y

        idx++
      }
    }
  }

  /**
   * Set target positions from an array of {x, y} objects
   */
  setTargets(targets) {
    const len = Math.min(targets.length, this.count)
    for (let i = 0; i < len; i++) {
      this.targetX[i] = targets[i].x
      this.targetY[i] = targets[i].y
    }
  }

  /**
   * Resize particle system (e.g., on window resize)
   * Attempts to preserve relative positions
   */
  resize(oldWidth, oldHeight, newWidth, newHeight) {
    const scaleX = newWidth / oldWidth
    const scaleY = newHeight / oldHeight

    for (let i = 0; i < this.count; i++) {
      this.posX[i] *= scaleX
      this.posY[i] *= scaleY
      this.prevX[i] *= scaleX
      this.prevY[i] *= scaleY
      this.targetX[i] *= scaleX
      this.targetY[i] *= scaleY
    }
  }

  /**
   * Reset particles to their target positions (for reduced motion)
   */
  snapToTargets() {
    for (let i = 0; i < this.count; i++) {
      this.posX[i] = this.targetX[i]
      this.posY[i] = this.targetY[i]
      this.prevX[i] = this.targetX[i]
      this.prevY[i] = this.targetY[i]
    }
  }
}
