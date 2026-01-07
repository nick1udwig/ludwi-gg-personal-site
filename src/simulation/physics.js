/**
 * Physics simulation - simplified for performance
 * Uses direct interpolation toward targets with noise
 */

import { PHYSICS, POINTER } from './constants.js'
import { fastGaussian } from '../utils/random.js'

/**
 * Update physics for all particles
 * Uses simple interpolation + momentum + noise (no dt² scaling)
 * @param {ParticleData} particles
 * @param {number} temperature - 0-100 slider value
 * @param {object|null} pointer - {x, y} position or null if not active
 */
export function updatePhysics(particles, temperature, pointer = null) {
  const { count, posX, posY, prevX, prevY, targetX, targetY } = particles

  // Scale temperature from slider (0-100) to noise amplitude
  const noiseAmp = PHYSICS.BASE_TEMPERATURE + (temperature / 100) * PHYSICS.MAX_TEMPERATURE

  const pull = PHYSICS.SPRING_K      // How fast to move toward target (0-1)
  const momentum = PHYSICS.DAMPING   // How much velocity to retain (0-1)

  // Pointer repulsion parameters
  const hasPointer = pointer !== null
  const pointerX = hasPointer ? pointer.x : 0
  const pointerY = hasPointer ? pointer.y : 0
  const repelRadius = POINTER.REPULSION_RADIUS
  const repelRadiusSq = repelRadius * repelRadius
  const repelStrength = POINTER.REPULSION_STRENGTH

  for (let i = 0; i < count; i++) {
    // Current velocity (from previous frame)
    const velX = posX[i] - prevX[i]
    const velY = posY[i] - prevY[i]

    // Vector toward target
    const dx = targetX[i] - posX[i]
    const dy = targetY[i] - posY[i]

    // Calculate repulsion from pointer
    let repelX = 0
    let repelY = 0

    if (hasPointer) {
      const toPtrX = posX[i] - pointerX
      const toPtrY = posY[i] - pointerY
      const distSq = toPtrX * toPtrX + toPtrY * toPtrY

      if (distSq < repelRadiusSq && distSq > 0.01) {
        const dist = Math.sqrt(distSq)
        // Normalize and scale by inverse distance (stronger when closer)
        const falloff = 1 - dist / repelRadius  // Linear falloff, 1 at center, 0 at edge
        const strength = repelStrength * falloff * falloff  // Quadratic for smoother feel
        repelX = (toPtrX / dist) * strength
        repelY = (toPtrY / dist) * strength
      }
    }

    // New position = current + momentum*velocity + pull*towardTarget + repulsion + noise
    const newX = posX[i] + momentum * velX + pull * dx + repelX + noiseAmp * fastGaussian()
    const newY = posY[i] + momentum * velY + pull * dy + repelY + noiseAmp * fastGaussian()

    // Update positions
    prevX[i] = posX[i]
    prevY[i] = posY[i]
    posX[i] = newX
    posY[i] = newY
  }
}

/**
 * Check if particles have mostly settled (for triggering scroll indicator)
 */
export function areParticlesSettled(particles, threshold = 0.5) {
  const { count, posX, posY, prevX, prevY } = particles

  let totalVelSq = 0
  for (let i = 0; i < count; i++) {
    const vx = posX[i] - prevX[i]
    const vy = posY[i] - prevY[i]
    totalVelSq += vx * vx + vy * vy
  }

  const avgVelSq = totalVelSq / count
  return avgVelSq < threshold * threshold
}
