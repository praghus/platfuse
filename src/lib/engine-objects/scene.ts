import { TMXTiledMap, TMXLayer, TMXTileset } from 'tmx-map-parser'
import { Constructable } from '../../types'
import { sortByRenderOrder } from '../utils/helpers'
import { vec2 } from '../utils/geometry'
import { Vector } from '../engine-helpers/vector'
import { Box } from '../engine-helpers/box'
import { Flipped } from '../constants'
import { Camera } from './camera'
import { Entity } from './entity'
import { Game } from './game'
import { Layer } from './layer'
import { Tile } from './tile'

export class Scene {
    /** The camera object for the scene. */
    camera = new Camera(this)

    /** The size of the scene (grid size in tiles). Default grid is canvas resolution with tile size 1px. */
    size = this.game.getResolution()

    /** The size of each tile in the scene (default 1px). */
    tileSize = vec2(1)

    /** A record of all the tiles in the scene. */
    tiles: Record<string, Tile> = {}

    /** An array of tile collision data. */
    tileCollisionData: number[] = []

    /** An array of all the objects in the scene. */
    objects: Entity[] = []

    /** An array of all the layers in the scene. */
    layers: Layer[] = []

    /** The custom data for the scene. */
    data: Record<string, any> = {}

    /** The global gravity value for the scene. */
    gravity = 0

    /** The next available render order for layers. */
    nextRenderOrder = 0

    /** The TMX map file name. */
    tmxMap?: string

    /**
     * Creates a new scene object.
     * @param game - The game object that the scene belongs to.
     * @param name - The name of the scene.
     */
    constructor(
        public game: Game,
        public name: string
    ) {}

    /**
     * Destroys the scene by resetting its properties.
     */
    destroy() {
        this.data = {}
        this.tiles = {}
        this.layers = []
        this.objects = []
        this.tileCollisionData = []
        this.nextRenderOrder = 0
        this.camera.pos = vec2()
    }

    /**
     * Creates a scene from a TMX map.
     * @param tmxMap The TMX map to create the scene from.
     */
    createFromTmxMap(tmxMap: TMXTiledMap) {
        const { layers, tilesets, tilewidth, tileheight, width, height } = tmxMap
        this.setDimensions(vec2(width, height), vec2(tilewidth, tileheight))
        this.createTilesets(tilesets)
        this.createLayers(layers)
    }

    /**
     * Initializes the scene.
     */
    init() {}

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
        for (const layer of this.layers) layer instanceof Layer && layer.update()
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
     * Performs post-update operations for all the layers in the scene.
     */
    postUpdateLayers() {
        for (const layer of this.layers) layer instanceof Layer && layer.postUpdate()
    }

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
        ctx.clearRect(0, 0, width, height)

