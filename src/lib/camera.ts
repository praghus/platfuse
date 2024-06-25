import { Box, Vector, box, vec2 } from './utils/math'
import { Entity } from './entity'

export class Camera {
    pos = vec2()
    speed = vec2(1)
    offset = vec2(0)
    resolution: Vector
    bounds?: Box
    followEntity?: Entity
    delta = 1 / 60
    isShaking = false
    shakeIntensity = vec2(0)
    shakeDuration = 0
    shakeElapsed = 0

    constructor(
        public size: Vector,
        public scale = 1
    ) {
        this.resolution = vec2(Math.round(size.x / scale), Math.round(size.y / scale))
    }

    getBounds() {
        if (!this.bounds) {
            this.setBounds(0, 0, Infinity, Infinity)
        }
        return this.bounds as Box
    }

    setBounds(x: number, y: number, width: number, height: number) {
        this.bounds = box(x, y, width, height)
    }

    setScale(scale: number) {
        this.scale = scale
        this.resolution = vec2(Math.round(this.size.x / scale), Math.round(this.size.y / scale))
    }

    setFollow(follow: Entity, center = true) {
        this.followEntity = follow
        center && this.center()
    }

    unfollow() {
        this.followEntity = undefined
    }

    center() {
        // this.follow
        //     ? this.moveTo(this.follow.pos.x + this.follow.size.x / 2, this.follow.pos.y + this.follow.size.y / 2)
        //     : this.moveTo(this.resolution.x / 2, this.resolution.y / 2)
    }

    shake(duration: number, intensity: Vector) {
        this.isShaking = true
        this.shakeDuration = duration
        this.shakeIntensity = new Vector(intensity.x, intensity.y)
        this.offset = new Vector(0, 0)
        this.shakeElapsed = 0
    }

    update() {
        const { x, y } = this.resolution
        const { size } = this.getBounds()

        // shake

        if (this.followEntity) {
            const followRect = this.followEntity.getTranslatedPositionRect()
            const midPos = new Vector(
                -x / 2 + followRect.pos.x + followRect.size.x / 2,
                -y / 2 + followRect.pos.y + followRect.size.y / 2
            )
            const moveTo = new Vector((midPos.x + this.pos.x) * this.speed.x, (midPos.y + this.pos.y) * this.speed.y)
            this.pos = this.pos.subtract(
                new Vector(Math.round(moveTo.x / this.scale), Math.round(moveTo.y / this.scale))
            )
        }

        if (this.pos.x - x < -size.x) this.pos.x = -size.x + x
        if (this.pos.y - y < -size.y) this.pos.y = -size.y + y
        if (this.pos.x > 0) this.pos.x = 0
        if (this.pos.y > 0) this.pos.y = 0

        if (this.isShaking) {
            this.shakeElapsed += this.delta * 1000
            // progress = clamp(this.shakeElapsed / this.shakeDuration, 0, 1)
            if (this.shakeElapsed < this.shakeDuration) {
                this.offset = vec2(
                    Math.random() * this.shakeIntensity.x * x * 2 - this.shakeIntensity.x * x,
                    Math.random() * this.shakeIntensity.y * y * 2 - this.shakeIntensity.y * y
                ).divide(vec2(this.scale))
            } else {
                this.isShaking = false
                this.offset = vec2(0)
            }
            this.pos = this.pos.add(this.offset)
        }
    }

    /** /
    moveTo(x: number, y: number) {
        const bounds = this.getBounds()
        const px = Math.max(bounds.pos.x, Math.min(x, bounds.size.x))
        const py = Math.max(bounds.pos.y, Math.min(y, bounds.size.y))
        this.pos = new Vector(-px + this.resolution.x / 2, -py + this.resolution.y / 2)
        this.anchor = this.pos.copy()
    }

    center() {
        this.follow
            ? this.moveTo(this.follow.pos.x + this.follow.size.x / 2, this.follow.pos.y + this.follow.size.y / 2)
            : this.moveTo(this.resolution.x / 2, this.resolution.y / 2)
    }

    getBounds() {
        if (!this.bounds) {
            this.setBounds(0, 0, Infinity, Infinity)
        }
        return this.bounds as Box
    }

    setBounds(x: number, y: number, width: number, height: number) {
        this.bounds = new Box(vec2(x, y), vec2(width, height))
    }

    setScale(scale: number) {
        this.scale = scale
        this.setResolution()
    }

    setResolution(width = this.width, height = this.height, scale = this.scale) {
        if (width && height && scale) {
            this.resolution = new Vector(Math.round(width / scale), Math.round(height / scale))
        }
    }

    setSpeed(x: number, y = x) {
        this.speed = new Vector(x, y)
    }

    setOffset(x: number, y: number) {
        this.offset = new Vector(-x, -y)
    }

    setFollow(follow: Entity, center = true) {
        this.follow = follow
        center && this.center()
    }

    unfollow() {
        this.follow = undefined
    }

    shake(duration: number, intensity: Vector) {
        this.shaker.start(duration, intensity)
    }

    update() {
        if (this.follow) {
            const { speed, follow } = this
            const { x, y } = this.resolution
            const { size } = this.getBounds()
            const midPos = new Vector(
                -x / 2 + follow.pos.x + follow.force.x + follow.size.x / 2,
                -y / 2 + follow.pos.y + follow.force.y + follow.size.y / 2
            )
            const moveTo = new Vector(
                (midPos.x + this.pos.x - this.offset.x - this.shaker.offset.x) * speed.x,
                (midPos.y + this.pos.y - this.offset.y - this.shaker.offset.y) * speed.y
            )
            this.pos = this.pos.subtract(
                new Vector(Math.round(moveTo.x / this.scale), Math.round(moveTo.y / this.scale))
            )
            if (this.pos.x - x < -size.x) this.pos.x = -size.x + x
            if (this.pos.y - y < -size.y) this.pos.y = -size.y + y
            if (this.pos.x > 0) this.pos.x = 0
            if (this.pos.y > 0) this.pos.y = 0
        } else {
            this.pos.x = this.anchor.x - Math.round(this.offset.x - this.shaker.offset.x)
            this.pos.y = this.anchor.y - Math.round(this.offset.y - this.shaker.offset.y)
        }
        this.shaker.update()
    }

    /**/
}
