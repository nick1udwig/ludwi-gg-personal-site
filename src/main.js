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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  let viewTogglePending = false
  async function toggleView() {
    if (viewTogglePending) return

    viewTogglePending = true
    if (viewToggle) {
      viewToggle.setAttribute('aria-busy', 'true')
    }

    try {
      const isPotentialView = await simulation.toggleView()

      if (viewToggle) {
        viewToggle.classList.toggle('potential-active', isPotentialView)

        // Remove shine hint after first interaction
        if (!hasToggledView) {
          hasToggledView = true
          viewToggle.classList.remove('hint-shine')
        }
      }
    } finally {
      if (viewToggle) {
        viewToggle.removeAttribute('aria-busy')
      }
      viewTogglePending = false
    }
  }

  // --- Pointer interaction for particle repulsion ---
  // Works with both mouse (desktop) and touch (mobile)

  // Helper to get canvas-relative coordinates
  function getCanvasCoords(clientX, clientY, rect = canvas.getBoundingClientRect()) {
    // Particle positions use CSS pixels; the backing canvas may use a higher DPR.
    const scaleX = simulation.width / rect.width
    const scaleY = simulation.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // Mouse events (desktop)
  canvas.addEventListener('mousemove', (e) => {
    simulation.setPointer(e.offsetX, e.offsetY)
  })

  canvas.addEventListener('mouseleave', () => {
    simulation.clearPointer()
  })

  // Click to toggle view (desktop)
  canvas.addEventListener('click', toggleView)

  // Touch events (mobile) - repulsion on drag, tap to toggle
  let touchStartX = 0
  let touchStartY = 0
  let touchRect = null
  const TAP_THRESHOLD = 10 // pixels - if moved more than this, it's a drag

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchRect = canvas.getBoundingClientRect()
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }
  }, { passive: true })

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      // Update repulsion position while dragging
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY, touchRect || undefined)
      simulation.setPointer(x, y)
    }
  }, { passive: true })

  canvas.addEventListener('touchend', (e) => {
    // Clear repulsion
    simulation.clearPointer()
    touchRect = null

    // Prevent double-firing on devices that fire both touch and click
    e.preventDefault()

    // Only toggle if it was a tap (not a drag)
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const dx = Math.abs(touch.clientX - touchStartX)
      const dy = Math.abs(touch.clientY - touchStartY)

      if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
        toggleView()
      }
    }
  })

  canvas.addEventListener('touchcancel', () => {
    simulation.clearPointer()
    touchRect = null
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

  // --- Scroll indicator auto-hide ---
  const scrollIndicator = document.querySelector('.scroll-indicator')
  if (scrollIndicator) {
    // After the fadeIn completes, add breathing class
    setTimeout(() => {
      if (!scrollIndicator.classList.contains('hidden')) {
        scrollIndicator.classList.add('visible')
      }
    }, 2000)

    window.addEventListener('scroll', updateScrollEffects, { passive: true })
  }

  // --- Hero scroll parallax ---
  const heroSection = document.getElementById('hero')
  let heroHeight = heroSection ? heroSection.offsetHeight : 0
  let scrollTicking = false

  function updateScrollEffects() {
    if (scrollTicking) return

    scrollTicking = true
    requestAnimationFrame(() => {
      scrollTicking = false
      const scrollY = window.scrollY

      if (scrollIndicator && scrollY > 50) {
        scrollIndicator.classList.add('hidden')
        scrollIndicator.classList.remove('visible')
      }

      if (heroSection && !reducedMotion && scrollY < heroHeight) {
        const progress = scrollY / heroHeight
        heroSection.style.opacity = 1 - progress * 0.6
        heroSection.style.transform = `translateY(${-scrollY * 0.15}px)`
      }
    })
  }

  if (heroSection && !reducedMotion) {
    window.addEventListener('scroll', updateScrollEffects, { passive: true })
    window.addEventListener('resize', () => {
      heroHeight = heroSection.offsetHeight
      updateScrollEffects()
    }, { passive: true })
  }

  // --- Animated wave divider ---
  const wavePath = document.querySelector('.wave-path')
  if (wavePath) {
    if (!reducedMotion) {
      let time = 0
      let waveRaf = null
      let waveVisible = false

      function animateWave() {
        if (!waveVisible || document.hidden) {
          waveRaf = null
          return
        }

        time += 0.02
        let d = 'M0,30 '
        for (let x = 0; x <= 1200; x += 10) {
          const y = 30
            + Math.sin(x * 0.01 + time) * 6
            + Math.sin(x * 0.025 + time * 1.5) * 3
            + Math.sin(x * 0.005 + time * 0.5) * 4
          d += `L${x},${y.toFixed(1)} `
        }
        wavePath.setAttribute('d', d)
        waveRaf = requestAnimationFrame(animateWave)
      }

      function startWave() {
        if (!waveRaf && waveVisible && !document.hidden) {
          waveRaf = requestAnimationFrame(animateWave)
        }
      }

      const waveObserver = new IntersectionObserver((entries) => {
        waveVisible = entries.some(entry => entry.intersectionRatio >= 0.25)
        startWave()
      }, { threshold: 0.25 })

      waveObserver.observe(wavePath.closest('.wave-divider') || wavePath)

      document.addEventListener('visibilitychange', startWave)
    }
  }

  // --- Scroll-triggered journal entry reveals ---
  const journalEntries = document.querySelectorAll('.journal-entry')
  if (journalEntries.length > 0) {
    if (reducedMotion) {
      journalEntries.forEach(entry => {
        entry.classList.add('revealed')
      })
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      }, { threshold: 0.1 })

      journalEntries.forEach((entry, i) => {
        entry.style.animationDelay = `${i * 0.08}s`
        observer.observe(entry)
      })
    }
  }

  // Expose for debugging (remove in production)
  if (import.meta.env.DEV) {
    window.simulation = simulation
  }
}
