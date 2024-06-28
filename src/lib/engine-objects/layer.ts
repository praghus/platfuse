import { TMXLayer } from 'tmx-map-parser'
import { NodeType } from '../constants'
import { Vector, vec2 } from '../engine-helpers'
import { Entity } from './entity'
import { Scene } from './scene'

export class Layer {
    id = 0
    name?: string
    type = NodeType.Custom as string
    size = vec2()
    properties: Record<string, any> = {}
    data?: (number | null)[]
    objects?: Entity[]
    visible = true
    renderOrder = 0

    // @todo: create dedicated canvas for each layer

    constructor(
        public scene: Scene,
        layerData?: TMXLayer
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
            this.type = NodeType.Custom
        }
    }

    /**
     * Updates the layer.
     */
    update() {}

    /**
     * Retrieves the tile at the specified position.
     * @param pos - The position of the tile.
     * @returns The tile at the specified position, or `null` if the position is out of range
     *          or the data is not available.
     */
    getTile(pos: Vector) {
        return (pos.inRange(this.size) && this.data && this.data[pos.x + this.size.x * pos.y]) || null
    }

    /**
     * Sets the tile at the specified position.
     * @param pos - The position of the tile.
     * @param tileId - The ID of the tile to set.
     */
    setTile(pos: Vector, tileId: number) {
        if (this.data && pos.inRange(this.size)) {
            this.data[pos.x + this.size.x * pos.y] = tileId
        }
    }

    /**
     * Clears the tile at the specified position.
     * @param pos - The position of the tile to clear.
     */
    clearTile(pos: Vector) {
        if (this.data && pos.inRange(this.size)) {
            this.data[pos.x + this.size.x * pos.y] = null
        }
    }

    /**
     * Toggles the visibility of the layer.
     * @param toggle - A boolean value indicating whether to show or hide the layer.
     */
    toggleVisibility(toggle: boolean) {
        this.visible = toggle
    }

    /**
     * Draws the layer on the scene.
     * If the layer is visible and belongs to a scene, it will draw the tiles or objects based on the layer type.
     */
    draw() {
        if (this.scene && this.visible) {
            switch (this.type) {
                case NodeType.Layer:
                    this.scene.forEachVisibleTile(this, (tile, pos, flipH, flipV) => tile?.draw(pos, flipH, flipV))
                    break
                case NodeType.ObjectGroup:
                    this.scene.forEachVisibleObject(obj => obj.visible && obj.draw())
                    break
            }
        }
    }
}
