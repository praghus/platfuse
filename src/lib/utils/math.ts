import { Box, Vector } from 'sat'

// export class Vector {
//     constructor(public x = 0, public y = x) {}
//     set = (x: number, y = x): Vector => {
//         this.x = x
//         this.y = y
//         return this
//     }

//     clone = (): Vector => new Vector(this.x, this.y)
//     add = (p2: Vector): Vector => new Vector(this.x + p2.x, this.y + p2.y)
//     sub = (p2: Vector): Vector => new Vector(this.x - p2.x, this.y - p2.y)
//     scale = (p2: Vector): Vector => new Vector(this.x * p2.x, this.y * p2.y)
//     dist = (p2: Vector): number => Math.sqrt((this.x - p2.x) * (this.x - p2.x) + (this.y - p2.y) * (this.y - p2.y))
//     len = (): number => this.dist(new Vector())
//     len2 = (): number => this.x * this.x + this.y * this.y
//     normal = (): Vector => new Vector(this.y, -this.x)
//     dot = (p2: Vector): number => this.x * p2.x + this.y * p2.y
//     angle = (p2: Vector): number => rad2deg(Math.atan2(this.y - p2.y, this.x - p2.x))
//     lerp = (p2: Vector, t: number): Vector => new Vector(lerp(this.x, p2.x, t), lerp(this.y, p2.y, t))
//     toFixed = (n: number): Vector => new Vector(Number(this.x.toFixed(n)), Number(this.y.toFixed(n)))
//     eq = (other: Vector): boolean => this.x === other.x && this.y === other.y
// }

// export class Box {
//     constructor(public pos: Vector, public width: number, public height: number) {}
// }

const random = (min: number, max: number) => min + Math.random() * (max - min)
const randomInt = (min: number, max: number) => Math.round(random(min, max))
const randomChoice = <T>(choices: T[]): T => choices[randomInt(0, choices.length - 1)]
const rad2deg = (rad: number) => (rad * 180) / Math.PI
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const boxOverlap = (a: Box, b: Box) =>
    a.pos.x < b.pos.x + b.w && a.pos.x + a.w > b.pos.x && a.pos.y < b.pos.y + b.h && a.pos.y + a.h > b.pos.y

function normalize(n: number, min: number, max: number) {
    while (n < min) n += max - min
    while (n >= max) n -= max - min
    return n
}

export { Box, Vector, boxOverlap, clamp, lerp, normalize, rad2deg, random, randomChoice, randomInt }
