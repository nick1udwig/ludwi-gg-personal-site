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

  // Track if user has ever toggled the view
  let hasToggledView = false

  // Add hint shine animation to view toggle button
  if (viewToggle) {
    viewToggle.classList.add('hint-shine')
  }

  // Function to toggle view and update button state
  function toggleView() {
    const isPotentialView = simulation.toggleView()
    if (viewToggle) {
      viewToggle.classList.toggle('potential-active', isPotentialView)

      // Remove shine hint after first interaction
      if (!hasToggledView) {
        hasToggledView = true
        viewToggle.classList.remove('hint-shine')
      }
    }
  }

  // --- Pointer interaction for particle repulsion ---
  // Works with both mouse (desktop) and touch (mobile)

  // Helper to get canvas-relative coordinates
  function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect()
    // Account for CSS scaling (canvas internal size vs display size)
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // Mouse events (desktop)
  canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY)
    simulation.setPointer(x, y)
  })

  canvas.addEventListener('mouseleave', () => {
    simulation.clearPointer()
  })

  // Click to toggle view (desktop)
  canvas.addEventListener('click', toggleView)

  // Touch events (mobile) - distinguish tap from drag/hold
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let touchMoved = false
  const TAP_THRESHOLD = 10       // pixels - if moved more than this, it's a drag
  const TAP_TIME_THRESHOLD = 200 // ms - if held longer, it's a hold (not a tap)

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartX = touch.clientX
      touchStartY = touch.clientY
      touchStartTime = Date.now()
      touchMoved = false

      // Start repulsion immediately on touch
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
      simulation.setPointer(x, y)
    }
  }, { passive: true })

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - touchStartX)
      const dy = Math.abs(touch.clientY - touchStartY)

      if (dx > TAP_THRESHOLD || dy > TAP_THRESHOLD) {
        touchMoved = true
      }

      // Update repulsion position
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
      simulation.setPointer(x, y)
    }
  }, { passive: true })

  canvas.addEventListener('touchend', (e) => {
    // Clear repulsion
    simulation.clearPointer()

    // Prevent double-firing on devices that fire both touch and click
    e.preventDefault()

    // Only toggle if it was a quick tap (not a drag or hold)
    if (e.changedTouches.length === 1) {
      const touchDuration = Date.now() - touchStartTime
      const wasTap = !touchMoved && touchDuration < TAP_TIME_THRESHOLD

      if (wasTap) {
        toggleView()
      }
    }
  })

  canvas.addEventListener('touchcancel', () => {
    simulation.clearPointer()
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
