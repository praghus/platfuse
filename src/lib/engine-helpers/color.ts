import { clamp } from '../utils/helpers'

class Color {
    r = 255
    g = 255
    b = 255
    a = 1

    constructor(rOrHex: string | number = 1, g: number = 1, b: number = 1, a: number = 1) {
        if (typeof rOrHex === 'string') {
            this.setHex(rOrHex)
        } else {
            this.r = rOrHex
            this.g = g
            this.b = b
            this.a = a
        }
    }

    setHex(hex: string) {
        const fromHex = (c: number) => clamp(parseInt(hex.slice(c, c + 2), 16) / 255)
        this.r = fromHex(1)
        ;(this.g = fromHex(3)), (this.b = fromHex(5))
        this.a = hex.length > 7 ? fromHex(7) : 1
        return this
    }

    toString(useAlpha = 1) {
        const toHex = (c: number) => ((c = (c * 255) | 0) < 16 ? '0' : '') + c.toString(16)
        return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b) + (useAlpha ? toHex(this.a) : '')
    }
}

export { Color }
