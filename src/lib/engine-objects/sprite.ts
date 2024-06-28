import { Animation, Drawable } from '../../types'
import { normalize, getPerformance } from '../utils/helpers'
import { Game } from './game'
import { Vector, vec2 } from '../engine-helpers/vector'

export class Sprite implements Drawable {
    animation?: Animation
    animFrame = 0
    then = getPerformance()
    frameStart = getPerformance()

    constructor(
        public game: Game,
        public image: HTMLImageElement,
        public size = vec2(image.width, image.height)
    ) {}

    setSize(size: Vector) {
        this.size = size
    }

    /**
     * Animates the sprite using the specified animation.
     * @param animation - The animation to be played.
     */
    animate(animation = this.animation) {
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
     * Draws the sprite at the specified position.
     *
     * @param pos - The position where the sprite should be drawn.
     * @param flipH - (Optional) Whether to flip the sprite horizontally. Default is `false`.
     * @param flipV - (Optional) Whether to flip the sprite vertically. Default is `false`.
     */
    draw(pos: Vector, flipH = false, flipV = false) {
        this.game.draw.sprite(this, pos, flipH, flipV)
    }
}
