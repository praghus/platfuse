import { TMXTileset } from 'tmx-map-parser'
import { Drawable } from '../../types'
import { getPerformance, isValidArray, normalize } from '../utils/helpers'
import { Game } from './game'
import { Vector, vec2 } from '../engine-helpers/vector'

export class Tile implements Drawable {
    properties: Record<string, any>
    type: string
    size = vec2()
    animated = false
    animFrame = 0
    then = getPerformance()
    frameStart = getPerformance()

    constructor(
        public game: Game,
        public id: number,
        public tileset: TMXTileset
    ) {
        this.properties = this.getTileProperties(id, this.tileset)
        this.type = (this.properties && this.properties.type) || null
        this.size = vec2(this.tileset.tilewidth, this.tileset.tileheight)
        this.animated = this.properties && this.properties.animation
    }

    /**
     * Retrieves the properties of a tile based on its global ID (gid) and the tileset.
     * @param gid - The global ID of the tile.
     * @param tileset - The tileset containing the tile.
     * @returns The properties of the tile, or an empty object if no properties are found.
     */
    getTileProperties(gid: number, tileset: TMXTileset) {
        const { firstgid, tiles } = tileset
        return (isValidArray(tiles) && tiles.filter(tile => tile.id === gid - firstgid)[0]) || {}
    }

    /**
     * Gets the next GID (Global ID) for the tile.
     * If the tile has an animation, it calculates the next frame based on the animation frames and durations.
     * If the tile does not have an animation, it returns the tile's ID.
     * @returns The next GID for the tile.
     */
    getNextGid() {
        if (this.animated) {
            this.frameStart = getPerformance()
            const { frames } = this.properties.animation
            if (this.frameStart - this.then > frames[this.animFrame].duration) {
                if (this.animFrame <= frames.length) {
                    this.animFrame = normalize(this.animFrame + 1, 0, frames.length)
                }
                this.then = getPerformance()
            }
            return frames[this.animFrame].tileid + this.tileset.firstgid
        } else return this.id
    }

    /**
     * Draws the tile at the specified position on the canvas.
     *
     * @param pos - The position where the tile should be drawn.
     * @param flipH - Optional. Specifies whether the tile should be flipped horizontally. Default is false.
     * @param flipV - Optional. Specifies whether the tile should be flipped vertically. Default is false.
     * @param context - Optional. The canvas rendering context to use for drawing.
     *                  If not provided, the default context will be used.
     */
    draw(pos: Vector, flipH = false, flipV = false, context?: CanvasRenderingContext2D) {
        this.game.draw.tile(this, pos, flipH, flipV, context)
    }
}
