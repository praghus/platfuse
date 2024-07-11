/**
 * A class representing a color.
 */
class Color {
    /** The red channel value. */
    r = 255

    /** The green channel value. */
    g = 255

    /** The blue channel value. */
    b = 255

    /** The alpha channel value. */
    a = 1

    /**
     * Creates a new instance of the Color class.
     * @param rOrHex - The red channel value or a hexadecimal color string.
     * @param g - The green channel value.
     * @param b - The blue channel value.
     * @param a - The alpha channel value.
     */
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

    /**
     * Creates a new instance of the Color object with the same property values.
     * @returns A new instance of the Color object.
     */
    copy() {
        return new Color(this.r, this.g, this.b, this.a)
    }

    /**
     * Adds the values of another Color object to this Color object and returns a new Color object.
     * @param c - The Color object to be added.
     * @returns A new Color object with the summed values.
     */
    add(c: Color) {
        return new Color(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a)
    }

    /**
     * Subtracts the given color from the current color.
     * @param c - The color to subtract.
     * @returns A new `Color` object representing the result of the subtraction.
     */
    subtract(c: Color) {
        return new Color(this.r - c.r, this.g - c.g, this.b - c.b, this.a - c.a)
    }

    /**
     * Sets the alpha value of the color.
     * @param a - The alpha value to set.
     * @returns The updated Color instance.
     */
    setAlpha(a: number) {
        this.a = a
        return this
    }

    /**
     * Sets the color values based on the given hexadecimal color code.
     * @param hex - The hexadecimal color code (e.g., "#FF0000").
     * @returns The Color instance with updated color values.
     */
    setHex(hex: string) {
        const tempHex = hex.replace('#', '')
        this.r = parseInt(tempHex.substring(0, 2), 16)
        this.g = parseInt(tempHex.substring(2, 4), 16)
        this.b = parseInt(tempHex.substring(4, 6), 16)
        this.a = tempHex.length === 8 ? parseInt(tempHex.substring(6, 8), 16) / 255 : 1
        return this
    }

    /**
     * Adjusts the brightness of the color by the specified amount.
     * @param amount - The amount by which to adjust the brightness. Positive values make the color brighter,
     *                 while negative values make it darker.
     * @returns A new `Color` object with the adjusted brightness.
     */
    brightness(amount: number) {
        let { r, g, b } = this

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

    /**
     * Returns the color as a hexadecimal string representation.
     * @param includeAlpha - Whether to include the alpha channel in the string representation. Default is true.
     * @returns The color as a hexadecimal string.
     */
    toString(includeAlpha = true) {
        const toHex = (c: number) => ((c = c | 0) < 16 ? '0' : '') + c.toString(16)
        return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b) + (includeAlpha ? toHex(this.a * 255) : '')
    }
}

export { Color }
