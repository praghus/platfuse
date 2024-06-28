import { clamp, rand } from '../utils/helpers'

class Vector {
    constructor(
        public x = 0,
        public y = 0
    ) {}

    copy() {
        return new Vector(this.x, this.y)
    }

    add(v: Vector) {
        return new Vector(this.x + v.x, this.y + v.y)
    }

    subtract(v: Vector) {
        return new Vector(this.x - v.x, this.y - v.y)
    }

    multiply(v: Vector) {
        return new Vector(this.x * v.x, this.y * v.y)
    }

    divide(v: Vector) {
        return new Vector(this.x / v.x, this.y / v.y)
    }

    scale(s: number) {
        return new Vector(this.x * s, this.y * s)
    }

    length() {
        return this.lengthSquared() ** 0.5
    }

    lengthSquared() {
        return this.x ** 2 + this.y ** 2
    }

    distance(v: Vector) {
        return this.distanceSquared(v) ** 0.5
    }

    distanceSquared(v: Vector) {
        return (this.x - v.x) ** 2 + (this.y - v.y) ** 2
    }

    normalize(length = 1) {
        const l = this.length()
        return l ? this.scale(length / l) : new Vector(0, length)
    }

    clampLength(length = 1) {
        const l = this.length()
        return l > length ? this.scale(length / l) : this
    }

    dot(v: Vector) {
        return this.x * v.x + this.y * v.y
    }

    cross(v: Vector) {
        return this.x * v.y - this.y * v.x
    }

    angle() {
        return Math.atan2(this.x, this.y)
    }

    setAngle(angle = 0, length = 1) {
        this.x = length * Math.sin(angle)
        this.y = length * Math.cos(angle)
        return this
    }

    rotate(angle: number) {
        const c = Math.cos(angle),
            s = Math.sin(angle)
        return new Vector(this.x * c - this.y * s, this.x * s + this.y * c)
    }

    direction() {
        return Math.abs(this.x) > Math.abs(this.y) ? (this.x < 0 ? 3 : 1) : this.y < 0 ? 2 : 0
    }

    invert() {
        return new Vector(this.y, -this.x)
    }

    floor() {
        return new Vector(Math.floor(this.x), Math.floor(this.y))
    }

    area() {
        return Math.abs(this.x * this.y)
    }

    lerp(v: Vector, percent: number) {
        return this.add(v.subtract(this).scale(clamp(percent)))
    }

    inRange(size: Vector) {
        return this.x >= 0 && this.y >= 0 && this.x < size.x && this.y < size.y
    }
}

const vec2 = (x = 0, y?: number) => new Vector(x, y === undefined ? x : y)
const isVector = (v: Vector) => !isNaN(v.x) && !isNaN(v.y)
const randVector = (length = 1) => new Vector().setAngle(rand(2 * Math.PI), length)

export { Vector, vec2, isVector, randVector }
