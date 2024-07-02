import { TMXTileset } from 'tmx-map-parser'
import { getPerformance, isValidArray, normalize } from '../utils/helpers'
import { Drawable } from '../../types'
import { Vector, vec2 } from '../engine-helpers/vector'
import { Scene } from './scene'
import { Box } from '../engine-helpers'

export class Tile implements Drawable {
    properties: Record<string, any>
    type: string
    size = vec2()
    animated = false
    animFrame = 0
    then = getPerformance()
    frameStart = getPerformance()

    constructor(
        public scene: Scene,
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
     * Retrieves the sprite clip position for the current tile.
     * @returns The sprite clip position as a `vec2` object.
     */
    getSpriteClip() {
        const { columns, firstgid, tilewidth, tileheight } = this.tileset
        const tileGid = this.getNextGid()
        return vec2(
            ((tileGid - firstgid) % columns) * tilewidth,
            (Math.ceil((tileGid - firstgid + 1) / columns) - 1) * tileheight
        )
    }

    /**
     * Draws the tile at the specified position.
     *
     * @param pos - The position to draw the tile at.
     * @param flipH - Whether to flip the tile horizontally (default: false).
     * @param flipV - Whether to flip the tile vertically (default: false).
     */
    draw(pos: Vector, flipH = false, flipV = false, angle = 0) {
        const { image, tilewidth, tileheight } = this.tileset
        const { game, camera } = this.scene
        game.draw.draw2d(
            game.getImage(image.source),
            new Box(pos.add(camera.pos), vec2(tilewidth, tileheight)),
            camera.scale,
            angle,
            flipH,
            flipV,
            this.getSpriteClip()
        )
    }
}