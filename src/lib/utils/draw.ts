import { TMXFlips } from '../../types'
import { Box, Vector, box, vec2 } from '../utils/math'
import { Game } from '../game'
import { Tile } from '../tile'
import { Sprite } from '../sprite'

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
        const { ctx } = this.game
        const { image, columns, firstgid, tilewidth, tileheight } = tile.tileset
        const tileGid = tile.getNextGid()
        const posX = ((tileGid - firstgid) % columns) * tilewidth
        const posY = (Math.ceil((tileGid - firstgid + 1) / columns) - 1) * tileheight
        const scaleH = flips?.H ? -1 : 1 // Set horizontal scale to -1 if flip horizontal
        const scaleV = flips?.V ? -1 : 1 // Set verical scale to -1 if flip vertical
        const FX = flips?.H ? tilewidth * -1 : 0 // Set x position to -100% if flip horizontal
        const FY = flips?.V ? tileheight * -1 : 0 // Set y position to -100% if flip vertical
        const flip = flips?.H || flips?.V
        const [x1, y1] = [(pos.x - FX) * scaleH, (pos.y - FY) * scaleV]

        ctx.save()
        flip && ctx.scale(scaleH, scaleV)
        ctx.translate(0.5, 0.5)
        ctx.drawImage(
            this.game.getImage(image.source),
            posX,
            posY,
            tilewidth,
            tileheight,
            x1 - 0.5,
            y1 - 0.5,
            tilewidth,
            tileheight
        )
        ctx.restore()
    }

    sprite(sprite: Sprite, pos: Vector, flips?: TMXFlips) {
        const { ctx } = this.game
        const { id, animation, animFrame } = sprite
        const image = this.game.getImage(id)

        if (animation) {
            const { frames, strip } = animation
            const frame = (frames && frames[animFrame]) || [0, 0]
            const posX = strip ? strip.x + animFrame * animation.width : frame[0]
            const posY = strip ? strip.y : frame[1]
            const offset = animation?.offset ? vec2(...animation.offset) : vec2(0, 0)
            const scaleH = flips?.H ? -1 : 1 // Set horizontal scale to -1 if flip horizontal
            const scaleV = flips?.V ? -1 : 1 // Set verical scale to -1 if flip vertical
            const FX = flips?.H ? -animation.width + offset.x : offset.x // Set x position to -100% if flip horizontal
            const FY = flips?.V ? -animation.height + offset.y : offset.y // Set y position to -100% if flip vertical
            const flip = flips?.H || flips?.V
            const [x1, y1] = [(pos.x - FX) * scaleH, (pos.y - FY) * scaleV]

            ctx.save()
            flip && ctx.scale(scaleH, scaleV)
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
            ctx.restore()
        } else if (image) {
            ctx.drawImage(image, pos.x, pos.y)
        }
    }
}
