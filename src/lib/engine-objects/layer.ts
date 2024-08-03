import { TMXLayer, getFlips } from 'tmx-map-parser'
import { NodeType } from '../constants'
import { vec2 } from '../utils/geometry'
import { Box } from '../engine-helpers/box'
import { Vector } from '../engine-helpers/vector'
import { Entity } from './entity'
import { Scene } from './scene'
import { Tile } from './tile'
import { Color } from '../engine-helpers/color'
import { getTmxColor } from '../utils/helpers'

export class Layer {
    /** The unique identifier of the layer. */
    id = 0

    /** The name of the layer (optional). */
    name?: string

    /** The type of the layer. */
    type = NodeType.Custom as string

    /** The size of the layer. */
    size = vec2()

    /** The tiles data of the layer. */
    data?: (number | null)[]

    /** The objects in the layer. */
    objects?: Entity[]

    /** The canvas element for the layer. */
    layerCanvas?: HTMLCanvasElement

    /** The rendering context of the layer canvas. */
    layerContext?: CanvasRenderingContext2D

    /** The repeatX mode for the image layer. */
    repeatX = false

    /** The repeatY mode for the image layer. */
    repeatY = false

    /** The offset of the layer. */
    offset = vec2()

    /** The parallax factor of the layer. */
    parallax = vec2(1)

    /** The image of the image layer. */
    image?: HTMLImageElement

    /** The tint color of the layer. */
    tint?: Color

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
            this.data = layerData?.data
            this.size = vec2(layerData.width, layerData.height)
            this.visible = layerData.visible === undefined ? true : !!layerData.visible
            this.properties = layerData?.properties || {}
            this.offset = vec2(layerData?.offsetx || 0, layerData?.offsety || 0)
            this.parallax = vec2(layerData?.parallaxx || 1, layerData?.parallaxy || 1)

            if (layerData?.image) {
                const asset = layerData.image.source.replace(/^.*[\\\/]/, '')
                this.image = scene.game.getImage(asset)
                this.size = vec2(this.image.width, this.image.height).divide(scene.tileSize)
                this.repeatX = !!layerData?.repeatx
                this.repeatY = !!layerData?.repeaty
            }
            if (layerData.tintcolor) {
                this.tint = new Color(getTmxColor(layerData.tintcolor))
            }
        } else {
            this.type = NodeType.Custom
        }
        this.renderToCanvas()
    }

    /**
     * Renders the tiles to the layer canvas.z
     */
    renderToCanvas() {
        if (this.image || this.data?.length) {
            this.layerCanvas = document.createElement('canvas')
            this.layerCanvas.width = this.size.x * this.scene.tileSize.x
            this.layerCanvas.height = this.size.y * this.scene.tileSize.y
            this.layerContext = this.layerCanvas.getContext('2d') as CanvasRenderingContext2D

            if (this.tint) {
                this.layerContext.globalCompositeOperation = 'multiply'
                this.layerContext.fillStyle = this.tint.toString()
                this.layerContext.fillRect(0, 0, this.layerCanvas.width, this.layerCanvas.height)
                this.layerContext.globalAlpha = this.tint.a
                this.layerContext.globalCompositeOperation = 'destination-in'
            }
            if (this.data) {
                this.data.forEach((tileId, index) => tileId && this.drawTileAt(tileId, index))
            }
            if (this.image) {
                this.layerContext.drawImage(this.image, 0, 0)
            }
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
     * Draws a tile at the specified index on the layer.
     * @param tileId - The ID of the tile to draw.
     * @param index - The index of the tile on the layer.
     */
    drawTileAt(tileId: number, index: number) {
        if (tileId) {
            const { game, tileSize } = this.scene
            const tile = this.scene.getTileObject(tileId)
            const { image, tilewidth, tileheight } = tile.tileset
            const { H, V } = getFlips(tileId) || { H: false, V: false }
            const clip = tile.getSpriteClip()
            const rect = new Box(
                vec2(index % this.size.x, Math.floor(index / this.size.x)).multiply(tileSize),
                vec2(tilewidth, tileheight)
            )
            // render static (non-animated) tiles to layer canvas
            if (!tile.animated) {
                game.draw.draw2d(game.getImage(image.source), rect, vec2(1), 0, H, V, clip, this.layerContext)
            }
        }
    }

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
            const index = pos.x + this.size.x * pos.y
            this.data[index] = tileId
            this.drawTileAt(tileId, index)
        }
    }

    /**
     * Clears the tile at the specified position.
     * @param pos - The position of the tile to clear.
     */
    clearTile(pos: Vector) {
        if (this.data && pos.inRange(this.size)) {
            this.data[pos.x + this.size.x * pos.y] = null
            this.layerContext?.clearRect(
                pos.x * this.scene.tileSize.x,
                pos.y * this.scene.tileSize.y,
                this.scene.tileSize.x,
                this.scene.tileSize.y
            )
        }
    }

    /**
     * Toggles the visibility of the layer.
     * @param toggle - A boolean value indicating whether to show or hide the layer.
     */
    toggleVisibility(visible = !this.visible) {
        this.visible = visible
    }

    /**
     * Iterates over each visible tile and executes the provided callback function.
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
     * @param cb - The callback function to be invoked for each visible object.
     */
    forEachVisibleObject(cb: (obj: Entity) => void) {
        const objects = this.scene.objects.filter(({ layerId }) => layerId === this.id)
        objects.sort((a, b) => a.renderOrder - b.renderOrder)
        for (const obj of objects) obj.visible && cb(obj)
    }

    /**
     * Draws the layer canvas to the main context at the specified position and size.
     * @param pos - The position to draw the layer canvas.
     * @param size - The size of the layer canvas.
     */
    drawToMainContext(pos: Vector, size: Vector) {
        if (this.layerCanvas) {
            this.scene.game.draw.copyToMainContext(this.layerCanvas, pos, size)
        }
    }

    /**
     * Draws the layer.
     */
    draw() {
        if (this.visible) {
            const { camera, game } = this.scene

            if (this.layerCanvas) {
                const offset = this.offset.scale(camera.scale)
                const pos = camera.pos.multiply(this.parallax).add(offset)
                const size = this.size.multiply(this.scene.tileSize).scale(camera.scale)

                if (this.repeatX && this.repeatY) {
                    for (let x = pos.x % size.x; x < game.width; x += size.x)
                        for (let y = pos.y % size.y; y < game.height; y += size.y)
                            this.drawToMainContext(vec2(x, y), size)
                } else if (this.repeatX) {
                    for (let x = pos.x % size.x; x < game.width; x += size.x)
                        this.drawToMainContext(vec2(x, pos.y), size)
                } else if (this.repeatY) {
                    for (let y = pos.y % size.y; y < game.height; y += size.y)
                        this.drawToMainContext(vec2(pos.x, y), size)
                } else {
                    const clip = pos.divide(camera.scale).scale(-1)
                    const rect = new Box(vec2(), this.scene.game.getResolution().divide(camera.scale))
                    game.draw.draw2d(this.layerCanvas, rect, vec2(camera.scale), 0, false, false, clip)
                }
            }

            switch (this.type) {
                case NodeType.Layer:
                    // render animated tiles on main canvas
                    this.forEachVisibleTile((tile, pos, flipH, flipV) => tile.animated && tile.draw(pos, flipH, flipV))
                    break
                case NodeType.ImageLayer:
                    break
                case NodeType.ObjectGroup:
                case NodeType.Custom:
                    this.forEachVisibleObject(obj => obj.draw())
                    break
            }
        }
    }
}
