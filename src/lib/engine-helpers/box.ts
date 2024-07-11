import { Vector, vec2 } from './vector'

/**
 * Represents a box in 2D space.
 */
class Box {
    /**
     * Creates a new instance of the Box class.
     * @param pos - The position of the box.
     * @param size - The size of the box.
     */
    constructor(
        public pos: Vector,
        public size: Vector
    ) {}

    /**
     * Moves the box by a given vector.
     * @param v - The vector to move the box by.
     * @returns A new Box instance with the updated position.
     */
    move(v: Vector) {
        return new Box(this.pos.add(v), this.size)
    }

    /**
     * Scales the box by a given factor.
     * @param s - The scaling factor.
     * @returns A new Box instance with the updated size.
     */
    scale(s: number) {
        return new Box(this.pos.scale(s), this.size.scale(s))
    }

    /**
     * Multiplies the box by a given vector.
     * @param v - The vector to multiply the box by.
     * @returns A new Box instance with the updated position and size.
     */
    multiply(v: Vector) {
        return new Box(this.pos.multiply(v), this.size.multiply(v))
    }

    /**
     * Divides the box by a given vector.
     * @param v - The vector to divide the box by.
     * @returns A new Box instance with the updated position and size.
     */
    divide(v: Vector) {
        return new Box(this.pos.divide(v), this.size.divide(v))
    }

    /**
     * Rounds down the position and size of the box to the nearest integer.
     * @returns A new Box instance with the rounded position and size.
     */
    floor() {
        return new Box(this.pos.floor(), this.size.floor())
    }

    /**
     * Checks if the box overlaps with another box.
     * @param pos - The position of the other box.
     * @param size - The size of the other box.
     * @returns True if the boxes overlap, false otherwise.
     */
    overlaps = (pos: Vector, size: Vector) =>
        Math.abs(this.pos.x - pos.x) * 2 < this.size.x + size.x &&
        Math.abs(this.pos.y - pos.y) * 2 < this.size.y + size.y
}

/**
 * Creates a new Box instance with the specified parameters.
 * @param x - The x-coordinate of the box's position.
 * @param y - The y-coordinate of the box's position.
 * @param w - The width of the box.
 * @param h - The height of the box.
 * @returns A new Box instance.
 */
const box = (x = 0, y = 0, w = 0, h = 0) => new Box(vec2(x, y), vec2(w, h))

export { Box, box }
