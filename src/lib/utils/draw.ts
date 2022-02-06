import { StringTMap } from '../../types'
import { Box, Vec2 } from '../utils/math'

export class Draw {
    constructor(public ctx: CanvasRenderingContext2D) {}
    preloader(p: number, resolution: Vec2, s: number, colors: StringTMap<string>): void {
        const { ctx } = this
        const padding = 0.15
        const sx = Math.round(resolution.x * s) * padding
        const sw = Math.round(resolution.x * s - sx * 2)
        const sy = Math.round((resolution.y / 2) * s)

        ctx.fillStyle = colors.backgroundColor
        ctx.fillRect(0, 0, resolution.x * s, resolution.y * s)
        ctx.fillStyle = colors.preloaderColor
        ctx.fillRect(sx, sy - 5 * s, sw, 10 * s)
        ctx.fillStyle = colors.backgroundColor
        ctx.fillRect(sx + 1 * s, sy - 4 * s, sw - 2 * s, 8 * s)
        ctx.fillStyle = colors.preloaderColor
        ctx.fillRect(sx + 2 * s, sy - 3 * s, (sw - 4 * s) * p, 6 * s)
    }
    outline(rect: Box, color: string, lineWidth = 1): void {
        const { ctx } = this
        const {
            pos: { x, y },
            width,
            height
        } = rect
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + width, y)
        ctx.lineTo(x + width, y + height)
        ctx.lineTo(x, y + height)
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.restore()
    }
    stroke(x: number, y: number, points: Vec2[], color: string): void {
        const { ctx } = this
        ctx.save()
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(points[0].x + x, points[0].y + y)
        points.map((v: Vec2) => ctx.lineTo(x + v.x, y + v.y))
        ctx.lineTo(points[0].x + x, points[0].y + y)
        ctx.stroke()
        ctx.restore()
    }
    fillText(text: string, x: number, y: number, color: string): void {
        const { ctx } = this
        ctx.font = '4px Courier'
        ctx.fillStyle = color
        ctx.fillText(text, x, y)
    }
    createPixelFontRenderer =
        (image: HTMLImageElement, fontSize: number, rows: number): any =>
        (text: string, x: number, y: number) =>
            text
                .split('\n')
                .reverse()
                .map((output, index) => {
                    for (let i = 0; i < output.length; i++) {
                        const chr = output.charCodeAt(i)
                        this.ctx.drawImage(
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
