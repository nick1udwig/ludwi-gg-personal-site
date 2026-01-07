// Physics constants - tunable parameters
export const PHYSICS = {
  SPRING_K: 0.5,            // Attraction strength to target (higher = faster settling)
  DAMPING: 0.85,            // Velocity retention per frame (lower = more friction, faster settling)
  BASE_TEMPERATURE: 0.2,    // Minimum thermal noise
  MAX_TEMPERATURE: 8,       // Maximum slider value effect
  DT: 1 / 60,               // Physics timestep (60 Hz)
  MASS: 1,                  // Uniform particle mass
}

export const RENDERING = {
  PARTICLE_RADIUS: 1.5,     // Pixel radius of particles
  TARGET_FPS: 60,
  MAX_FRAME_SKIP: 5,        // Prevent spiral of death
}

// Responsive particle counts
export const RESPONSIVE = {
  MOBILE: 600,              // < 480px
  TABLET: 1200,             // < 768px
  DESKTOP: 2000,            // < 1200px
  LARGE: 2800,              // >= 1200px
}

// Get particle count based on screen width
export function getParticleCount(width) {
  if (width < 480) return RESPONSIVE.MOBILE
  if (width < 768) return RESPONSIVE.TABLET
  if (width < 1200) return RESPONSIVE.DESKTOP
  return RESPONSIVE.LARGE
}
