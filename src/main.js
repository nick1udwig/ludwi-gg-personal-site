/**
 * Main entry point
 * Initialize particle simulation and connect UI
 */

import { ParticleSystem } from './simulation/ParticleSystem.js'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', init)

async function init() {
  // Get elements
  const canvas = document.getElementById('particle-canvas')
  const temperatureSlider = document.getElementById('temperature')
  const tempValueDisplay = document.querySelector('.temp-value')
  const scrollIndicator = document.querySelector('.scroll-indicator')

  if (!canvas) {
    console.error('Canvas element not found')
    return
  }

  // Create particle system
  const simulation = new ParticleSystem(canvas, {
    text: 'NICK LUDWIG',
    imagePath: '/headshot.png',
    initialTemperature: parseInt(temperatureSlider?.value || '15', 10),
    onSettled: () => {
      // Show scroll indicator when particles settle
      if (scrollIndicator) {
        scrollIndicator.style.animationPlayState = 'running'
      }
    }
  })

  // Initialize asynchronously (loads image)
  await simulation.init()

  // Connect temperature slider
  if (temperatureSlider) {
    temperatureSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value, 10)
      simulation.setTemperature(value)

      // Update display
      if (tempValueDisplay) {
        tempValueDisplay.textContent = value
      }
    })
  }

  // Start simulation
  simulation.start()

  // Expose for debugging (remove in production)
  if (import.meta.env.DEV) {
    window.simulation = simulation
  }
}
