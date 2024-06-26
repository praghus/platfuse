import { Drawable, TMXFlips, TMXTileset } from '../types'
import { getPerformance, isValidArray } from './utils/helpers'
import { normalize, Vector, vec2 } from './utils/math'
import { Game } from './game'

export class Tile implements Drawable {
    properties: Record<string, any>
    type: string
    size = vec2()
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
        if (this.properties && this.properties.animation) {
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
     * Draws the tile at the specified position with optional flips.
     *
     * @param pos - The position at which to draw the tile.
     * @param flips - Optional flips to apply to the tile.
     */
    draw(pos: Vector, flips?: TMXFlips) {
        const { draw } = this.game
        draw.tile(this, pos, flips)
        // if (this.game.currentScene?.debug) {
        //     draw.outline(new Box(pos, this.size), COLORS.WHITE, 0.05)
        // }
    }
}
