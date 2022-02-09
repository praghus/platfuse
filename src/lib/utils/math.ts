export class Vec2 {
    constructor(public x = 0, public y = x) {}
    set = (x: number, y = x): Vec2 => {
        this.x = x
        this.y = y
        return this
    }
    clone = (): Vec2 => new Vec2(this.x, this.y)
    add = (p2: Vec2): Vec2 => new Vec2(this.x + p2.x, this.y + p2.y)
    sub = (p2: Vec2): Vec2 => new Vec2(this.x - p2.x, this.y - p2.y)
    scale = (p2: Vec2): Vec2 => new Vec2(this.x * p2.x, this.y * p2.y)
    dist = (p2: Vec2): number => Math.sqrt((this.x - p2.x) * (this.x - p2.x) + (this.y - p2.y) * (this.y - p2.y))
    len = (): number => this.dist(new Vec2())
    len2 = (): number => this.x * this.x + this.y * this.y
    normal = (): Vec2 => new Vec2(this.y, -this.x)
    dot = (p2: Vec2): number => this.x * p2.x + this.y * p2.y
    angle = (p2: Vec2): number => rad2deg(Math.atan2(this.y - p2.y, this.x - p2.x))
    lerp = (p2: Vec2, t: number): Vec2 => new Vec2(lerp(this.x, p2.x, t), lerp(this.y, p2.y, t))
    toFixed = (n: number): Vec2 => new Vec2(Number(this.x.toFixed(n)), Number(this.y.toFixed(n)))
    eq = (other: Vec2): boolean => this.x === other.x && this.y === other.y
}
export class Box {
    constructor(public pos: Vec2, public width: number, public height: number) {}
}
export function random(min: number, max: number): number {
    return min + Math.random() * (max - min)
}
export function randomInt(min: number, max: number): number {
    return Math.round(random(min, max))
}
export function rad2deg(rad: number): number {
    return (rad * 180) / Math.PI
}
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}
export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}
export function normalize(n: number, min: number, max: number) {
    while (n < min) n += max - min
    while (n >= max) n -= max - min
    return n
}
export function boxOverlap(a: Box, b: Box): boolean {
    return (
        a.pos.x < b.pos.x + b.width &&
        a.pos.x + a.width > b.pos.x &&
        a.pos.y < b.pos.y + b.height &&
        a.pos.y + a.height > b.pos.y
    )
}
