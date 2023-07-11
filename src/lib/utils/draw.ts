import { Box, Vector } from '../utils/math'

export class Draw {
    constructor(public ctx: CanvasRenderingContext2D) {}

    preloader(p: number, resolution: Vector, s: number, colors: Record<string, string>) {
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

    outline(rect: Box, color: string, lineWidth = 1) {
        const { ctx } = this
        const { pos, w, h } = rect
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        ctx.lineTo(pos.x + w, pos.y)
        ctx.lineTo(pos.x + w, pos.y + h)
        ctx.lineTo(pos.x, pos.y + h)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        ctx.restore()
    }

    stroke(x: number, y: number, points: Vector[], color: string) {
        const { ctx } = this
        ctx.save()
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(points[0].x + x, points[0].y + y)
        points.map((v: Vector) => ctx.lineTo(x + v.x, y + v.y))
        ctx.lineTo(points[0].x + x, points[0].y + y)
        ctx.stroke()
        ctx.restore()
    }

    fillText(text: string, x: number, y: number, color: string, size = 4) {
        const { ctx } = this
        ctx.font = `${size}px Courier`
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
    }
}
