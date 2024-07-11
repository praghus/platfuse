import { TMXLayer, getFlips } from 'tmx-map-parser'
import { NodeType } from '../constants'
import { Box, Vector, vec2 } from '../engine-helpers'
import { Entity } from './entity'
import { Scene } from './scene'
import { Tile } from './tile'

export class Layer {
    /** The unique identifier of the layer. */
    id = Date.now()

    /** The name of the layer (optional). */
    name?: string

    /** The type of the layer. */
    type = NodeType.Custom as string

    /** The size of the layer. */
    size = vec2()

    /** The data of the layer. */
    data?: (number | null)[]

    /** The objects in the layer. */
    objects?: Entity[]

    /** The canvas element for the layer. */
    layerCanvas?: HTMLCanvasElement

    /** The rendering context of the layer canvas. */
    layerContext?: CanvasRenderingContext2D

    /** The render order of the layer. */
    renderOrder = 0

    /** Flag indicating whether the layer is visible. */
    visible = true

    /** The properties of the layer. */
    properties: Record<string, any> = {}

    /**
     * Creates a new layer.
     * @param scene
     * @param layerData
     */
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

    /**
     * Renders the tiles to the layer canvas.
     */
    renderTilesToLayerCanvas() {
        if (this.data) {
            this.layerCanvas = document.createElement('canvas')
            this.layerCanvas.width = this.size.x * this.scene.tileSize.x
            this.layerCanvas.height = this.size.y * this.scene.tileSize.y
            this.layerContext = this.layerCanvas.getContext('2d') as CanvasRenderingContext2D
            this.data.forEach((tileId, index) => {
                if (tileId) {
                    const tile = this.scene.getTileObject(tileId)
                    const pos = vec2(index % this.size.x, Math.floor(index / this.size.x)).multiply(this.scene.tileSize)
                    const { H, V } = getFlips(tileId) || { H: false, V: false }
                    const { image, tilewidth, tileheight } = tile.tileset
                    const { game } = this.scene
                    // render static tiles to layer canvas (non-animated tiles)
                    if (!tile.animated) {
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
                }
            })
        }
    }

    /**
     * Updates the layer.
     */
    update() {}

    /**
     * Post-update method.
     * This method is called after the update and draw.
     * It can be used to perform additional operations after the update.
     */
    postUpdate() {}

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
     */
    forEachVisibleTile(fn: (tile: Tile, pos: Vector, flipH: boolean, flipV: boolean) => void) {
        const { pos, size } = this.scene.getCameraVisibleGrid()
        for (let y = pos.y; y < pos.y + size.y; y++) {
            for (let x = pos.x; x < pos.x + size.x; x++) {
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
     */
    forEachVisibleObject(cb: (obj: Entity) => void) {
        const objects = this.scene.objects.filter(({ layerId }) => layerId === this.id)
        objects.sort((a, b) => a.renderOrder - b.renderOrder)
        for (const obj of objects) {
            obj.visible && cb(obj)
        }
    }

    /**
     * Draws the layer.
     */
    draw() {
        const { camera } = this.scene
        const { draw } = this.scene.game
        if (this.visible) {
            switch (this.type) {
                case NodeType.Layer:
                    // draw layer canvas on main canvas
                    draw.copyToMainContext(
                        this.layerCanvas as HTMLCanvasElement,
                        camera.pos.subtract(vec2(camera.scale)), // subtract 1 to prevent clipping
                        this.size.multiply(this.scene.tileSize).scale(camera.scale)
                    )
                    // render animated tiles on main canvas
                    this.forEachVisibleTile((tile, pos, flipH, flipV) => {
                        tile.animated && tile.draw(pos, flipH, flipV)
                    })
                    break
                default:
                    this.forEachVisibleObject(obj => obj.draw())
                    break
            }
        }
    }
}
