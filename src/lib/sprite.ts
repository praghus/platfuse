import { Animation, Drawable, TMXFlips } from '../types'
import { getPerformance } from './utils/helpers'
import { normalize, Vec2 } from './utils/math'
import { Game } from './game'

export class Sprite implements Drawable {
    animation?: Animation
    animFrame = 0
    then = getPerformance()
    frameStart = getPerformance()

    constructor(public id: string, public width: number, public height: number, public game: Game) {}
    animate(animation = this.animation): void {
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
    draw(pos: Vec2, flips?: TMXFlips): void {
        const { id, animation, animFrame, width, height } = this
        const { ctx } = this.game
        const image = this.game.getImage(id)
        const scaleH = flips?.H ? -1 : 1 // Set horizontal scale to -1 if flip horizontal
        const scaleV = flips?.V ? -1 : 1 // Set verical scale to -1 if flip vertical
        const FX = flips?.H ? width * -1 : 0 // Set x position to -100% if flip horizontal
        const FY = flips?.V ? height * -1 : 0 // Set y position to -100% if flip vertical
        const flip = flips?.H || flips?.V
        const [x1, y1] = [(pos.x - FX) * scaleH, (pos.y - FY) * scaleV]

        ctx.save()
        flip && ctx.scale(scaleH, scaleV)
        if (animation) {
            const { frames, strip } = animation
            const frame = (frames && frames[animFrame]) || [0, 0]
            const posX = strip ? strip.x + animFrame * animation.width : frame[0]
            const posY = strip ? strip.y : frame[1]

            ctx.drawImage(
                image,
                posX,
                posY,
                animation.width,
                animation.height,
                x1,
                y1,
                animation.width,
                animation.height
            )
        } else if (image) {
            ctx.drawImage(image, 0, 0, width, height, x1, y1, width, height)
        }
        ctx.restore()
    }
}
