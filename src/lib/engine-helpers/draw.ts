/* eslint-disable max-params */
import { Game } from '../engine-objects/game'
import { Vector, vec2 } from './vector'
import { Box, box } from './box'
import { Color } from './color'
import { DefaultColors } from '../constants'

/**
 * The `Draw` class provides methods for drawing shapes, text, and images on a canvas.
 */
export class Draw {
    /**
     * Creates a new `Draw` object.
     * @param game - The game instance.
     */
    constructor(public game: Game) {}

    /**
     * Fills a rectangle on the canvas with the specified color.
     * @param rect - The rectangle to be filled.
     * @param color - The color to fill the rectangle with.
     * @param angle - The angle (in radians) to rotate the rectangle (default: 0).
     */
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

    /**
     * Draws a stroke using the provided points.
     * @param x - The x-coordinate of the starting point.
     * @param y - The y-coordinate of the starting point.
     * @param points - An array of Vector objects representing the points to be connected.
     * @param lineWidth - The width of the stroke line (default: 1).
     */
    stroke(x: number, y: number, points: Vector[], lineWidth = 1) {
        const { ctx } = this.game
        ctx.lineWidth = lineWidth
        ctx.lineJoin = 'miter'
        ctx.beginPath()
        ctx.moveTo(points[0].x + x, points[0].y + y)
        points.map((v: Vector) => ctx.lineTo(x + v.x, y + v.y))
        ctx.lineTo(points[0].x + x, points[0].y + y)
        ctx.stroke()
    }

    /**
     * Draws an outlined rectangle on the canvas.
     * @param rect - The rectangle to outline.
     * @param color - The color of the outline.
     * @param lineWidth - The width of the outline line. Default is 1.
     * @param angle - The angle of rotation for the rectangle. Default is 0.
     */
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

    /**
     * Renders text on the canvas.
     * @param text - The text to render.
     * @param x - The x-coordinate of the starting position.
     * @param y - The y-coordinate of the starting position.
     * @param color - The color of the text. Defaults to white.
     * @param size - The font size of the text. Defaults to '1em'.
     * @param textAlign - The horizontal alignment of the text. Defaults to 'left'.
     * @param textBaseline - The vertical alignment of the text. Defaults to 'top'.
     * @param stroke - Whether to stroke the text. Defaults to false.
     */
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

    /**
     * Draws a 2D image on the canvas.
     * @param image - The HTMLImageElement representing the image to be drawn.
     * @param rect - The bounding box of the image.
     * @param scale - The scale factor to apply to the image (default: 1).
     * @param angle - The rotation angle of the image in radians (default: 0).
     * @param flipH - Whether to flip the image horizontally (default: false).
     * @param flipV - Whether to flip the image vertically (default: false).
     * @param clip - The clipping region of the image (optional).
     * @param context - The CanvasRenderingContext2D to use for drawing (optional).
     */
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

    /**
     * Rotates the canvas context around a specified position and angle, and then executes a callback function.
     * @param box - The box object containing the position and size.
     * @param angle - The angle of rotation in radians. Defaults to 0.
     * @param scale - The scale factor. Defaults to 0.
     * @param cb - The callback function to be executed after the rotation.
     */
    rotate({ pos, size }: Box, angle = 0, scale = 0, cb: () => void) {
        if (angle) {
            const ctx = this.game.ctx
            ctx.translate(pos.x + (size.x * scale) / 2, pos.y + (size.y * scale) / 2)
            ctx.rotate(angle)
            ctx.translate(-(pos.x + (size.x * scale) / 2), -(pos.y + (size.y * scale) / 2))
        }
        cb()
    }

    /**
     * Copies the content of a canvas to the main context of the game.
     * @param canvas - The canvas element to copy from.
     * @param pos - The position to place the copied content on the main context.
     * @param size - The size of the copied content on the main context.
     */
    copyToMainContext(canvas: HTMLCanvasElement, pos: Vector, size: Vector) {
        const { ctx } = this.game
        ctx.drawImage(canvas, pos.x, pos.y, size.x, size.y)
    }

    /**
     * Displays a preloader with a progress bar on the canvas.
     * @param p - The progress value between 0 and 1.
     */
    preloader(p: number) {
        const { ctx, canvas, backgroundColor, secondaryColor } = this.game
        const { width, height } = canvas
        const logoSize = vec2(height / 4).floor()
        const logoPos = vec2(width / 2 - logoSize.x / 2, height / 2 - logoSize.y / 2).floor()
        const step = logoSize.x / 8
        const gradient = ctx.createRadialGradient(width / 2, height / 2, logoSize.y, width / 2, height / 2, height)

        ctx.save()

        gradient.addColorStop(0, backgroundColor.brightness(15).toString())
        gradient.addColorStop(0.7, backgroundColor.toString())

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 6
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 3

        this.fillRect(box(logoPos.x, logoPos.y, logoSize.x, logoSize.y), DefaultColors.LightBlue)
        this.fillRect(
            box(logoPos.x + step * 0.8, logoPos.y + step * 0.8, logoSize.x - step * 1.6, logoSize.y - step * 1.6),
            DefaultColors.DarkBlue
        )
        ctx.fillStyle = DefaultColors.White.toString()
        this.stroke(
            logoPos.x + step * 2,
            logoPos.y + step * 7,
            [
                vec2(0, step * 0.2),
                vec2(0, -step * 5),
                vec2(step * 4, -step * 5),
                vec2(step * 4, -step),
                vec2(step * 1.25, -step),
                vec2(step * 1.25, step * 0.2)
            ],
            0
        )
        ctx.fill()
        this.fillRect(
            box(
                (-step * 1.5) / 2 + logoPos.x + logoSize.x / 2,
                (-step * 1.5) / 2 + logoPos.y + logoSize.y / 2,
                step * 1.5,
                step * 1.5
            ),
            DefaultColors.LightBlue
        )
        this.text(
            p < 1 ? 'Loading assets...' : 'Ready!',
            width / 2,
            height - height * 0.05,
            DefaultColors.White,
            '1em',
            'center',
            'bottom'
        )
        // Progress bar
        // this.fillRect(box(0, height - height * 0.015, width, height * 0.015), backgroundColor)
        this.fillRect(box(0, height - height * 0.015, width * p, height * 0.015), secondaryColor)
        ctx.restore()
    }
}
