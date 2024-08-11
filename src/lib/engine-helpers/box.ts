import { Polygon } from './polygon'
import { Vector } from './vector'

/**
 * Represents a box in 2D space.
 */
export class Box {
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
        this.pos = this.pos.add(v)
        return this
    }

    /**
     * Scales the box by a given factor.
     * @param s - The scaling factor.
     * @returns A new Box instance with the updated size.
     */
    scale(s: number) {
        this.pos = this.pos.scale(s)
        this.size = this.size.scale(s)
        return this
    }

    /**
     * Multiplies the box by a given vector.
     * @param v - The vector to multiply the box by.
     * @returns A new Box instance with the updated position and size.
     */
    multiply(v: Vector) {
        this.pos = this.pos.multiply(v)
        this.size = this.size.multiply(v)
        return this
    }

    /**
     * Divides the box by a given vector.
     * @param v - The vector to divide the box by.
     * @returns A new Box instance with the updated position and size.
     */
    divide(v: Vector) {
        this.pos = this.pos.divide(v)
        this.size = this.size.divide(v)
        return this
    }

    /**
     * Rounds down the position and size of the box to the nearest integer.
     * @returns A new Box instance with the rounded position and size.
     */
    floor() {
        this.pos = this.pos.floor()
        this.size = this.size.floor()
        return this
    }

    /**
     * Converts the box to a polygon.
     * @returns A new Polygon instance representing the box.
     */
    toPolygon() {
        const center = this.size.divide(2)
        return new Polygon(this.pos.add(center), [
            new Vector().subtract(center),
            new Vector(this.size.x, 0).subtract(center),
            new Vector(this.size.x, this.size.y).subtract(center),
            new Vector(0, this.size.y).subtract(center)
        ])
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
