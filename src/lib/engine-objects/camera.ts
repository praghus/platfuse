import { Entity } from './entity'
import { Vector, vec2 } from '../engine-helpers'

export class Camera {
    pos = vec2() //             camera position
    speed = vec2(1) //          camera speed
    offset = vec2() //          camera shake offset
    followEntity?: Entity //    entity to follow
    delta = 1 / 60 //           delta time
    scrolling = true //         is camera scrolling or switching between views
    isShaking = false //        is camera shaking
    bounded = true //           if false allow camera to move outside of bounds
    shakeIntensity = vec2() //  shake intensity
    shakeDuration = 0 //        shake duration
    shakeElapsed = 0 //         shake elapsed time

    constructor(
        public size: Vector,
        public scale = 1
    ) {}

    setScale(scale: number) {
        this.scale = scale
    }

    setSpeed(speed: Vector) {
        this.speed = speed
    }

    setScrolling(scrolling: boolean) {
        this.scrolling = scrolling
    }

    follow(follow: Entity) {
        this.followEntity = follow
    }

    unfollow() {
        this.followEntity = undefined
    }

    toggleBounds(bounded: boolean) {
        this.bounded = bounded
    }

    shake(duration: number, intensity: Vector) {
        this.isShaking = true
        this.shakeDuration = duration
        this.shakeIntensity = vec2(intensity.x, intensity.y)
        this.offset = vec2(0, 0)
        this.shakeElapsed = 0
    }

    getVisibleRect() {
        return {
            pos: this.pos,
            size: this.size
        }
    }

    update() {
        const { x, y } = this.size
        if (this.followEntity) {
            const followRect = this.followEntity.getTranslatedBoundingRect()
            // smooth scroll
            if (this.scrolling) {
                const midPos = vec2(
                    -x / 2 + followRect.pos.x + followRect.size.x / 2,
                    -y / 2 + followRect.pos.y + followRect.size.y / 2
                )
                const moveTo = vec2((midPos.x + this.pos.x) * this.speed.x, (midPos.y + this.pos.y) * this.speed.y)
                this.pos = this.pos.subtract(vec2(moveTo.x / this.scale, moveTo.y / this.scale)).floor()
                // no scrolling - switching between views
            } else {
                const room = followRect.pos.divide(this.size).floor()
                this.pos = vec2(-room.x * x, -room.y * y)
            }
        }

        // if (this.pos.x - x < -size.x) this.pos.x = -size.x + x
        // if (this.pos.y - y < -size.y) this.pos.y = -size.y + y
        if (this.bounded && this.pos.x > 0) this.pos.x = 0
        if (this.bounded && this.pos.y > 0) this.pos.y = 0

        // shake
        if (this.isShaking) {
            this.shakeElapsed += this.delta * 1000
            // progress = clamp(this.shakeElapsed / this.shakeDuration, 0, 1)
            if (this.shakeElapsed < this.shakeDuration) {
                this.offset = vec2(
                    Math.random() * this.shakeIntensity.x * x * 2 - this.shakeIntensity.x * x,
                    Math.random() * this.shakeIntensity.y * y * 2 - this.shakeIntensity.y * y
                ).divide(this.scale)
            } else {
                this.isShaking = false
                this.offset = vec2()
            }
            this.pos = this.pos.add(this.offset)
        }
    }
}
