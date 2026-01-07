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
  const viewToggle = document.getElementById('view-toggle')

  if (!canvas) {
    console.error('Canvas element not found')
    return
  }

  // Detect mobile for lower default temperature
  const isMobile = window.innerWidth < 768
  const defaultTemp = isMobile ? 5 : 15

  // Update slider to match
  if (temperatureSlider) {
    temperatureSlider.value = defaultTemp
    if (tempValueDisplay) {
      tempValueDisplay.textContent = defaultTemp
    }
  }

  // Create particle system
  const simulation = new ParticleSystem(canvas, {
    text: 'NICK LUDWIG',
    imagePath: '/headshot.png',
    initialTemperature: defaultTemp
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

  // Function to toggle view and update button state
  function toggleView() {
    const isPotentialView = simulation.toggleView()
    if (viewToggle) {
      viewToggle.classList.toggle('potential-active', isPotentialView)
    }
  }

  // Click/tap canvas to toggle between particle view and potential view
  canvas.addEventListener('click', toggleView)

  // Also support touch on canvas
  canvas.addEventListener('touchend', (e) => {
    // Prevent double-firing on devices that fire both touch and click
    e.preventDefault()
    toggleView()
  })

  // Toggle button click
  if (viewToggle) {
    viewToggle.addEventListener('click', (e) => {
      e.stopPropagation() // Don't trigger canvas click
      toggleView()
    })
  }

  // Add cursor style to indicate clickability
  canvas.style.cursor = 'pointer'

  // Start simulation
  simulation.start()

  // Expose for debugging (remove in production)
  if (import.meta.env.DEV) {
    window.simulation = simulation
  }
}
