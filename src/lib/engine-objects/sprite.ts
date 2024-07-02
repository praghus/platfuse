import { Animation, Drawable } from '../../types'
import { normalize, getPerformance } from '../utils/helpers'
import { Vector, vec2 } from '../engine-helpers/vector'
import { Scene } from './scene'
import { Box } from '../engine-helpers'

export class Sprite implements Drawable {
    animation?: Animation
    animFrame = 0
    then = getPerformance()
    frameStart = getPerformance()

    constructor(
        public scene: Scene,
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

    draw(pos: Vector, flipH = false, flipV = false, angle = 0) {
        const { image, animation, animFrame, size } = this
        const { game, camera } = this.scene
        if (animation) {
            const { frames, strip, width, height } = animation
            const frame = (frames && frames[animFrame]) || [0, 0]
            const clip = strip ? vec2(strip.x + animFrame * width, strip.y) : vec2(frame[0], frame[1])
            const offset = animation?.offset ? vec2(...animation.offset).scale(camera.scale) : vec2(0, 0)
            game.draw.draw2d(
                image,
                new Box(pos.add(offset).add(camera.pos), vec2(width, height)),
                camera.scale,
                angle,
                flipH,
                flipV,
                clip
            )
        } else if (image) {
            game.draw.draw2d(
                image,
                new Box(pos.add(camera.pos), size.scale(camera.scale)),
                camera.scale,
                angle,
                flipH,
                flipV
            )
        }
    }
}
