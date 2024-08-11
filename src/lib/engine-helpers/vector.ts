import { clamp } from '../utils/math'

/**
 * Represents a 2D vector with x and y components.
 */
export class Vector {
    /**
     * Creates a new vector.
     * @param x - The x-coordinate of the vector.
     * @param y - The y-coordinate of the vector.
     */
    constructor(
        public x = 0,
        public y = 0
    ) {}

    /**
     * Adds the given vector to this vector and returns a new vector.
     * @param v - The vector to add.
     * @returns A new vector representing the sum of this vector and the given vector.
     */
    add(v: Vector) {
        return new Vector(this.x + v.x, this.y + v.y)
    }

    /**
     * Subtracts the given vector from this vector and returns a new vector.
     * @param v - The vector to subtract.
     * @returns A new vector representing the result of the subtraction.
     */
    subtract(v: Vector) {
        return new Vector(this.x - v.x, this.y - v.y)
    }

    /**
     * Multiplies the current vector by another vector.
     * @param v The vector to multiply by.
     * @returns A new vector that is the result of the multiplication.
     */
    multiply(v: Vector) {
        return new Vector(this.x * v.x, this.y * v.y)
    }

    /**
     * Divides the vector by either another vector or a number.
     * If the argument is a number, it divides each component of the vector by that number.
     * If the argument is a vector, it divides the corresponding components of the vector
     * by the components of the argument vector.
     * @param d - The vector or number to divide by.
     * @returns A new vector resulting from the division.
     */
    divide(d: Vector | number) {
        if (typeof d === 'number') return new Vector(this.x / d, this.y / d)
        return new Vector(this.x / d.x, this.y / d.y)
    }

    /**
     * Creates a new Vector object with the same x and y values as the current vector.
     * @returns A new Vector object with the same x and y values.
     */
    clone() {
        return new Vector(this.x, this.y)
    }

    /**
     * Scales the vector by a given factor.
     * @param s - The scaling factor.
     * @returns A new Vector instance representing the scaled vector.
     */
    scale(s: number) {
        return new Vector(this.x * s, this.y * s)
    }

    /**
     * Calculates the length of the vector.
     * @returns The length of the vector.
     */
    length() {
        return this.lengthSquared() ** 0.5
    }

    /**
     * Calculates the squared length of the vector.
     * @returns The squared length of the vector.
     */
    lengthSquared() {
        return this.x ** 2 + this.y ** 2
    }

    /**
     * Calculates the Euclidean distance between this vector and the given vector.
     * @param v - The vector to calculate the distance to.
     * @returns The Euclidean distance between the two vectors.
     */
    distance(v: Vector) {
        return this.distanceSquared(v) ** 0.5
    }

    /**
     * Calculates the squared distance between this vector and the given vector.
     * @param v - The vector to calculate the distance to.
     * @returns The squared distance between this vector and the given vector.
     */
    distanceSquared(v: Vector) {
        return (this.x - v.x) ** 2 + (this.y - v.y) ** 2
    }

    /**
     * Normalizes the vector to a specified length.
     * If the vector's length is zero, a new vector with the specified length is returned.
     * @param length - The desired length of the normalized vector. Default is 1.
     * @returns A new Vector instance representing the normalized vector.
     */
    normalize(length = 1) {
        const l = this.length()
        return l ? this.scale(length / l) : new Vector(0, length)
    }

    /**
     * Clamps the length of the vector to a specified value.
     * If the length of the vector is greater than the specified value, the vector is scaled down.
     * If the length of the vector is less than or equal to the specified value, the vector remains unchanged.
     * @param length The maximum length to clamp the vector to. Default value is 1.
     * @returns A new vector with the clamped length.
     */
    clampLength(length = 1) {
        const l = this.length()
        return l > length ? this.scale(length / l) : this
    }

    /**
     * Calculates the dot product between this vector and the given vector.
     * @param v - The vector to calculate the dot product with.
     * @returns The dot product of the two vectors.
     */
    dot(v: Vector) {
        return this.x * v.x + this.y * v.y
    }

    /**
     * Calculates the cross product of this vector and the given vector.
     * @param v - The vector to calculate the cross product with.
     * @returns The cross product of the two vectors.
     */
    cross(v: Vector) {
        return this.x * v.y - this.y * v.x
    }

    /**
     * Calculates the angle of the vector in radians.
     * The angle is measured counterclockwise from the positive x-axis.
     * @returns The angle of the vector in radians.
     */
    angle() {
        return Math.atan2(this.x, this.y)
    }

    /**
     * Sets the angle and length of the vector.
     * @param angle - The angle in radians.
     * @param length - The length of the vector.
     * @returns The modified vector.
     */
    setAngle(angle = 0, length = 1) {
        this.x = length * Math.sin(angle)
        this.y = length * Math.cos(angle)
        return this
    }

    /**
     * Rotates the vector by the specified angle.
     * @param angle - The angle (in radians) by which to rotate the vector.
     * @returns A new Vector representing the rotated vector.
     */
    rotate(angle: number) {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Vector(this.x * c - this.y * s, this.x * s + this.y * c)
    }

    /**
     * Returns the direction of the vector.
     * @returns {number} The direction of the vector.
     *                  - 0: Up
     *                  - 1: Right
     *                  - 2: Down
     *                  - 3: Left
     */
    direction() {
        return Math.abs(this.x) > Math.abs(this.y) ? (this.x < 0 ? 3 : 1) : this.y < 0 ? 2 : 0
    }

    /**
     * Returns a new Vector object with the x and y values reversed.
     * @returns A new Vector object with the x and y values reversed.
     */
    reverse() {
        return new Vector(-this.y, -this.x)
    }

    /**
     * Returns a new Vector object with the negated values of the current vector.
     * @returns {Vector} - A new Vector object with negated values.
     */
    negate() {
        return new Vector(-this.x, -this.y)
    }

    magnitude() {
        return Math.hypot(this.x, this.y)
    }

    /**
     * Returns a new Vector with the components rounded down to the nearest integer.
     * @returns A new Vector with the components rounded down.
     */
    floor() {
        return new Vector(Math.floor(this.x), Math.floor(this.y))
    }

    /**
     * Calculates the area of the vector.
     * @returns The area of the vector.
     */
    area() {
        return Math.abs(this.x * this.y)
    }

    /**
     * Performs a linear interpolation between two vectors.
     * @param v - The vector to interpolate with.
     * @param percent - The interpolation factor, ranging from 0 to 1.
     * @returns The interpolated vector.
     */
    lerp(v: Vector, percent: number) {
        return this.add(v.subtract(this).scale(clamp(percent)))
    }

    perpendicular() {
        return new Vector(-this.y, this.x)
    }

    /**
     * Checks if the current vector is within the range of the specified size.
     * @param size - The size vector to compare against.
     * @returns `true` if the current vector is within the range, `false` otherwise.
     */
    inRange(size: Vector) {
        return this.x >= 0 && this.y >= 0 && this.x < size.x && this.y < size.y
    }
}
