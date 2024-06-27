import { clamp, rand } from './utils/math'

export class Color {
    constructor(
        public r = 0,
        public g = 0,
        public b = 0,
        public a = 1
    ) {}

    copy() {
        return new Color(this.r, this.g, this.b, this.a)
    }

    add(c: Color) {
        return new Color(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a)
    }

    subtract(c: Color) {
        return new Color(this.r - c.r, this.g - c.g, this.b - c.b, this.a - c.a)
    }

    multiply(c: Color) {
        return new Color(this.r * c.r, this.g * c.g, this.b * c.b, this.a * c.a)
    }

    divide(c: Color) {
        return new Color(this.r / c.r, this.g / c.g, this.b / c.b, this.a / c.a)
    }

    scale(scale: number, alphaScale = scale) {
        return new Color(this.r * scale, this.g * scale, this.b * scale, this.a * alphaScale)
    }

    clamp() {
        return new Color(clamp(this.r), clamp(this.g), clamp(this.b), clamp(this.a))
    }

    lerp(c: Color, percent: number) {
        return this.add(c.subtract(this).scale(clamp(percent)))
    }

    setHSLA(h = 0, s = 0, l = 1, a = 1) {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
            p = 2 * l - q,
            f = (p: number, q: number, t: number) =>
                (t = ((t % 1) + 1) % 1) < 1 / 6
                    ? p + (q - p) * 6 * t
                    : t < 1 / 2
                      ? q
                      : t < 2 / 3
                        ? p + (q - p) * (2 / 3 - t) * 6
                        : p

        this.r = f(p, q, h + 1 / 3)
        this.g = f(p, q, h)
        this.b = f(p, q, h - 1 / 3)
        this.a = a
        return this
    }

    getHSLA() {
        const r = clamp(this.r)
        const g = clamp(this.g)
        const b = clamp(this.b)
        const a = clamp(this.a)
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const l = (max + min) / 2

        let h = 0,
            s = 0
        if (max != min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            if (r == max) h = (g - b) / d + (g < b ? 6 : 0)
            else if (g == max) h = (b - r) / d + 2
            else if (b == max) h = (r - g) / d + 4
        }

        return [h / 6, s, l, a]
    }

    mutate(amount = 0.05, alphaAmount = 0) {
        return new Color(
            this.r + rand(amount, -amount),
            this.g + rand(amount, -amount),
            this.b + rand(amount, -amount),
            this.a + rand(alphaAmount, -alphaAmount)
        ).clamp()
    }

    toString(useAlpha = 1) {
        const toHex = (c: number) => ((c = (c * 255) | 0) < 16 ? '0' : '') + c.toString(16)
        return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b) + (useAlpha ? toHex(this.a) : '')
    }

    setHex(hex: string) {
        const fromHex = (c: number) => clamp(parseInt(hex.slice(c, c + 2), 16) / 255)
        this.r = fromHex(1)
        ;(this.g = fromHex(3)), (this.b = fromHex(5))
        this.a = hex.length > 7 ? fromHex(7) : 1
        return this
    }

    rgbaInt() {
        const toByte = (c: number) => (clamp(c) * 255) | 0
        const r = toByte(this.r)
        const g = toByte(this.g) << 8
        const b = toByte(this.b) << 16
        const a = toByte(this.a) << 24
        return r + g + b + a
    }
}
