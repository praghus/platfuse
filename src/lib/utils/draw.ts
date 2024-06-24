import { Box, Vector } from '../utils/math'
const colors = {
    backgroundColor: '#000',
    preloaderColor: '#222'
}
export class Draw {
    constructor(public ctx: CanvasRenderingContext2D) {}

    preloader(x: number, y: number, p: number) {
        const { ctx } = this
        const padding = 0.15
        const sx = Math.round(x) * padding
        const sw = Math.round(x - sx * 2)
        const sy = Math.round(y / 2)

        ctx.fillStyle = colors.backgroundColor
        ctx.fillRect(0, 0, x, y)
        ctx.fillStyle = colors.preloaderColor
        ctx.fillRect(sx, sy - 5, sw, 10)
        ctx.fillStyle = colors.backgroundColor
        ctx.fillRect(sx + 1, sy - 4, sw - 2, 8)
        ctx.fillStyle = colors.preloaderColor
        ctx.fillRect(sx + 2, sy - 3, (sw - 4) * p, 6)
    }

    outline(rect: Box, color: string, lineWidth = 1) {
        const { ctx } = this
        const { pos, size } = rect
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.rect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x), Math.round(size.y))
        ctx.stroke()
        ctx.restore()
    }

    fillRect(rect: Box, color: string) {
        const { ctx } = this
        const { pos, size } = rect
        ctx.save()
        ctx.fillStyle = color
        ctx.fillRect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x), Math.round(size.y))
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

    fillText(text: string, x: number, y: number, color: string, size = 0.4) {
        const { ctx } = this
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
