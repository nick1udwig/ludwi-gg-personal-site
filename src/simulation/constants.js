// Physics constants - tunable parameters
export const PHYSICS = {
  SPRING_K: 0.08,           // Pull toward target per frame (0.05-0.15 works well)
  DAMPING: 0.85,            // Velocity retention (0.8-0.9 for smooth, lower = faster stop)
  BASE_TEMPERATURE: 0.1,    // Minimum jitter amplitude
  MAX_TEMPERATURE: 3,       // Maximum jitter at full temperature
  DT: 1 / 60,               // Physics timestep (for game loop timing)
  STEPS_PER_FRAME: 1,       // Run multiple physics updates per render
}

// Pointer interaction constants
export const POINTER = {
  REPULSION_RADIUS: 80,     // Pixels - how far the repulsion reaches
  REPULSION_STRENGTH: 15,   // How strongly particles are pushed away
  FALLOFF: 2,               // Power for distance falloff (2 = inverse square)
}

export const RENDERING = {
  PARTICLE_RADIUS: 1.5,     // Pixel radius of particles
  TARGET_FPS: 60,
  MAX_FRAME_SKIP: 5,        // Prevent spiral of death
}

// Responsive particle counts
export const RESPONSIVE = {
  MOBILE: 600,              // < 480px
  TABLET: 1000,             // < 768px
  DESKTOP: 1500,            // < 1200px
  LARGE: 2000,              // >= 1200px
}

// Get particle count based on screen width
export function getParticleCount(width) {
  if (width < 480) return RESPONSIVE.MOBILE
  if (width < 768) return RESPONSIVE.TABLET
  if (width < 1200) return RESPONSIVE.DESKTOP
  return RESPONSIVE.LARGE
}
