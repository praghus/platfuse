import { Vector, vec2 } from './vector'

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

    multiply(v: Vector) {
        return new Box(this.pos.multiply(v), this.size.multiply(v))
    }

    divide(v: Vector) {
        return new Box(this.pos.divide(v), this.size.divide(v))
    }

    floor() {
        return new Box(this.pos.floor(), this.size.floor())
    }

    overlaps = (pos: Vector, size: Vector) =>
        Math.abs(this.pos.x - pos.x) * 2 < this.size.x + size.x &&
        Math.abs(this.pos.y - pos.y) * 2 < this.size.y + size.y
}

const box = (x = 0, y = 0, w = 0, h = 0) => new Box(vec2(x, y), vec2(w, h))

export { Box, box }
