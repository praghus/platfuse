import { StringTMap, TMXLayer, TMXFlips } from '../types'
import { NODE_TYPE } from './utils/constants'
import { Entity } from './entity'
import { Game } from './game'

export class Layer {
    id = 0
    width = 0
    height = 0
    name?: string
    type = NODE_TYPE.CUSTOM as string
    properties: StringTMap<any> = {}
    data: (number | null)[] = []
    objects: Entity[] = []
    visible = true

    constructor(layerData?: TMXLayer) {
        if (layerData) {
            this.id = layerData.id
            this.name = layerData.name || ''
            this.type = layerData.type || NODE_TYPE.CUSTOM
            this.visible = layerData.visible === undefined ? true : !!layerData.visible
            this.properties = layerData.properties || {}
            this.width = layerData.width
            this.height = layerData.height
            this.data = layerData.data || []
        }
    }
    update(game: Game): void {}
    isInRange(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.width && y < this.height
    }
    get(x: number, y: number): number | null {
        return (this.isInRange(x, y) && this.data[x + this.width * y]) || null
    }
    put(x: number, y: number, tileId: number): void {
        if (this.isInRange(x, y)) {
            this.data[x + this.width * y] = tileId
        }
    }
    clear(x: number, y: number): void {
        if (this.isInRange(x, y)) {
            this.data[x + this.width * y] = null
        }
    }
    toggleVisibility(toggle: boolean): void {
        this.visible = toggle
    }
    draw(game: Game): void {
        const scene = game.getCurrentScene()
        if (this.visible) {
            switch (this.type) {
                case NODE_TYPE.LAYER:
                    scene.forEachVisibleTile(game, this, (tile, pos, flips) => tile?.draw(game, pos, flips as TMXFlips))
                    break
                case NODE_TYPE.OBJECT_GROUP:
                    scene.forEachVisibleObject(obj => obj.visible && obj.draw(game), this.id)
                    break
            }
        }
    }
}
