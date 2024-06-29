import { Game } from '../engine-objects/game'
import { Sprite } from '../engine-objects/sprite'
import { Tile } from '../engine-objects/tile'
import { glDraw } from '../utils/webgl'
import { Vector, vec2 } from './vector'
import { Box, box } from './box'
import { Color } from './color'

export class Draw {
    constructor(public game: Game) {}

    preloader(p: number) {
        const { canvas, backgroundColor, primaryColor, secondaryColor } = this.game
        const { width, height } = canvas
        const logoSize = vec2(height * 0.2)
        const logoPos = vec2(width / 2 - logoSize.x, height / 2 - logoSize.y / 2)
        const textPos = vec2(width / 2, height / 2 + logoSize.x / 4.5)
        const fontSize = `${logoSize.x / 2.5}px`
        this.fillRect(box(0, 0, width, height), backgroundColor)
        this.fillRectRound(box(logoPos.x, logoPos.y, logoSize.x, logoSize.y), [logoSize.x / 12], secondaryColor)
        this.text('plat', textPos.x, textPos.y, backgroundColor, fontSize, 'right', 'middle')
        this.text('fuse', textPos.x, textPos.y, primaryColor, fontSize, 'left', 'middle')
        this.fillRect(box(0, height - height * 0.02, width * p, height * 0.02), secondaryColor)
    }

    outline(rect: Box, color: Color, lineWidth = 1) {
        const { ctx, useWebGL } = this.game
        const { pos, size } = rect
        if (useWebGL) {
            glDraw(pos.x + size.x / 2, -(pos.y + size.y / 2), size.x, size.y, 0, 0, 0, 0, 0, 0, color.rgbaInt())
        } else {
            ctx.strokeStyle = color.toString()
            ctx.lineWidth = lineWidth
            ctx.beginPath()
            ctx.rect(pos.x, pos.y, size.x, size.y)
            ctx.stroke()
        }
    }

    fillRect(rect: Box, color: Color) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.fillStyle = color.toString()
        ctx.fillRect(pos.x, pos.y, size.x, size.y)
    }

    fillRectRound(rect: Box, radius: number[], color: Color) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.fillStyle = color.toString()
        ctx.beginPath()
        ctx.roundRect(pos.x, pos.y, size.x, size.y, radius)
        ctx.fill()
    }

    roundRect(rect: Box, radius: number[], color: Color, lineWidth = 1) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.strokeStyle = color.toString()
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.roundRect(pos.x, pos.y, size.x, size.y, radius)
        ctx.stroke()
    }

    stroke(x: number, y: number, points: Vector[], color: Color) {
        const { ctx } = this.game
        ctx.strokeStyle = color.toString()
        ctx.beginPath()
        ctx.moveTo(points[0].x + x, points[0].y + y)
        points.map((v: Vector) => ctx.lineTo(x + v.x, y + v.y))
        ctx.lineTo(points[0].x + x, points[0].y + y)
        ctx.stroke()
    }

    // eslint-disable-next-line max-params
    text(
        text: string,
        x: number,
        y: number,
        color?: Color,
        size = '1em',
        textAlign: CanvasTextAlign = 'left',
        textBaseline: CanvasTextBaseline = 'top'
    ) {
        const { ctx, primaryColor, backgroundColor } = this.game
        ctx.font = `${size} monospace`
        ctx.textBaseline = textBaseline
        ctx.textAlign = textAlign
        ctx.fillStyle = (color || primaryColor).toString()
        ctx.lineWidth = 1
        ctx.strokeStyle = backgroundColor.toString()
        ctx.strokeText(text, x, y)
        ctx.fillText(text, x, y)
    }

    tile(tile: Tile, pos: Vector, flipH = false, flipV = false, context?: CanvasRenderingContext2D) {
        const { image, columns, firstgid, tilewidth, tileheight } = tile.tileset
        const tileGid = tile.getNextGid()
        const clip = vec2(
            ((tileGid - firstgid) % columns) * tilewidth,
            (Math.ceil((tileGid - firstgid + 1) / columns) - 1) * tileheight
        )
        this.draw2d(
            this.game.getImage(image.source),
            new Box(pos, vec2(tilewidth, tileheight)),
            flipH,
            flipV,
            clip,
            context
        )
    }

    sprite(sprite: Sprite, pos: Vector, flipH = false, flipV = false) {
        const { image, animation, animFrame, size } = sprite
        if (animation) {
            const { frames, strip, width, height } = animation
            const frame = (frames && frames[animFrame]) || [0, 0]
            const clip = strip ? vec2(strip.x + animFrame * width, strip.y) : vec2(frame[0], frame[1])
            const offset = animation?.offset ? vec2(...animation.offset) : vec2(0, 0)
            this.draw2d(image, new Box(pos.subtract(offset), vec2(width, height)), flipH, flipV, clip)
        } else if (image) {
            this.draw2d(image, new Box(pos, size))
        }
    }

    // eslint-disable-next-line max-params
    draw2d(
        image: HTMLImageElement,
        rect: Box,
        flipH = false,
        flipV = false,
        clip?: Vector,
        context?: CanvasRenderingContext2D
    ) {
        const ctx = context || this.game.ctx
        const { pos, size } = rect

        const flip = flipH || flipV
        const scale = vec2(flipH ? -1 : 1, flipV ? -1 : 1)
        const f = vec2(flipH ? size.x * -1 : 0, flipV ? size.y * -1 : 0)
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
