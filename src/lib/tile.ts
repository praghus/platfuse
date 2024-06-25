import { Drawable, TMXFlips, TMXTileset } from '../types'
import { COLORS, TILE_TYPE } from './utils/constants'
import { getPerformance, isValidArray } from './utils/helpers'
import { normalize, Box, Vector, vec2 } from './utils/math'
import { Game } from './game'

export class Tile implements Drawable {
    properties: Record<string, any>
    type: string
    size = vec2()
    animFrame = 0
    then = getPerformance()
    frameStart = getPerformance()
    terrain: number[]

    constructor(
        public id: number,
        public tileset: TMXTileset,
        public game: Game
    ) {
        this.properties = this.getTileProperties(id, this.tileset)
        this.type = (this.properties && this.properties.type) || null
        this.size = vec2(this.tileset.tilewidth, this.tileset.tileheight)
        this.terrain = this.getTerrain()
    }

    // @todo: remove this
    isSolid = (): boolean => this.type !== TILE_TYPE.NON_COLLIDING
    isOneWay = (): boolean => this.type === TILE_TYPE.ONE_WAY
    isLadder = (): boolean => this.type === TILE_TYPE.LADDER

    getTileProperties(gid: number, tileset: TMXTileset) {
        const { firstgid, tiles } = tileset
        return (isValidArray(tiles) && tiles.filter(tile => tile.id === gid - firstgid)[0]) || {}
    }

    // getBounds(x: number, y: number) {
    //     return new Box(new Vector(x * this.width, y * this.height), this.width, this.height)
    // }

    /**
     * Get terrain
     * @returns {number[]} Array of terrain gid's
     */
    getTerrain() {
        const { terrain } = this.properties
        return terrain && terrain.split(',').map((id: string) => (id ? parseInt(id) : null))
    }

    /**
     * Gets next tile gid for animation
     * @returns {number} Tile gid
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
     * Draw tile image
     * @param {Vector} pos Position
     * @param {TMXFlips} flips Flips
     */
    draw(pos: Vector, flips?: TMXFlips) {
        const { draw } = this.game
        draw.tile(this, pos, flips)
        if (this.game.currentScene?.debug) {
            draw.outline(new Box(pos, this.size), COLORS.WHITE_25, 1)
        }
    }
}
