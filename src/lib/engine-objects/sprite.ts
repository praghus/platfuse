import { Animation } from '../../types'
import { normalize } from '../utils/math'
import { getPerformance } from '../utils/helpers'
import { vec2 } from '../utils/geometry'
import { Box } from '../engine-helpers/box'
import { Entity } from './entity'
import { Shape } from '../constants'

/**
 * The `Sprite` class represents an image that can be drawn on the screen.
 * It can be animated using a specified animation.
 * @see {@link Animation}
 */
export class Sprite {
    /**
     * The animation of the sprite.
     * @see {@link Animation}
     */
    animation?: Animation

    /** The current frame of the animation. */
    then = getPerformance()

    /** The start time of the frame. */
    frameStart = getPerformance()

    /** The current frame of the animation.*/
    animFrame = 0

    /**
     * Creates a new `Sprite` object.
     * @param entity - The entity that the sprite belongs to.
     */
    constructor(public entity: Entity) {}

    /**
     * Animates the sprite based on the current animation settings.
     */
    animate() {
        const { animation } = this.entity
        if (animation) {
            this.animFrame = this.animFrame || 0
            this.frameStart = getPerformance()
            if (this.animation !== animation) {
                this.animation = animation
                this.animFrame = 0
            }
            const duration = animation.strip
                ? animation.strip.duration
                : (animation.frames && animation.frames[this.animFrame][2]) || 0
            const framesCount = animation.strip
                ? animation.strip.frames
                : (animation.frames && animation.frames.length) || 0
            if (this.frameStart - this.then > duration) {
                if (this.animFrame <= framesCount && animation.loop) {
                    this.animFrame = normalize(this.animFrame + 1, 0, framesCount)
                } else if (this.animFrame < framesCount - 1 && !animation.loop) {
                    this.animFrame += 1
                }
                this.then = getPerformance()
            }
        }
    }

    /**
     * Draws the sprite.
     */
    draw() {
        if (!this.entity.onScreen()) return

        const { animation, animFrame } = this
        const { angle, color, scene, shape, flipH, flipV } = this.entity
        const { game, camera } = scene
        const scale = vec2(camera.scale)
        const image = this.entity.image && scene.game.getImage(this.entity.image)
        const boundingRect = this.entity.getRelativeBoundingRect()
        const polygon = this.entity.getRelativePolygon()

        if (image) {
            if (animation) {
                const { frames, strip, width, height } = animation
                const frame = (frames && frames[animFrame]) || [0, 0]
                const clip = strip ? vec2(strip.x + animFrame * width, strip.y) : vec2(frame[0], frame[1])
                const offset = animation?.offset ? vec2(...animation.offset).scale(camera.scale) : vec2(0, 0)
                const rect = new Box(boundingRect.pos.add(offset), vec2(width, height))
                game.draw.draw2d(image, rect, scale, angle, flipH, flipV, clip)
            } else {
                game.draw.draw2d(image, boundingRect, scale, angle, flipH, flipV)
            }
        } else if (color) {
            if (shape === Shape.Ellipse) {
                game.draw.fillEllipse(boundingRect, color, angle)
            } else if (shape === Shape.Polygon && polygon) {
                game.draw.fillPolygon(polygon, color)
            } else {
                game.draw.fillRect(boundingRect, color, angle)
            }
        }
    }
}
