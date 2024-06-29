import { TMXLayer, getFlips } from 'tmx-map-parser'
import { NodeType } from '../constants'
import { Vector, vec2 } from '../engine-helpers'
import { Entity } from './entity'
import { Scene } from './scene'
import { noop } from '../utils/helpers'
import { Tile } from './tile'

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

    layerCanvas?: HTMLCanvasElement
    layerContext?: CanvasRenderingContext2D

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

            if (layerData.type === NodeType.Layer) {
                this.data = layerData?.data

                this.layerCanvas = document.createElement('canvas')
                this.layerContext = this.layerCanvas.getContext('2d') as CanvasRenderingContext2D
                this.layerCanvas.width = this.size.x * this.scene.tileSize.x
                this.layerCanvas.height = this.size.y * this.scene.tileSize.y

                this.renderTilesToLayerCanvas()
            }
        } else {
            this.type = NodeType.Custom
        }
    }

    renderTilesToLayerCanvas() {
        if (this.data) {
            this.data.forEach((tileId, index) => {
                if (tileId) {
                    const tile = this.scene.getTileObject(tileId)
                    const flips = getFlips(tileId)
                    const pos = vec2(index % this.size.x, Math.floor(index / this.size.x)).multiply(this.scene.tileSize)
                    const { H, V } = flips || { H: false, V: false }

                    tile.draw(pos, H, V, this.layerContext)
                }
            })
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
            // @todo: re-render canvas on this position
        }
    }

    /**
     * Clears the tile at the specified position.
     * @param pos - The position of the tile to clear.
     */
    clearTile(pos: Vector) {
        if (this.data && pos.inRange(this.size)) {
            this.data[pos.x + this.size.x * pos.y] = null
            // @todo: re-render canvas on this position
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
     * Iterates over each visible tile and executes the provided callback function.
     *
     * @param fn - The callback function to execute for each visible tile.
     *             It receives the tile object, position, and flips as parameters.
     * @returns void
     */
    forEachVisibleTile(fn: (tile: Tile, pos: Vector, flipH: boolean, flipV: boolean) => void = noop) {
        const { camera, tileSize } = this.scene
        const { resolution } = camera

        const x = Math.min(camera.pos.x, 0)
        const y = Math.min(camera.pos.y, 0)
        const startY = Math.floor(y % tileSize.y)
        const startTileY = Math.floor(-y / tileSize.y)

        for (
            let yOffset = startY, tileYIndex = startTileY;
            yOffset <= resolution.y;
            yOffset += tileSize.y, tileYIndex++
        ) {
            const startX = Math.floor(x % tileSize.x)
            const startTileX = Math.floor(-x / tileSize.x)

            for (
                let xOffset = startX, tileXIndex = startTileX;
                xOffset <= resolution.x;
                xOffset += tileSize.x, tileXIndex++
            ) {
                const tileId = this.getTile(vec2(tileXIndex, tileYIndex))

                if (tileId) {
                    const tile = this.scene.getTileObject(tileId)
                    const position = vec2(xOffset, yOffset)
                    const flips = getFlips(tileId)
                    const { H, V } = flips || { H: false, V: false }
                    fn(tile, position, H, V)
                }
            }
        }
    }

    /**
     * Iterates over each visible object in the layer and invokes the provided callback function.
     * The callback function receives the object as a parameter.
     *
     * @param cb - The callback function to be invoked for each visible object.
     * @returns void
     */
    forEachVisibleObject(cb: (obj: Entity) => void = noop) {
        const objects = this.scene.objects.filter(({ layerId }) => layerId === this.id)
        objects.sort((a, b) => a.renderOrder - b.renderOrder)
        for (const obj of objects) {
            obj.visible && cb(obj)
        }
    }

    /**
     * Draws the layer on the canvas.
     */
    draw() {
        const { pos } = this.scene.camera
        const mainContext = this.scene.game.ctx
        if (this.visible) {
            switch (this.type) {
                case NodeType.Layer:
                    mainContext.drawImage(this.layerCanvas as HTMLCanvasElement, pos.x, pos.y)
                    // render animated tiles on main canvas
                    this.forEachVisibleTile((tile, pos, flipH, flipV) => {
                        tile.animated && tile.draw(pos, flipH, flipV, mainContext)
                    })
                    break
                case NodeType.ObjectGroup:
                    this.forEachVisibleObject(obj => obj.draw())
                    break
            }
        }
    }
}
