import { TMXLayer, TMXFlips } from '../types'
import { NODE_TYPE } from './utils/constants'
import { Entity } from './entity'
import { Game } from './game'
export class Layer {
    id: number
    width = 0
    height = 0
    name?: string
    type = NODE_TYPE.CUSTOM as string
    properties: Record<string, any> = {}
    data?: (number | null)[]
    objects?: Entity[]
    visible = true

    constructor(layerData: TMXLayer | null, public game: Game) {
        if (layerData) {
            this.id = layerData.id
            this.name = layerData.name
            this.type = layerData.type
            this.width = layerData.width
            this.height = layerData.height
            this.visible = layerData.visible === undefined ? true : !!layerData.visible
            this.properties = layerData?.properties || {}
            this.data = layerData?.data
        } else {
            this.type = NODE_TYPE.CUSTOM
            this.id = 0
        }
    }

    update() {}

    isInRange(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height
    }

    get(x: number, y: number) {
        return (this.isInRange(x, y) && this.data && this.data[x + this.width * y]) || null
    }

    put(x: number, y: number, tileId: number) {
        if (this.data && this.isInRange(x, y)) {
            this.data[x + this.width * y] = tileId
        }
    }

    clear(x: number, y: number) {
        if (this.data && this.isInRange(x, y)) {
            this.data[x + this.width * y] = null
        }
    }

    toggleVisibility(toggle: boolean) {
        this.visible = toggle
    }

    draw() {
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
