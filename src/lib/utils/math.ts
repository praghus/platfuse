const PI = Math.PI

const isVector = (v: Vector) => !isNaN(v.x) && !isNaN(v.y)
const abs = (value: number) => Math.abs(value)
const random = (min: number, max: number) => min + Math.random() * (max - min)
const randomInt = (min: number, max: number) => Math.round(random(min, max))
const randomChoice = <T>(choices: T[]): T => choices[randomInt(0, choices.length - 1)]
const rad2deg = (rad: number) => (rad * 180) / Math.PI
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const lerp = (percent: number, valueA: number, valueB: number) => valueA + clamp(percent) * (valueB - valueA)

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
        return abs(this.x) > abs(this.y) ? (this.x < 0 ? 3 : 1) : this.y < 0 ? 2 : 0
    }

    invert() {
        return new Vector(this.y, -this.x)
    }

    floor() {
        return new Vector(Math.floor(this.x), Math.floor(this.y))
    }

    area() {
        return abs(this.x * this.y)
    }

    lerp(v: Vector, percent: number) {
        return this.add(v.subtract(this).scale(clamp(percent)))
    }

    inRange(size: Vector) {
        return this.x >= 0 && this.y >= 0 && this.x < size.x && this.y < size.y
    }
}

class Box {
    constructor(
        public pos: Vector,
        public size: Vector
    ) {}

    move(v: Vector) {
        return new Box(this.pos.add(v), this.size)
    }

    scale(s: number) {
        return new Box(this.pos.scale(s), this.size.scale(s))
    }
}

const vec2 = (x = 0, y?: number) => new Vector(x, y === undefined ? x : y)
const box = (x = 0, y = 0, w = 0, h = 0) => new Box(vec2(x, y), vec2(w, h))
const rand = (valueA = 1, valueB = 0) => valueB + Math.random() * (valueA - valueB)
const randVector = (length = 1) => new Vector().setAngle(rand(2 * PI), length)

const percent = (value: number, valueA: number, valueB: number) =>
    valueB - valueA ? clamp((value - valueA) / (valueB - valueA)) : 0

const isOverlapping = (pointA: Vector, sizeA: Vector, pointB: Vector, sizeB: Vector) =>
    abs(pointA.x - pointB.x) * 2 < sizeA.x + sizeB.x && abs(pointA.y - pointB.y) * 2 < sizeA.y + sizeB.y

function normalize(n: number, min: number, max: number) {
    while (n < min) n += max - min
    while (n >= max) n -= max - min
    return n
}

export {
    Box,
    Vector,
    box,
    vec2,
    clamp,
    isVector,
    isOverlapping,
    lerp,
    normalize,
    percent,
    rad2deg,
    rand,
    random,
    randomChoice,
    randomInt,
    randVector
}
