import { TMXLayer, TMXFlips } from 'tmx-map-parser'
import { NODE_TYPE } from './utils/constants'
import { Entity } from './entity'
import { Game } from './game'
import { Vector, vec2 } from './utils/math'
export class Layer {
    id: number
    name?: string
    type = NODE_TYPE.CUSTOM as string
    size = vec2()
    properties: Record<string, any> = {}
    data?: (number | null)[]
    objects?: Entity[]
    visible = true
    renderOrder = 0

    constructor(
        layerData: TMXLayer | null,
        public game: Game
    ) {
        if (layerData) {
            this.id = layerData.id
            this.name = layerData.name
            this.type = layerData.type
            this.size = vec2(layerData.width, layerData.height)
            this.visible = layerData.visible === undefined ? true : !!layerData.visible
            this.properties = layerData?.properties || {}
            this.data = layerData?.data
        } else {
            this.type = NODE_TYPE.CUSTOM
            this.id = 0
        }
    }

    update() {}

    get(pos: Vector) {
        return (pos.inRange(this.size) && this.data && this.data[pos.x + this.size.x * pos.y]) || null
    }

    set(pos: Vector, tileId: number) {
        if (this.data && pos.inRange(this.size)) {
            this.data[pos.x + this.size.x * pos.y] = tileId
        }
    }

    clear(pos: Vector) {
        if (this.data && pos.inRange(this.size)) {
            this.data[pos.x + this.size.x * pos.y] = null
        }
    }

    toggleVisibility(toggle: boolean) {
        this.visible = toggle
    }

    draw() {
        const scene = this.game.currentScene
        if (scene && this.visible) {
            switch (this.type) {
                case NODE_TYPE.LAYER:
                    scene.forEachVisibleTile(this, (tile, pos, flips) => tile?.draw(pos, flips as TMXFlips))
                    break
                case NODE_TYPE.OBJECT_GROUP:
                    scene.forEachVisibleObject(obj => obj.visible && obj.draw())
                    break
            }
        }
    }
}
