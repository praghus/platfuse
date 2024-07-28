/**
 * Converts an angle from radians to degrees.
 * @param rad - The angle in radians.
 * @returns The angle converted to degrees.
 */
const rad2deg = (rad: number) => (rad * 180) / Math.PI

/**
 * Converts an angle from degrees to radians.
 * @param deg - The angle in degrees.
 * @returns The angle converted to radians.
 */
const deg2rad = (deg: number) => (deg * Math.PI) / 180

/**
 * Clamps a value between a minimum and maximum value.
 * @param val - The value to be clamped.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped value.
 */
const clamp = (val: number, min = 0, max = 1) => Math.max(min, Math.min(max, val))

/**
 * Performs linear interpolation between two values.
 * @param percent - The interpolation factor.
 * @param a - The start value.
 * @param b - The end value.
 * @returns The interpolated value.
 */
const lerp = (percent: number, a: number, b: number) => a + clamp(percent) * (b - a)

/**
 * Generates a random number between two values.
 * @param a - The lower bound.
 * @param b - The upper bound.
 * @returns The random number generated.
 */
const rand = (a = 1, b = 0) => b + Math.random() * (a - b)

/**
 * Calculates the percentage of a value between two other values.
 * @param val - The value to calculate the percentage for.
 * @param a - The lower bound.
 * @param b - The upper bound.
 * @returns The percentage of the value between the bounds.
 */
const percent = (val: number, a: number, b: number) => (b - a ? clamp((val - a) / (b - a)) : 0)

/**
 * Generates a random integer between two values.
 * @param valueA - The lower bound.
 * @param valueB - The upper bound.
 * @returns The random integer generated.
 */
const randInt = (valueA: number, valueB = 0) => Math.floor(rand(valueA, valueB))

/**
 * Normalizes a number within a specified range.
 * @param n - The number to normalize.
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @returns The normalized number within the specified range.
 */
function normalize(n: number, min: number, max: number) {
    const range = max - min
    return ((((n - min) % range) + range) % range) + min
}

export { clamp, deg2rad, lerp, normalize, percent, rad2deg, rand, randInt }
