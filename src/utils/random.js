/**
 * Fast random number generation for Brownian motion
 * Uses Box-Muller transform for Gaussian distribution
 */

let spareGaussian = 0
let hasSpare = false

/**
 * Generate a random number from standard normal distribution (mean=0, stddev=1)
 * Uses Box-Muller transform
 */
export function gaussianRandom() {
  if (hasSpare) {
    hasSpare = false
    return spareGaussian
  }

  let u, v, s
  do {
    u = Math.random() * 2 - 1
    v = Math.random() * 2 - 1
    s = u * u + v * v
  } while (s >= 1 || s === 0)

  const mul = Math.sqrt(-2 * Math.log(s) / s)
  spareGaussian = v * mul
  hasSpare = true
  return u * mul
}

/**
 * Pre-computed random table for even faster access
 * Useful when calling thousands of times per frame
 */
const RANDOM_TABLE_SIZE = 4096
const RANDOM_TABLE_MASK = RANDOM_TABLE_SIZE - 1
const randomTable = new Float32Array(RANDOM_TABLE_SIZE)
let randomIndex = 0
let tableInitialized = false

/**
 * Fast Gaussian random from pre-computed table
 * Not cryptographically secure, but fast and good enough for visuals
 * Lazily initializes table on first use to avoid blocking page load
 */
export function fastGaussian() {
  if (!tableInitialized) {
    for (let i = 0; i < RANDOM_TABLE_SIZE; i++) {
      randomTable[i] = gaussianRandom()
    }
    tableInitialized = true
  }
  randomIndex = (randomIndex + 1) & RANDOM_TABLE_MASK
  return randomTable[randomIndex]
}

/**
 * Shuffle the random table occasionally to prevent visible patterns
 */
export function refreshRandomTable() {
  for (let i = 0; i < RANDOM_TABLE_SIZE; i++) {
    randomTable[i] = gaussianRandom()
  }
  randomIndex = 0
  tableInitialized = true
}
