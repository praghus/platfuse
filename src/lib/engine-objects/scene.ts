import { tmx, TMXTileset, TMXLayer } from 'tmx-map-parser'
import { Constructable } from '../../types'
import { isValidArray, getFilename, sortByRenderOrder } from '../utils/helpers'
import { Box, Vector, vec2 } from '../engine-helpers'
import { Flipped, NodeType } from '../constants'
import { Camera } from './camera'
import { Entity } from './entity'
import { Game } from './game'
import { Layer } from './layer'
import { Tile } from './tile'

export class Scene {
    size = vec2() //                    The size of the scene (in tiles)
    tileSize = vec2() //                The size of each tile in the scene
    camera: Camera //                   The camera object for the scene
    tiles: Record<string, Tile> = {} // The tiles objects in the scene
    tileCollisionData: number[] = [] // The collision data for the scene
    objects: Entity[] = [] //           The objects in the scene
    layers: Layer[] = [] //             The layers in the scene
    gravity = 0 //                      The gravity value for the scene
    nextRenderOrder = 0 //              The next available render order for layers

    constructor(public game: Game) {
        this.camera = new Camera(vec2(game.width, game.height))
    }

    /**
     * Initializes the scene.
     * @param map - Optional parameter specifying the Tiled map (.tmx) to load.
     * @returns A promise that resolves when the initialization is complete.
     */
    async init(map?: string): Promise<void> {
        if (map) {
            const { layers, tilesets, tilewidth, tileheight, width, height } = await tmx(map)
            this.setDimensions(vec2(width, height), vec2(tilewidth, tileheight))
            this.createTilesets(tilesets)
            this.createLayers(layers)
        }
    }

    /**
     * Updates the scene.
     */
    update() {}

    /**
     * Updates the camera in the scene.
     */
    updateCamera() {
        this.camera.update()
    }

    /**
     * Updates all the layers in the scene.
     */
    updateLayers() {
        for (const layer of this.layers) {
            layer instanceof Layer && layer.update()
        }
    }

    /**
     * Updates all the active objects in the scene.
     */
    updateObjects() {
        for (const obj of this.objects) {
            if (obj.active) {
                obj.update()
                obj.dead && this.removeObject(obj)
            }
        }
    }

    /**
     * Performs post-update operations for the scene.
     */
    postUpdate() {}

    /**
     * Draws the scene on the main context.
     */
    draw() {
        const { ctx, width, height } = this.game
        const layers = this.layers.filter(l => l instanceof Layer && l.visible)
        const objects = this.objects.filter(o => o.visible && !o.layerId)
        layers.sort(sortByRenderOrder)
        objects.sort(sortByRenderOrder)

        ctx.imageSmoothingEnabled = false
        ctx.save()
        ctx.clearRect(0, 0, width, height)
        for (const layer of layers) layer.draw()
        for (const obj of objects) obj.draw()
        ctx.restore()

        this.game.debug && this.displayDebug()
    }

    /**
     * Sets the dimensions of the scene.
     * @param size - The size of the scene.
     * @param tileSize - The size of each tile in the scene.
     */
    setDimensions(size: Vector, tileSize: Vector) {
        this.size = size
        this.tileSize = tileSize
    }

    /**
     * Sets the scale of the scene.
     * @param scale - The scale value to set.
     */
    setScale(scale: number) {
        this.camera.setScale(scale)
    }

    /**
     * Sets the tile collision layer for the scene.
     *
     * @param layerIndex - The index of the layer to set as the collision layer.
     */
    setTileCollisionLayer(layerIndex: number, exclude = [] as number[]) {
        const layer = this.layers[layerIndex]
        if (layer) {
            this.tileCollisionData =
                layer?.data?.map((id): number => {
                    return id && !exclude.includes(id) ? id : 0
                }) || []
        }
    }

    /**
     * Performs a tile collision test for the given position and size.
     * @param pos - The position of the entity.
     * @param size - The size of the entity.
     * @param entity - The entity to perform the collision test for (optional).
     * @returns `true` if a collision is detected, `false` otherwise.
     */
    testTileCollision(pos: Vector, size: Vector, entity?: Entity) {
        const minX = Math.max((pos.x - size.x / 2) | 0, 0)
        const minY = Math.max((pos.y - size.y / 2) | 0, 0)
        const maxX = Math.min(pos.x + size.x / 2, this.size.x)
        const maxY = Math.min(pos.y + size.y / 2, this.size.y)
        for (let y = minY; y < maxY; ++y) {
            for (let x = minX; x < maxX; ++x) {
                const tileData = this.tileCollisionData[x + this.size.x * y]
                if (tileData && (!entity || entity.collideWithTile(tileData, vec2(x, y)))) return true
            }
        }
        return false
    }

