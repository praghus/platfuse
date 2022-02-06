import { Drawable, StringTMap, TMXTileset } from '../types'
import { COLORS, TILE_TYPE } from './utils/constants'
import { getPerformance, isValidArray } from './utils/helpers'
import { normalize, Box, Vec2 } from './utils/math'
import { Game } from './game'

export class Tile implements Drawable {
    properties: StringTMap<any>
    type: string
    width: number
    height: number
    animFrame = 0
    then = getPerformance()
    frameStart = getPerformance()
    terrain: number[]
    flipV = false
    flipH = false

    constructor(public id: number, public tileset: any) {
        this.properties = this.getTileProperties(id, this.tileset)
        this.type = (this.properties && this.properties.type) || null
        this.width = this.tileset.tilewidth
        this.height = this.tileset.tileheight
        this.terrain = this.getTerrain()
    }
    getProperties = (obj: any, property: string): any => obj.properties && obj.properties[property]
    isCutomShape = (): boolean => this.getProperties(this, 'objects')
    isSolid = (): boolean => this.type !== TILE_TYPE.NON_COLLIDING
    isOneWay = (): boolean => this.type === TILE_TYPE.ONE_WAY
    isInvisible = (): boolean => this.type === TILE_TYPE.INVISIBLE
    getTileProperties(gid: number, tileset: TMXTileset): StringTMap<any> {
        const { firstgid, tiles } = tileset
        return (isValidArray(tiles) && tiles.filter(tile => tile.id === gid - firstgid)[0]) || {}
    }
    getBounds(x: number, y: number): Box {
        return new Box(new Vec2(x * this.width, y * this.height), this.width, this.height)
    }
    getTerrain(): number[] {
        const { terrain } = this.properties
        return terrain && terrain.split(',').map((id: string) => (id ? parseInt(id) : null))
    }
    getNextGid(): number {
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
    draw(game: Game, x: number, y: number): void {
        if (!this.isInvisible()) {
            const { ctx, draw } = game
            const { image, columns, firstgid, tilewidth, tileheight } = this.tileset
            const tileGid = this.getNextGid()
            const posX = ((tileGid - firstgid) % columns) * tilewidth
            const posY = (Math.ceil((tileGid - firstgid + 1) / columns) - 1) * tileheight

            ctx.drawImage(game.getImage(image), posX, posY, tilewidth, tileheight, x, y, tilewidth, tileheight)
            if (game.getCurrentScene().debug) {
                draw.fillText(`${this.id}`, x + 2, y + 6, COLORS.WHITE_50)
            }
        }
    }
}
