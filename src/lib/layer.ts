import { StringTMap, TMXLayer, TMXFlips } from '../types'
import { NODE_TYPE } from './utils/constants'
import { Entity } from './entity'
import { Game } from './game'
export class Layer {
    id: number
    width: number
    height: number
    name?: string
    type = NODE_TYPE.CUSTOM as string
    properties: StringTMap<any> = {}
    data: (number | null)[] = []
    objects: Entity[] = []
    visible = true
    update(): void {}

    constructor(layerData: TMXLayer, public game: Game) {
        this.id = layerData?.id || 0
        this.name = layerData?.name
        this.type = layerData?.type || NODE_TYPE.CUSTOM
        this.width = layerData?.width
        this.height = layerData?.height
        this.visible = layerData?.visible === undefined ? true : !!layerData.visible
        this.properties = layerData?.properties || {}
        this.data = layerData?.data || []
    }
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
    draw(): void {
        const scene = this.game.getCurrentScene()
        if (this.visible) {
            switch (this.type) {
                case NODE_TYPE.LAYER:
                    scene.forEachVisibleTile(this, (tile, pos, flips) => tile?.draw(pos, flips as TMXFlips))
                    break
                case NODE_TYPE.OBJECT_GROUP:
                    scene.forEachVisibleObject(obj => obj.visible && obj.draw(), this.id)
                    break
            }
        }
    }
}
