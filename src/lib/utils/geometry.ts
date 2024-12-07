import { Vector } from '../engine-helpers/vector'
import { rand } from './math'

/**
 * Creates a 2D vector.
 * @param x - The x-coordinate of the vector.
 * @param y - The y-coordinate of the vector. If not provided, it will default to the value of `x`.
 * @returns A new Vector object representing the 2D vector.
 */
const vec2 = (x = 0, y?: number) => new Vector(x, y === undefined ? x : y)

/**
 * Generates a random vector with an optional length.
 * @param length The length of the vector (default is 1).
 * @returns A new Vector object with a random angle and optional length.
 */
const randVector = (length = 1) => new Vector().setAngle(rand(2 * Math.PI), length)

/**
 * Generates a random point on a circle.
 * @param radius The radius of the circle (default: 1).
 * @param minRadius The minimum radius of the circle (default: 0).
 * @returns A vector representing a random point on the circle.
 */
const randPointOnCircle = (radius = 1, minRadius = 0) =>
    radius > 0 ? randVector(radius * rand(minRadius / radius, 1) ** 0.5) : new Vector()

export { vec2, randVector, randPointOnCircle }
