/**
 * Physics simulation using Velocity Verlet integration
 * Forces: Spring attraction + Damping + Brownian motion
 */

import { PHYSICS } from './constants.js'
import { fastGaussian } from '../utils/random.js'

/**
 * Update physics for all particles
 * @param {ParticleData} particles - The particle data structure
 * @param {number} temperature - Current temperature (0-100 from slider)
 * @param {number} dt - Time step
 */
export function updatePhysics(particles, temperature, dt = PHYSICS.DT) {
  const { count, posX, posY, prevX, prevY, targetX, targetY } = particles

  // Scale temperature from slider (0-100) to physics scale
  const tempScale = PHYSICS.BASE_TEMPERATURE + (temperature / 100) * PHYSICS.MAX_TEMPERATURE
  const noiseScale = Math.sqrt(2 * tempScale * dt)

  const springK = PHYSICS.SPRING_K
  const damping = PHYSICS.DAMPING
  const dt2 = dt * dt

  for (let i = 0; i < count; i++) {
    // Current velocity (implicit from Verlet)
    const velX = posX[i] - prevX[i]
    const velY = posY[i] - prevY[i]

    // Spring force toward target
    const dx = targetX[i] - posX[i]
    const dy = targetY[i] - posY[i]

    // Total acceleration = spring + Brownian noise
    const ax = springK * dx + noiseScale * fastGaussian()
    const ay = springK * dy + noiseScale * fastGaussian()

    // Verlet integration with damping
    // new_pos = pos + damping * velocity + acceleration * dt^2
    const newX = posX[i] + damping * velX + ax * dt2
    const newY = posY[i] + damping * velY + ay * dt2

    // Update positions
    prevX[i] = posX[i]
    prevY[i] = posY[i]
    posX[i] = newX
    posY[i] = newY
  }
}

/**
 * Check if particles have mostly settled (for triggering scroll indicator)
 * @returns {boolean} True if average velocity is below threshold
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
