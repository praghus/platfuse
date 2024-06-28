import { Vector } from '../../../dist/@types'
import { vec2 } from './vector'

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

    overlapping = (b: Box) =>
        Math.abs(this.pos.x - b.pos.x) * 2 < this.size.x + b.size.x &&
        Math.abs(this.pos.y - b.pos.y) * 2 < this.size.y + b.size.y
}

const box = (x = 0, y = 0, w = 0, h = 0) => new Box(vec2(x, y), vec2(w, h))

export { Box, box }
