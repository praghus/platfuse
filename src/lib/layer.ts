import { StringTMap, TMXLayer } from '../types'
import { COLORS, NODE_TYPE } from './utils/constants'
import { Entity } from './entity'
import { Game } from './game'

export class Layer {
    id: number = 0
    name: string = ''
    type: string = NODE_TYPE.CUSTOM
    properties: StringTMap<any> = {}
    width: number = 0
    height: number = 0
    visible: boolean = true
    data: (number | null)[] = []
    objects: Entity[] = []

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
                    scene.forEachVisibleTile(game, this, (tile, x, y) => tile.draw(game, x, y))
                    break
                case NODE_TYPE.OBJECT_GROUP:
                    scene.forEachVisibleObject(obj => obj.visible && obj.draw(game), this.id)
                    break
            }
        }
    }
}
