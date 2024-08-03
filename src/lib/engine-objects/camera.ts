import { lerp } from '../utils/math'
import { vec2 } from '../utils/geometry'
import { Vector } from '../engine-helpers/vector'
import { Entity } from './entity'
import { Scene } from './scene'

/**
 * Represents a camera object used for rendering and controlling the view of a scene.
 */
export class Camera {
    /** Camera position */
    pos = vec2()

    /** Camera shake offset */
    offset = vec2()

    /** Entity to follow */
    followEntity?: Entity

    /** Camera scale (zoom) */
    scale = 1

    /** Camera horizontal and vertical speed scale (percent). 0 - no movement, 1 - instant movement */
    speed = vec2(1)

    /** Scrolling mode (smooth or switch between views without scrolling) */
    scrolling = true

    /** Is camera shaking */
    isShaking = false

    /** Camera bounds. If true, camera will not go outside the game world. */
    bounded = true

    /** Shake intensity */
    shakeIntensity = vec2()

    /** Shake duration */
    shakeDuration = 0

    /** Shake elapsed time*/
    shakeElapsed = 0

    /**
     * Camera constructor
     * @param scene Scene object
     */
    constructor(public scene: Scene) {}

    /**
     * Set camera position
     * @param pos Position vector
     */
    setPos(pos: Vector) {
        this.followEntity = undefined
        this.pos = pos
    }

    /**
     * Set camera scale
     * @param scale
     */
    setScale(scale: number) {
        this.scale = scale
    }

    /**
     * Sets the speed of the camera.
     * @param speed - The speed value or a vector representing the speed.
     */
    setSpeed(speed: number | Vector) {
        this.speed = typeof speed === 'number' ? vec2(speed) : speed
    }

    /**
     * Sets the scrolling behavior of the camera.
     * @param scrolling - A boolean value indicating whether scrolling is enabled or disabled.
     */
    setScrolling(scrolling: boolean) {
        this.scrolling = scrolling
    }

    /**
     * Sets the entity to follow.
     * @param follow The entity to follow.
     */
    follow(follow: Entity) {
        this.followEntity = follow
    }

    /**
     * Stops the camera from following any entity.
     */
    unfollow() {
        this.followEntity = undefined
    }

    /**
     * Toggles the bounds of the camera.
     * @param bounded - A boolean value indicating whether the camera should be bounded or not.
     */
    toggleBounds(bounded: boolean) {
        this.bounded = bounded
    }

    /**
     * Shakes the camera for a specified duration with a given intensity.
     * @param duration The duration of the camera shake in seconds.
     * @param intensity The intensity of the camera shake as a Vector.
     */
    shake(duration: number, intensity: Vector) {
        this.isShaking = true
        this.shakeDuration = duration
        this.shakeIntensity = vec2(intensity.x, intensity.y)
        this.offset = vec2(0)
        this.shakeElapsed = 0
    }

    /**
     * Updates the camera position and behavior based on the current scene state.
     */
    update() {
        const { game, size, tileSize } = this.scene
        const viewSize = vec2(game.width, game.height)

        if (this.followEntity) {
            const followRect = this.followEntity.getTranslatedBoundingRect()
            if (this.scrolling) {
                // smooth scroll
                const midPos = followRect.pos
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
            this.shakeElapsed += game.delta
            if (this.shakeElapsed < this.shakeDuration) {
                this.offset = vec2(
                    Math.random() * this.shakeIntensity.x * -this.shakeIntensity.x,
                    Math.random() * this.shakeIntensity.y * -this.shakeIntensity.y
                ).scale(this.scale)
            } else {
                this.isShaking = false
                this.offset = vec2()
            }
            this.pos = this.pos.add(this.offset)
        }
    }
}
