import { TMXLayer, getFlips } from 'tmx-map-parser'
import { NodeType } from '../constants'
import { Box, Vector, vec2 } from '../engine-helpers'
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
    layerCanvas?: HTMLCanvasElement
    layerContext?: CanvasRenderingContext2D
    renderOrder = 0
    visible = true

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
                this.renderTilesToLayerCanvas()
            }
        } else {
            this.type = NodeType.Custom
        }
    }

    renderTilesToLayerCanvas() {
        if (this.data) {
            this.layerCanvas = document.createElement('canvas')
            this.layerCanvas.width = this.size.x * this.scene.tileSize.x
            this.layerCanvas.height = this.size.y * this.scene.tileSize.y
            this.layerContext = this.layerCanvas.getContext('2d') as CanvasRenderingContext2D
            this.data.forEach((tileId, index) => {
                if (tileId) {
                    const tile = this.scene.getTileObject(tileId)
                    const { image, tilewidth, tileheight } = tile.tileset
                    const { game } = this.scene
                    const flips = getFlips(tileId)
                    const pos = vec2(index % this.size.x, Math.floor(index / this.size.x)).multiply(this.scene.tileSize)
                    const { H, V } = flips || { H: false, V: false }
                    game.draw.draw2d(
                        game.getImage(image.source),
                        new Box(pos, vec2(tilewidth, tileheight)),
                        1,
                        0,
                        H,
                        V,
                        tile.getSpriteClip(),
                        this.layerContext
                    )
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
        const { scale } = camera
        const start = this.scene
            .getGridPos(vec2(Math.min(camera.pos.x, 0), Math.min(camera.pos.y, 0)))
            .divide(scale)
            .floor()
        const clip = vec2(
            Math.min(camera.size.x / scale / tileSize.x, this.size.x),
            Math.min(camera.size.y / scale / tileSize.y, this.size.y)
        )
        for (let y = -start.y; y < -start.y + clip.y; y++) {
            for (let x = -start.x; x < -start.x + clip.x; x++) {
                const tileId = this.getTile(vec2(x, y))
                if (tileId) {
                    const tile = this.scene.getTileObject(tileId)
                    const position = this.scene.getScreenPos(vec2(x, y))
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
        const { camera } = this.scene
        const mainContext = this.scene.game.ctx
        if (this.visible) {
            switch (this.type) {
                case NodeType.Layer:
                    mainContext.drawImage(
                        this.layerCanvas as HTMLCanvasElement,
                        camera.pos.x,
                        camera.pos.y,
                        this.size.x * this.scene.tileSize.x * camera.scale,
                        this.size.y * this.scene.tileSize.x * camera.scale
                    )
                    // render animated tiles on main canvas
                    this.forEachVisibleTile((tile, pos, flipH, flipV) => {
                        tile.animated && tile.draw(pos, flipH, flipV)
                    })
                    break
                case NodeType.ObjectGroup:
                    this.forEachVisibleObject(obj => obj.draw())
                    break
            }
        }
    }
}