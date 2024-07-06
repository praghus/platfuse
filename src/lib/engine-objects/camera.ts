import { Entity } from './entity'
import { Vector, vec2 } from '../engine-helpers'

export class Camera {
    pos = vec2() //             camera position
    speed = vec2(1) //          camera speed scale (percent) 0 - no speed, 1 - instant
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

    setSpeed(speed: Vector | number) {
        this.speed = typeof speed === 'number' ? vec2(speed) : speed
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
        this.offset = vec2(0)
        this.shakeElapsed = 0
    }

    update() {
        const { x, y } = this.size
        if (this.followEntity) {
            const followRect = this.followEntity.getTranslatedBoundingRect()
            if (this.scrolling) {
                // smooth scroll
                const midPos = followRect.pos
                    .clone()
                    .invert()
                    .add(this.size.divide(vec2(2)))
                    .subtract(followRect.size.divide(vec2(2)))

                this.pos = this.speed.x >= 1 && this.speed.y >= 1 ? midPos : this.pos.lerp(midPos, this.speed.x).floor()
            } else {
                // no scrolling - switching between views
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
