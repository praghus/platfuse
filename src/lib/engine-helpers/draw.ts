import { Game } from '../engine-objects/game'
import { Vector, vec2 } from './vector'
import { Box, box } from './box'
import { Color } from './color'
import { DefaultColors } from '../constants'

export class Draw {
    constructor(public game: Game) {}

    preloader(p: number) {
        const { ctx, canvas, backgroundColor, primaryColor, secondaryColor } = this.game
        const { width, height } = canvas
        const logoSize = vec2(height * 0.2)
        const logoPos = vec2(width / 2 - logoSize.x, height / 2 - logoSize.y / 2)
        const textPos = vec2(width / 2, height / 2 + logoSize.x / 4.5)
        const fontSize = `${logoSize.x / 2.5}px`
        const gradient = ctx.createRadialGradient(width / 2, height / 2, logoSize.y, width / 2, height / 2, height)
        ctx.save()
        gradient.addColorStop(0, backgroundColor.brightness(15).toString())
        gradient.addColorStop(0.7, backgroundColor.toString())
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        this.fillRectRound(
            box(logoPos.x + 3, logoPos.y + 3, logoSize.x, logoSize.y),
            [logoSize.x / 10],
            backgroundColor
        )
        this.fillRectRound(box(logoPos.x, logoPos.y, logoSize.x, logoSize.y), [logoSize.x / 12], secondaryColor)
        this.text('plat', textPos.x, textPos.y, backgroundColor.brightness(-10), fontSize, 'right', 'middle', false)
        this.text('fuse', textPos.x + 3, textPos.y + 3, backgroundColor, fontSize, 'left', 'middle', false)
        this.text('fuse', textPos.x, textPos.y, primaryColor, fontSize, 'left', 'middle', false)
        this.fillRect(box(0, height - height * 0.015, width * p, height * 0.015), secondaryColor)
        ctx.restore()
    }

    outline(rect: Box, color: Color, lineWidth = 1, angle = 0) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.save()
        this.rotate(rect, angle, 1, () => {
            ctx.strokeStyle = color.toString()
            ctx.lineWidth = lineWidth
            ctx.beginPath()
            ctx.rect(pos.x, pos.y, size.x, size.y)
            ctx.stroke()
        })
        ctx.restore()
    }

    fillRect(rect: Box, color: Color, angle = 0) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.save()
        this.rotate(rect, angle, 1, () => {
            ctx.fillStyle = color.toString()
            ctx.fillRect(pos.x, pos.y, size.x, size.y)
        })
        ctx.restore()
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
        textBaseline: CanvasTextBaseline = 'top',
        stroke = false
    ) {
        const { ctx } = this.game

        ctx.font = `${size} monospace`
        ctx.textBaseline = textBaseline
        ctx.textAlign = textAlign
        if (stroke) {
            ctx.strokeStyle = DefaultColors.Black.setAlpha(0.9).toString()
            ctx.lineJoin = 'round'
            ctx.lineWidth = 4
            ctx.strokeText(text, x, y)
        }
        ctx.fillStyle = (color || DefaultColors.White).toString()
        ctx.fillText(text, x, y)
    }

    // eslint-disable-next-line max-params
    draw2d(
        image: HTMLImageElement,
        rect: Box,
        scale = 1,
        angle = 0,
        flipH = false,
        flipV = false,
        clip?: Vector,
        context?: CanvasRenderingContext2D
    ) {
        const ctx = context || this.game.ctx
        const { pos, size } = rect
        const flip = flipH || flipV
        const s = vec2(flipH ? -1 : 1, flipV ? -1 : 1)
        const f = vec2(flipH ? -size.x * scale : 0, flipV ? -size.y * scale : 0)
        const fpos = pos.subtract(f).multiply(s)

        ctx.save()
        this.rotate(rect, angle, clip ? scale : 1, () => {
            flip && ctx.scale(s.x, s.y)
            ctx.translate(0.5, 0.5)
            clip
                ? ctx.drawImage(
                      image,
                      clip.x,
                      clip.y,
                      size.x,
                      size.y,
                      fpos.x - 0.5,
                      fpos.y - 0.5,
                      size.x * scale,
                      size.y * scale
                  )
                : ctx.drawImage(image, pos.x - 0.5, pos.y - 0.5, size.x, size.y)
            ctx.translate(-0.5, -0.5)
        })
        ctx.restore()
    }

    rotate({ pos, size }: Box, angle = 0, scale = 0, cb: () => void) {
        if (angle) {
            const ctx = this.game.ctx
            ctx.translate(pos.x + (size.x * scale) / 2, pos.y + (size.y * scale) / 2)
            ctx.rotate(angle)
            ctx.translate(-(pos.x + (size.x * scale) / 2), -(pos.y + (size.y * scale) / 2))
        }
        cb()
    }

    copyToMainContext(canvas: HTMLCanvasElement, pos: Vector, size: Vector) {
        const { ctx } = this.game
        ctx.drawImage(canvas, pos.x, pos.y, size.x, size.y)
    }
}
