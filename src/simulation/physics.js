/**
 * Physics simulation - simplified for performance
 * Uses direct interpolation toward targets with noise
 */

import { PHYSICS } from './constants.js'
import { fastGaussian } from '../utils/random.js'

/**
 * Update physics for all particles
 * Uses simple interpolation + momentum + noise (no dt² scaling)
 */
export function updatePhysics(particles, temperature) {
  const { count, posX, posY, prevX, prevY, targetX, targetY } = particles

  // Scale temperature from slider (0-100) to noise amplitude
  const noiseAmp = PHYSICS.BASE_TEMPERATURE + (temperature / 100) * PHYSICS.MAX_TEMPERATURE

  const pull = PHYSICS.SPRING_K      // How fast to move toward target (0-1)
  const momentum = PHYSICS.DAMPING   // How much velocity to retain (0-1)

  for (let i = 0; i < count; i++) {
    // Current velocity (from previous frame)
    const velX = posX[i] - prevX[i]
    const velY = posY[i] - prevY[i]

    // Vector toward target
    const dx = targetX[i] - posX[i]
    const dy = targetY[i] - posY[i]

    // New position = current + momentum*velocity + pull*towardTarget + noise
    const newX = posX[i] + momentum * velX + pull * dx + noiseAmp * fastGaussian()
    const newY = posY[i] + momentum * velY + pull * dy + noiseAmp * fastGaussian()

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
