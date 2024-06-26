import { TMXFlips } from '../types'
import { Box, Vector, box, vec2 } from './utils/math'
import { Game } from './game'
import { Tile } from './tile'
import { Sprite } from './sprite'

export class Draw {
    constructor(public game: Game) {}

    preloader(p: number, size = vec2(this.game.canvas.width / 2, 16)) {
        const { canvas, backgroundColor, preloaderColor } = this.game
        const { width, height } = canvas
        this.fillRect(box(0, 0, width, height), backgroundColor)
        this.outline(box(size.x / 2, height / 2, size.x, size.y), preloaderColor, 1)
        this.fillRect(box(4 + size.x / 2, 4 + height / 2, -8 + size.x * p, size.y - 8), preloaderColor)
    }

    outline(rect: Box, color: string, lineWidth = 1) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.rect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x), Math.round(size.y))
        ctx.stroke()
    }

    fillRect(rect: Box, color: string) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.fillStyle = color
        ctx.fillRect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x), Math.round(size.y))
    }

    stroke(x: number, y: number, points: Vector[], color: string) {
        const { ctx } = this.game
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(points[0].x + x, points[0].y + y)
        points.map((v: Vector) => ctx.lineTo(x + v.x, y + v.y))
        ctx.lineTo(points[0].x + x, points[0].y + y)
        ctx.stroke()
    }

    fillText(text: string, x: number, y: number, color: string, size = 0.4) {
        const { ctx } = this.game
        ctx.font = `${size}em monospace`
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        ctx.fillStyle = color
        ctx.fillText(text, x, y)
    }

    createPixelFontRenderer(image: HTMLImageElement, fontSize: number, rows: number) {
        return (text: string, x: number, y: number) => {
            text.split('\n')
                .reverse()
                .map((output, index) => {
                    for (let i = 0; i < output.length; i++) {
                        const chr = output.charCodeAt(i)
                        this.game.ctx.drawImage(
                            image,
                            (chr % rows) * fontSize,
                            Math.ceil((chr + 1) / rows - 1) * fontSize,
                            fontSize,
                            fontSize,
                            Math.floor(x + i * fontSize),
                            Math.floor(y - index * (fontSize + 1)),
                            fontSize,
                            fontSize
                        )
                    }
                })
        }
    }

    tile(tile: Tile, pos: Vector, flips?: TMXFlips) {
        const { image, columns, firstgid, tilewidth, tileheight } = tile.tileset
        const tileGid = tile.getNextGid()
        const clip = vec2(
            ((tileGid - firstgid) % columns) * tilewidth,
            (Math.ceil((tileGid - firstgid + 1) / columns) - 1) * tileheight
        )

        this.draw2d(this.game.getImage(image.source), new Box(pos, vec2(tilewidth, tileheight)), clip, flips)
    }

    sprite(sprite: Sprite, pos: Vector, flips?: TMXFlips) {
        const { image, animation, animFrame, size } = sprite
        if (animation) {
            const { frames, strip, width, height } = animation
            const frame = (frames && frames[animFrame]) || [0, 0]
            const clip = strip ? vec2(strip.x + animFrame * width, strip.y) : vec2(frame[0], frame[1])
            const offset = animation?.offset ? vec2(...animation.offset) : vec2(0, 0)

            this.draw2d(image, new Box(pos.subtract(offset), vec2(width, height)), clip, flips)
        } else if (image) {
            this.draw2d(image, new Box(pos, size))
        }
    }

    draw2d(image: HTMLImageElement, rect: Box, clip?: Vector, flips?: TMXFlips) {
        const { ctx } = this.game
        const { pos, size } = rect

        const flip = flips?.H || flips?.V
        const scale = vec2(flips?.H ? -1 : 1, flips?.V ? -1 : 1)
        const f = vec2(flips?.H ? size.x * -1 : 0, flips?.V ? size.y * -1 : 0)
        const fpos = pos.subtract(f).multiply(scale)

        ctx.save()
        flip && ctx.scale(scale.x, scale.y)
        ctx.translate(0.5, 0.5)
        clip
            ? ctx.drawImage(image, clip.x, clip.y, size.x, size.y, fpos.x - 0.5, fpos.y - 0.5, size.x, size.y)
            : ctx.drawImage(image, pos.x - 0.5, pos.y - 0.5, size.x, size.y)
        ctx.restore()
    }
}