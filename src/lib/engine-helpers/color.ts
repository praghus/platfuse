export function componentToHex(c: number): string {
    const hex = Math.round(c).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
}

class Color {
    r = 255
    g = 255
    b = 255
    a = 1

    constructor(rOrHex: string | number = 255, g: number = 255, b: number = 255, a: number = 1) {
        if (typeof rOrHex === 'string') {
            this.setHex(rOrHex)
        } else {
            this.r = rOrHex
            this.g = g
            this.b = b
            this.a = a
        }
    }

    copy() {
        return new Color(this.r, this.g, this.b, this.a)
    }

    add(c: Color) {
        return new Color(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a)
    }

    subtract(c: Color) {
        return new Color(this.r - c.r, this.g - c.g, this.b - c.b, this.a - c.a)
    }

    setAlpha(a: number) {
        this.a = a
        return this
    }

    setHex(hex: string) {
        const tempHex = hex.replace('#', '')
        this.r = parseInt(tempHex.substring(0, 2), 16)
        this.g = parseInt(tempHex.substring(2, 4), 16)
        this.b = parseInt(tempHex.substring(4, 6), 16)
        this.a = tempHex.length === 8 ? parseInt(tempHex.substring(6, 8), 16) / 255 : 1
        return this
    }

    brightness(amount: number) {
        let { r, g, b } = this
        // @todo use .add()
        r = r + amount
        g = g + amount
        b = b + amount

        if (r > 255) r = 255
        else if (r < 0) r = 0

        if (g > 255) g = 255
        else if (g < 0) g = 0

        if (b > 255) b = 255
        else if (b < 0) b = 0

        return new Color(r, g, b, this.a)
    }

    toString(useAlpha = true) {
        const toHex = (c: number) => ((c = c | 0) < 16 ? '0' : '') + c.toString(16)
        return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b) + (useAlpha ? toHex(this.a * 255) : '')
    }
}

export { Color }