    /**
     * Performs a raycast to check for tile collisions between two positions.
     * Based on the DDA algorithm: https://lodev.org/cgtutor/raycasting.html
     * @param start The starting position of the raycast.
     * @param end The ending position of the raycast.
     * @param entity An optional entity to check for collisions with tiles.
     * @returns The position of the first tile hit by the raycast, or null if no collision occurred.
     */
    raycastTileCollision(start: Vector, end: Vector, entity?: Entity, exclude = [] as number[]) {
        const pos = start.floor()
        const delta = end.subtract(start)
        const length = delta.length()
        const norm = delta.normalize()
        const unit = vec2(Math.abs(1 / norm.x), Math.abs(1 / norm.y))

        let x1 = unit.x * (delta.x < 0 ? start.x - pos.x : pos.x - start.x + 1)
        let y1 = unit.y * (delta.y < 0 ? start.y - pos.y : pos.y - start.y + 1)

        while (1) {
            const tileData = this.getTileCollisionData(pos)
            if (tileData && !exclude.includes(tileData) && (!entity || entity.collideWithTile(tileData, pos))) {
                return pos.add(vec2(0.5))
            }
            if (x1 > length && y1 > length) break
            if (x1 > y1) (pos.y += Math.sign(delta.y)), (y1 += unit.y)
            else (pos.x += Math.sign(delta.x)), (x1 += unit.x)
        }
    }

    /**
     * Creates layers and adds them to the scene.
     * @param layers - An array of layer constructors or TMXLayer instances.
     */
    createLayers(layers: (Constructable<Layer> | TMXLayer)[]) {
        this.layers = []
        layers.forEach(l => this.addLayer(l))
    }

    /**
     * Adds a layer to the scene.
     * @param l - The layer to add. It can be a constructor function or an instance of TMXLayer.
     * @param order - The render order of the layer. If not provided,
     *                it will be assigned the next available render order.
     */
    addLayer(l: Constructable<Layer> | TMXLayer, order?: number) {
        const layer = typeof l === 'function' ? new l(this) : new Layer(this, l)
        // Extract object from TMXLayer
        if (typeof l !== 'function') {
            l.objects && l.objects.forEach(obj => this.addObjectFromLayer(obj.type, { ...obj, layerId: l.id }))
        }
        layer.renderOrder = order || this.nextRenderOrder++
        this.layers.push(layer)
    }

    addObjectFromLayer(type: string, props: Record<string, any>) {
        const Model: Constructable<Entity> = this.game.objectClasses[type]
        const entity: Entity = Model ? new Model(this, props) : new Entity(this, props)
        entity.createSprite()
        this.objects.push(entity)
        return entity
    }

    addObject(entity: Entity, layerId?: number) {
        if (layerId) {
            const layer = this.getLayer(layerId)
            layer instanceof Layer && layer.type === NodeType.ObjectGroup
                ? (entity.layerId = layer.id)
                : console.warn(`Layer with ID:${layerId} not found or is not an object layer!`)
        }
        entity.createSprite()
        this.objects.push(entity)
    }

    /**
     * Removes an object from the scene.
     * @param obj - The object to be removed.
     */
    removeObject(obj: Entity) {
        this.objects.splice(this.objects.indexOf(obj), 1)
    }

    /**
     * Adds a tileset to the scene.
     * @param tileset - The tileset to add.
     * @param source - The source of the tileset image.
     */
    addTileset(tileset: TMXTileset, source: string) {
        const newTileset = { ...tileset, image: { ...tileset.image, source } } // @todo: crerate Tileset class
        for (let i = 0; i < newTileset.tilecount; i++) {
            this.tiles[i + newTileset.firstgid] = new Tile(this, i + newTileset.firstgid, newTileset)
        }
    }

    /**
     * Creates tilesets for the scene.
     * @param tilesets - An array of TMXTileset objects representing the tilesets to be created.
     */
    createTilesets(tilesets: TMXTileset[]) {
        tilesets.map((tileset: TMXTileset) => {
            const asset = getFilename(tileset.image.source)
            if (Object.keys(this.game.assets).includes(asset)) {
                this.addTileset(tileset, asset)
            }
        })
    }