        for (const layer of layers) layer.draw()
        for (const obj of objects) obj.draw()
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
     * @param layerId - The ID of the layer to set as the collision layer.
     * @param exclude - An array of tile IDs to exclude from the collision layer.
     */
    setTileCollisionLayer(layerId: number, exclude = [] as number[]) {
        const layer = this.getLayerById(layerId)
        if (layer instanceof Layer) {
            this.tileCollisionData =
                layer?.data?.map((id): number => {
                    return id && !exclude.includes(id) ? id : 0
                }) || []
        } else {
            console.warn(`Layer with ID:${layerId} not found or is not tile layer`)
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
    raycastTileCollision(start: Vector, end: Vector, entity?: Entity) {
        const pos = start.floor()
        const delta = end.subtract(start)
        const length = delta.length()
        const norm = delta.normalize()
        const unit = vec2(Math.abs(1 / norm.x), Math.abs(1 / norm.y))

        let x1 = unit.x * (delta.x < 0 ? start.x - pos.x : pos.x - start.x + 1)
        let y1 = unit.y * (delta.y < 0 ? start.y - pos.y : pos.y - start.y + 1)

        while (1) {
            const tileId = this.getTileCollisionData(pos)
            if (tileId && (!entity || entity.collideWithTileRaycast(tileId, pos))) {
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
        if (this.getLayerById(layer.id)) {
            throw new Error(`Layer with Id: ${layer.id} already exists in the Scene!`)
        }
        // Extract objects from TMXLayer
        if (typeof l !== 'function') {
            l.objects && l.objects.forEach(obj => this.addObjectFromLayer(obj.type, { ...obj, layerId: l.id }))
        }
        layer.renderOrder = order || this.nextRenderOrder++
        this.layers.push(layer)
        return layer
    }

    /**
     * Adds an object to the scene from a specific layer.
     *
     * @param type - The type of the object to add.
     * @param props - The properties of the object.
     * @returns The added entity.
     */
    addObjectFromLayer(type: string, props: Record<string, any>) {
        const Model: Constructable<Entity> = this.game.objectClasses[type]
        const entity: Entity = Model ? new Model(this, props) : new Entity(this, props)
        this.objects.push(entity)
        return entity
    }

    /**
     * Adds an entity to the scene.
     * @param entity - The entity to be added.
     * @param layerId - The ID of the layer to add the entity to (optional).
     * @returns The added entity.
     */
    addObject(entity: Entity, layerId?: number) {
        if (layerId) {
            const layer = this.getLayerById(layerId)
            layer instanceof Layer
                ? (entity.layerId = layer.id)
                : console.warn(`Layer with ID:${layerId} not found or is not an object layer!`)
        }
        this.objects.push(entity)
        return entity
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
        const newTileset = { ...tileset, image: { ...tileset.image, source } }
        for (let i = 0; i < newTileset.tilecount; i++) {
            this.tiles[i + newTileset.firstgid] = new Tile(this, i + newTileset.firstgid, newTileset)
        }
        return newTileset
    }

    /**
     * Creates tilesets for the scene.
     * @param tilesets - An array of TMXTileset objects representing the tilesets to be created.
     */
    createTilesets(tilesets: TMXTileset[]) {
        tilesets.map((tileset: TMXTileset) => {
            const asset = tileset.image.source.replace(/^.*[\\\/]/, '')
            if (Object.keys(this.game.images).includes(asset)) {
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

    /**
     * Returns the visible grid of the camera.
     * @returns {Box} The visible grid of the camera.
     */
    getCameraVisibleGrid() {
        return new Box(
            this.camera.pos.divide(this.tileSize).negate().divide(this.camera.scale).floor(),
            this.game.getResolution().divide(this.tileSize).divide(this.camera.scale).add(vec2(1))
        )
    }

    /**
     * Calculates the visible area of the camera in the scene.
     * @returns A `Box` object representing the visible area of the camera.
     */
    getCameraVisibleArea() {
        const viewSize = this.game.getResolution()
        return new Box(
            this.camera.pos.negate().add(viewSize.divide(2)).divide(this.camera.scale),
            viewSize.divide(this.camera.scale)
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
            .multiply(this.tileSize)
            .subtract(size ? size.multiply(this.tileSize).divide(2) : vec2())
            .scale(this.camera.scale)
    }

    /**
     * Returns the position of the pointer relative to the scene.
     * @returns {Vector2} The position of the pointer relative to the scene.
     */
    getPointerPos() {
        const { pos, scale } = this.camera
        const { mouseScreenPos } = this.game.input
        return mouseScreenPos.subtract(pos).divide(scale)
    }

    /**
     * Returns the pointer position relative to the grid.
     * @returns The pointer position divided by the tile size.
     */
    getPointerRelativeGridPos() {
        return this.getPointerPos().divide(this.tileSize)
    }

    /**
     * Retrieves a layer from the scene based on the provided ID.
     * @param id - The ID of the layer to retrieve.
     * @returns The layer with the specified ID, or undefined if no layer is found.
     */
    getLayerById(id: number) {
        return this.layers.find(layer => layer.id === id)
    }

    /**
     * Retrieves the layer at the specified index.
     * If the layer does not exist, an empty `Layer` object is returned.
     * @param index - The index of the layer to retrieve.
     * @returns The layer at the specified index, or an empty `Layer` object if the layer does not exist.
     */
    getLayerByIndex(index: number) {
        return this.layers[index] || ({} as Layer)
    }

    /**
     * Retrieves an object from the scene by its ID.
     * @param id - The ID of the object to retrieve.
     * @returns The object with the specified ID, or `undefined` if not found.
     */
    getObjectById(id: number) {
        return this.objects.find(object => object.id === id)
    }

    /**
     * Retrieves an object from the scene by its type.
     * @param type - The type of the object to retrieve.
     * @returns The first object found with the specified type, or undefined if no object is found.
     */
    getObjectByType(type: string) {
        return this.objects.find(object => object.type === type)
    }

    /**
     * Returns an array of objects of a specific type.
     * @param type - The type of objects to filter.
     * @returns An array of objects of the specified type.
     */
    getObjectsByType(type: string) {
        return this.objects.filter(object => object.type === type)
    }

    /**
     * Retrieves the object layers of the scene.
     * @returns An array of object layers.
     */
    getObjectLayers() {
        return this.layers.filter((layer: Layer) => layer.objects?.length)
    }

    /**
     * Retrieves the tile object at the specified position on the given layer.
     * If the tile at the position is not found, it returns the tile object at index 0.
     * @param pos - The position of the tile.
     * @param layerId - The ID of the layer.
     * @returns The tile object at the specified position.
     */
    getTile(pos: Vector, layerId: number) {
        const layer = this.getLayerById(layerId)
        return layer && this.getTileObject(layer.getTile(pos) || 0)
    }

    /**
     * Retrieves the tile object with the specified ID.
     * @param id - The ID of the tile object.
     * @returns The tile object associated with the ID.
     */
    getTileObject(id: number) {
        const gid: number = (id &= ~(Flipped.Horizontally | Flipped.Vertically | Flipped.Diagonally))
        return this.tiles[gid]
    }

    /**
     * Removes a layer from the scene.
     * @param layer - The layer to be removed.
     */
    removeLayer(layer: Layer) {
        this.layers.splice(this.layers.indexOf(layer), 1)
    }

    /**
     * Sets the value of a specific key in the data object.
     * @param key - The key to set the value for.
     * @param value - The value to set.
     */
    setData(key: string, value: any) {
        this.data = { ...this.data, [key]: value }
    }

    /**
     * Retrieves the value associated with the specified key from the data object.
     * @param key - The key of the value to retrieve.
     * @returns The value associated with the specified key, or undefined if the key does not exist.
     */
    getData(key: string) {
        return this.data[key]
    }

    /**
     * Displays debug information on the canvas.
     */
    displayDebug() {
        const { avgFPS, canvas, draw, primaryColor } = this.game
        const { pos, scale } = this.camera
        const { width, height } = canvas
        const platfuseVersion = this.game.getVersion()
        const grid = this.getCameraVisibleGrid()
        const pointerPos = this.getPointerPos()
        const write = (text: string, align: CanvasTextAlign = 'left') => {
            const x = (align === 'left' && 4) || (align === 'right' && width - 4) || width / 2
            draw.text(text, vec2(x, height - 4), primaryColor, '1em', align, 'bottom', true)
        }
        write(`[${grid.pos.x},${grid.pos.y}][${pos.x.toFixed(2)},${pos.y.toFixed(2)}][x${scale.toFixed(1)}]`)
        write(`[${pointerPos.x.toFixed(2)},${pointerPos.y.toFixed(2)}]`, 'center')
        write(`[${this.objects.length}][${avgFPS.toFixed(1)} FPS][v${platfuseVersion}]`, 'right')
    }
}
