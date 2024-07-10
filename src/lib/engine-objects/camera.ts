import { Entity } from './entity'
import { Vector, vec2 } from '../engine-helpers'
import { Scene } from './scene'
import { lerp } from '../utils/helpers'

export class Camera {
    pos = vec2() //             camera position
    offset = vec2() //          camera shake offset
    followEntity?: Entity //    entity to follow
    scale = 1 //                camera scale (zoom)
    speed = vec2(1) //          camera horizontal and vertical speed scale (percent) 0 - no movement, 1 - instant
    delta = 1 / 60 //           delta time
    scrolling = true //         scrolling mode (smooth or switch between views without scrolling)
    isShaking = false //        is camera shaking
    bounded = true //           if false allow camera to move outside of bounds
    shakeIntensity = vec2() //  shake intensity
    shakeDuration = 0 //        shake duration
    shakeElapsed = 0 //         shake elapsed time

    constructor(public scene: Scene) {}

    setPos(pos: Vector) {
        this.followEntity = undefined
        this.pos = pos
    }

    setScale(scale: number) {
        this.scale = scale
    }

    setSpeed(speed: number | Vector) {
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
        const { game, size, tileSize } = this.scene
        const viewSize = vec2(game.width, game.height)

        if (this.followEntity) {
            const followRect = this.followEntity.getTranslatedBoundingRect()
            if (this.scrolling) {
                // smooth scroll
                const midPos = followRect.pos
                    .clone()
                    .invert()
                    .add(viewSize.divide(vec2(2)))
                    .subtract(followRect.size.divide(vec2(2)))
                this.pos.x = Math.ceil(lerp(this.speed.x, this.pos.x, midPos.x))
                this.pos.y = Math.ceil(lerp(this.speed.y, this.pos.y, midPos.y))
            } else {
                // no scrolling - switching between views
                const room = followRect.pos.divide(viewSize).floor()
                this.pos = vec2(-room.x * viewSize.x, -room.y * viewSize.y)
            }
        }

        // check bounds
        if (this.bounded) {
            const max = size.multiply(tileSize).scale(this.scale).subtract(viewSize)
            if (this.pos.x < -max.x + this.scale) this.pos.x = -max.x + this.scale
            if (this.pos.y < -max.y + this.scale) this.pos.y = -max.y + this.scale
            if (this.pos.x > 0) this.pos.x = 0
            if (this.pos.y > 0) this.pos.y = 0
        }

        // shake
        if (this.isShaking) {
            this.shakeElapsed += this.delta * 1000
            // progress = clamp(this.shakeElapsed / this.shakeDuration, 0, 1)
            if (this.shakeElapsed < this.shakeDuration) {
                this.offset = vec2(
                    Math.random() * this.shakeIntensity.x * viewSize.x * 2 - this.shakeIntensity.x * viewSize.x,
                    Math.random() * this.shakeIntensity.y * viewSize.y * 2 - this.shakeIntensity.y * viewSize.y
                ).scale(this.scale)
            } else {
                this.isShaking = false
                this.offset = vec2()
            }
            this.pos = this.pos.add(this.offset)
        }
    }
}