    /**
     * Sets the collision data for a tile at the specified position.
     * @param pos - The position of the tile.
     * @param data - The collision data to set for the tile. Defaults to 0.
     */
    setTileCollisionData(pos: Vector, data = 0) {
        pos.inRange(this.size) && (this.tileCollisionData[((pos.y | 0) * this.size.x + pos.x) | 0] = data)
    }

    /**
     * Retrieves the tile collision data at the specified position.
     * @param pos - The position to retrieve the tile collision data from.
     * @returns The tile collision data at the specified position.
     */
    getTileCollisionData(pos: Vector) {
        return pos.inRange(this.size) ? this.tileCollisionData[((pos.y | 0) * this.size.x + pos.x) | 0] : 0
    }

    getCameraVisibleGrid() {
        return new Box(
            this.camera.pos.divide(this.tileSize).invert().divide(this.camera.scale).floor(),
            this.camera.size.divide(this.tileSize).divide(this.camera.scale).floor()
        )
    }

    getCameraVisibleArea() {
        return new Box(
            this.camera.pos.invert().add(this.camera.size.divide(2)).divide(this.camera.scale),
            this.camera.size.divide(this.camera.scale)
        ).divide(this.tileSize)
    }

    /**
     * Returns the grid position of a given vector.
     * @param pos - The vector to calculate the grid position for.
     * @returns The grid position as a vector.
     */
    getGridPos(pos: Vector) {
        return vec2(Math.ceil(pos.x / this.tileSize.x), Math.ceil(pos.y / this.tileSize.y))
    }

    /**
     * Calculates position on screen based on the given position and size.
     * @param pos - The position vector.
     * @param size - The size vector (optional).
     * @returns The calculated screen position.
     */
    getScreenPos(pos: Vector, size?: Vector) {
        return pos
            .clone()
            .multiply(this.tileSize)
            .subtract(size ? size.multiply(this.tileSize).divide(2) : vec2())
            .scale(this.camera.scale)
            .subtract(vec2(this.camera.scale)) // @todo: check if this is needed
    }

    getPointerPos() {
        const { pos, scale } = this.camera
        const { mouseScreenPos } = this.game.input
        return mouseScreenPos.clone().subtract(pos).divide(scale).floor()
    }

    getPointerRelativeGridPos() {
        return this.getPointerPos().divide(this.tileSize)
    }

    /**
     * Retrieves a layer from the scene based on the provided ID.
     * @param id - The ID of the layer to retrieve.
     * @returns The layer with the specified ID, or an empty object if no layer is found.
     */
    getLayer(id: number) {
        return this.layers.find(layer => layer.id === id) || ({} as Layer)
    }

    getObjectById(id: number) {
        return this.objects.find(object => object.id === id)
    }

    getObjectByType(type: string) {
        return this.objects.find(object => object.type === type)
    }

    getObjectsByType(type: string) {
        return this.objects.filter(object => object.type === type)
    }

    getObjectLayers() {
        return this.layers.filter((layer: Layer) => isValidArray(layer.objects))
    }

    getTile(pos: Vector, layerId: number) {
        return this.getTileObject(this.getLayer(layerId).getTile(pos) || 0)
    }

    getTileObject(id: number) {
        const gid: number = (id &= ~(Flipped.Horizontally | Flipped.Vertically | Flipped.Diagonally))
        return this.tiles[gid]
    }

    removeLayer(index: number) {
        this.layers.splice(index, 1)
    }

    showLayer(layerId: number) {
        this.getLayer(layerId).toggleVisibility(true)
    }

    hideLayer(layerId: number) {
        this.getLayer(layerId).toggleVisibility(false)
    }

    displayDebug() {
        const { avgFPS, canvas, draw, primaryColor } = this.game
        const { pos, scale } = this.camera
        const { width, height } = canvas
        const grid = this.getCameraVisibleGrid()
        const pointerPos = this.getPointerPos()
        const write = (text: string, align: CanvasTextAlign = 'left') => {
            const x = (align === 'left' && 4) || (align === 'right' && width - 4) || width / 2
            draw.text(text, x, height - 4, primaryColor, '1em', align, 'bottom')
        }
        write(`[${grid.pos.x},${grid.pos.y}][${pos.x.toFixed(2)},${pos.y.toFixed(2)}][x${scale.toFixed(1)}]`)
        write(`[${pointerPos.x},${pointerPos.y}]`, 'center')
        write(`[${this.objects.length}][${avgFPS.toFixed(1)} FPS]`, 'right')
    }
}
