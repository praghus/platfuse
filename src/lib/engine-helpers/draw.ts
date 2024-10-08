/* eslint-disable max-params */
import { Game } from '../engine-objects/game'
import { vec2 } from '../utils/geometry'
import { Vector } from './vector'
import { Box } from './box'
import { Color } from './color'
import { DefaultColors, PixelFontImage, PlatfuseLogo } from '../constants'
import { Polygon } from './polygon'

/**
 * The `Draw` class provides methods for drawing shapes, text, and images on a canvas.
 */
export class Draw {
    pixelFont = new Image()
    logo = new Image()

    pixelText: (
        text: string,
        pos: Vector,
        scale?: number,
        textAlign?: CanvasTextAlign,
        textBaseline?: CanvasTextBaseline
    ) => void = () => {}

    /**
     * Creates a new `Draw` object.
     * @param game - The game instance.
     */
    constructor(public game: Game) {
        this.logo.src = PlatfuseLogo
        this.pixelFont.src = PixelFontImage
        this.pixelFont.onload = () =>
            (this.pixelText = this.createPixelFontRenderer(this.pixelFont, 8, game.primaryColor.toString()))
    }

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
        this.rotate(rect, angle)
        ctx.fillStyle = color.toString()
        ctx.fillRect(pos.x, pos.y, size.x, size.y)
        ctx.restore()
    }

    /**
     * Draws a ellipse on the canvas with the specified color.
     * @param rect
     * @param color
     * @param angle
     */
    fillEllipse(rect: Box, color: Color, angle = 0) {
        const { ctx } = this.game
        const { pos, size } = rect
        ctx.save()
        this.rotate(rect, angle)
        ctx.beginPath()
        ctx.ellipse(pos.x + size.x / 2, pos.y + size.y / 2, size.x / 2, size.y / 2, angle, 0, Math.PI * 2)
        ctx.fillStyle = color.toString()
        ctx.fill()
        ctx.restore()
    }

    fillPolygon(polygon: Polygon, color: Color) {
        const { ctx } = this.game
        ctx.save()
        ctx.beginPath()
        this.polygon(polygon)
        ctx.fillStyle = color.toString()
        ctx.fill()
        ctx.restore()
    }

    polygon(polygon: Polygon) {
        const { ctx } = this.game
        const { pos, points } = polygon
        ctx.moveTo(points[0].x + pos.x, points[0].y + pos.y)
        points.map((v: Vector) => ctx.lineTo(pos.x + v.x, pos.y + v.y))
        ctx.lineTo(points[0].x + pos.x, points[0].y + pos.y)
    }

    /**
     * Draws an outlined element on the canvas.
     * @param element - The element to outline.
     * @param color - The color of the outline.
     * @param lineWidth - The width of the outline line. Default is 1.
     * @param angle - The angle of rotation for the rectangle. Default is 0.
     */
    outline(element: Box | Polygon, color: Color, lineWidth = 1, angle = 0) {
        const { ctx } = this.game
        const { pos, size } = element
        ctx.save()
        ctx.strokeStyle = color.toString()
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        if (element instanceof Polygon) {
            this.polygon(element)
        } else {
            this.rotate(element, angle)
            ctx.rect(pos.x, pos.y, size.x, size.y)
        }
        ctx.stroke()
        ctx.restore()
    }

    /**
     * Renders text on the canvas.
     * @param text - The text to render.
     * @param pos - The position to render the text.
     * @param color - The color of the text. Defaults to white.
     * @param size - The font size of the text. Defaults to '1em'.
     * @param textAlign - The horizontal alignment of the text. Defaults to 'left'.
     * @param textBaseline - The vertical alignment of the text. Defaults to 'top'.
     * @param stroke - Whether to stroke the text. Defaults to false.
     */
    text(
        text: string,
        pos: Vector,
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
            ctx.strokeText(text, pos.x, pos.y)
        }
        ctx.fillStyle = (color || DefaultColors.White).toString()
        ctx.fillText(text, pos.x, pos.y)
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
        image: HTMLImageElement | HTMLCanvasElement,
        rect: Box,
        scale = vec2(1),
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
        const f = vec2(flipH ? -size.x * scale.x : 0, flipV ? -size.y * scale.y : 0)
        const fpos = pos.subtract(f).multiply(s)

        ctx.save()
        this.rotate(rect, angle, clip ? scale : vec2(1))
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
                  size.x * scale.x,
                  size.y * scale.y
              )
            : ctx.drawImage(image, pos.x - 0.5, pos.y - 0.5, size.x, size.y)
        ctx.translate(-0.5, -0.5)
        ctx.restore()
    }

    /**
     * Rotates the canvas context around a specified position and angle, and then executes a callback function.
     * @param element - The element to rotate around.
     * @param angle - The angle of rotation in radians. Defaults to 0.
     * @param scale - The scale factor. Defaults to 0.
     */
    rotate(element: Box | Polygon, angle = 0, scale = vec2(1)) {
        const { pos, size } = element
        const ctx = this.game.ctx
        ctx.translate(pos.x + (size.x * scale.x) / 2, pos.y + (size.y * scale.y) / 2)
        ctx.rotate(angle)
        ctx.translate(-(pos.x + (size.x * scale.x) / 2), -(pos.y + (size.y * scale.y) / 2))
    }

    /**
     * Sets the blending mode for the canvas rendering context.
     * @param blend - A boolean indicating whether to enable blending.
     * @param context - The canvas rendering context.
     */
    setBlending(blend: boolean, context = this.game.ctx) {
        context.globalCompositeOperation = blend ? 'lighter' : 'source-over'
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
     * Creates a pixel font renderer function.
     *
     * @param {HTMLImageElement} [image=this.pixelFont] - The image containing the pixel font.
     * @param {number} [fontSize=8] - The size of each character in the pixel font.
     * @param {string} [color='white'] - The color to apply to the pixel font.
     * @returns {Function} The pixel font renderer function.
     */
    createPixelFontRenderer(image: HTMLImageElement, fontSize: number, color = 'white') {
        const { ctx } = this.game
        const cols = (image.width / fontSize) | 0

        // create a canvas for the font and apply the color
        const fontCanvas = document.createElement('canvas')
        const fontContext = fontCanvas.getContext('2d') as CanvasRenderingContext2D
        fontCanvas.width = image.width
        fontCanvas.height = image.height
        fontContext.drawImage(image, 0, 0)
        fontContext.fillStyle = color
        fontContext.globalCompositeOperation = 'source-in'
        fontContext.fillRect(0, 0, image.width, image.height)

        return (
            text: string,
            pos: Vector,
            scale = 1,
            textAlign: CanvasTextAlign = 'left',
            textBaseline: CanvasTextBaseline = 'top'
        ) => {
            let { x, y } = pos.clone()
            if (textAlign === 'center') x -= (text.length * fontSize * scale) / 2
            if (textAlign === 'right') x -= text.length * fontSize * scale
            if (textBaseline === 'middle') y -= (fontSize * scale) / 2
            if (textBaseline === 'bottom') y -= fontSize * scale

            text.split('\n')
                .reverse()
                .forEach((output, index) => {
                    for (let i = 0; i < output.length; i++) {
                        const chr = output.charCodeAt(i)
                        ctx.drawImage(
                            fontCanvas,
                            (chr % cols) * fontSize,
                            Math.ceil((chr + 1) / cols - 1) * fontSize,
                            fontSize,
                            fontSize,
                            Math.floor(x + i * fontSize * scale),
                            Math.floor(y - index * (fontSize + 1)),
                            fontSize * scale,
                            fontSize * scale
                        )
                    }
                })
        }
    }

    /**
     * Displays a preloader with a progress bar on the canvas.
     * @param p - The progress percent value.
     */
    preloader(p: number) {
        const { ctx, canvas, backgroundColor, primaryColor } = this.game
        const { width, height } = canvas

        const logoSize = vec2(height / 5).floor()
        const logoPos = vec2(width / 2 - logoSize.x / 2, height / 2 - logoSize.y / 2).floor()
        const barSize = vec2(width / 3, height / 16).floor()
        const barPos = vec2(width / 2 - barSize.x / 2, height / 2 - barSize.y / 2).floor()
        const fs = barSize.y / 4 + 'px'
        const gradient = ctx.createRadialGradient(width / 2, height / 2, logoSize.y, width / 2, height / 2, height)

        gradient.addColorStop(0, backgroundColor.brightness(10).toString())
        gradient.addColorStop(0.6, backgroundColor.toString())
        gradient.addColorStop(1, backgroundColor.toString())

        ctx.save()
        ctx.imageSmoothingEnabled = false
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
        if (p < 0) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
            ctx.shadowBlur = 6
            ctx.shadowOffsetX = 6
            ctx.shadowOffsetY = 6
            ctx.drawImage(this.logo, logoPos.x, logoPos.y, logoSize.x, logoSize.y)
        } else {
            this.text(
                'Loading assets...',
                vec2(width / 2, height / 2 - barSize.y / 1.5),
                primaryColor,
                fs,
                'center',
                'bottom'
            )
            this.fillRect(new Box(barPos, barSize), backgroundColor.brightness(20))
            this.fillRect(
                new Box(
                    barPos.add(vec2(barSize.x * 0.02)),
                    barSize.subtract(vec2(barSize.x * 0.04)).multiply(vec2(p, 1))
                ),
                backgroundColor.brightness(40)
            )
            this.text(`${(p * 100).toFixed(0)}%`, vec2(width / 2, height / 2), primaryColor, fs, 'center', 'middle')
        }
        ctx.restore()
    }
}
