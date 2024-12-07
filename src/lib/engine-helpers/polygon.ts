import { vec2 } from '../utils/geometry'
import { Vector } from './vector'

/**
 * Represents a polygon with a position and points.
 */
export class Polygon {
    size = vec2()
    edges: Vector[] = []
    normals: Vector[] = []
    angle = 0

    /**
     * Creates a new instance of the Polygon class.
     * @param pos - The position of the polygon.
     * @param points - The points of the polygon.
     */
    constructor(
        public pos = vec2(),
        public points: Vector[] = []
    ) {
        this.recalculate()
    }

    recalculate() {
        const xPoints = this.points.map(p => p.x)
        const yPoints = this.points.map(p => p.y)
        const min = vec2(Math.min(...xPoints), Math.min(...yPoints))
        const max = vec2(Math.max(...xPoints), Math.max(...yPoints))
        this.edges = []
        this.size = max.subtract(min)
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i]
            const p2 = this.points[(i + 1) % this.points.length]
            this.edges.push(p2.subtract(p1))
        }
        this.normals = this.edges.map(edge => edge.perpendicular().normalize())
        return this
    }

    setPos(pos: Vector) {
        this.pos = pos
        return this
    }

    scale(s: number) {
        this.pos = this.pos.scale(s)
        this.points = this.points.map(p => p.scale(s))
        this.recalculate()
        return this
    }

    divide(d: Vector | number) {
        if (typeof d === 'number') d = new Vector(d)
        this.pos = this.pos.divide(d)
        this.points = this.points.map(p => p.divide(d))
        this.recalculate()
        return this
    }

    multiply(m: Vector) {
        this.pos = this.pos.multiply(m)
        this.points = this.points.map(p => p.multiply(m))
        this.recalculate()
        return this
    }

    rotate(angle: number) {
        this.angle = angle
        this.points = this.points.map(p => p.rotate(angle))
        this.recalculate()
        return this
    }

    move(v: Vector) {
        this.pos = this.pos.add(v)
        return this
    }

    overlaps(projection1: [number, number], projection2: [number, number]): boolean {
        return projection1[0] <= projection2[1] && projection1[1] >= projection2[0]
    }

    project(axis: Vector): [number, number] {
        const translatedPoints = this.points.map(p => p.add(this.pos))
        let min = translatedPoints[0].dot(axis)
        let max = min
        for (const point of translatedPoints) {
            const projection = point.dot(axis)
            if (projection < min) {
                min = projection
            } else if (projection > max) {
                max = projection
            }
        }
        return [min, max]
    }

    checkCollision(other: Polygon): boolean {
        const axes = [...this.normals, ...other.normals]
        for (const axis of axes) {
            if (!this.overlaps(this.project(axis), other.project(axis))) {
                return false
            }
        }
        return true
    }

    checkCollisionWithPoint(point: Vector): boolean {
        const translatedPoints = this.points.map(p => p.add(this.pos))
        let collision = false
        for (let i = 0, j = translatedPoints.length - 1; i < translatedPoints.length; j = i++) {
            const pi = translatedPoints[i]
            const pj = translatedPoints[j]
            if (
                pi.y > point.y !== pj.y > point.y &&
                point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
            ) {
                collision = !collision
            }
        }
        return collision
    }
}
