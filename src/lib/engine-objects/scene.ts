import { tmx, TMXTileset, TMXLayer } from 'tmx-map-parser'
import { Constructable } from '../../types'
import { glPreRender, glCopyToContext } from '../utils/webgl'
import { isValidArray, getFilename } from '../utils/helpers'
import { Vector, vec2 } from '../engine-helpers'
import { Flipped } from '../constants'
import { Camera } from './camera'
import { Entity } from './entity'
import { Game } from './game'
import { Layer } from './layer'
import { Sprite } from './sprite'
import { Tile } from './tile'

export class Scene {
    size = vec2()
    tileSize = vec2()
    camera: Camera
    tiles: Record<string, Tile> = {}
    tileCollision: number[] = []
    objects: Entity[] = []
    layers: Layer[] = []
    gravity = 0
    debug = false

    constructor(public game: Game) {
        this.camera = new Camera(vec2(game.width, game.height))
        if (game.debug && game.gui) {
            game.gui.add(this, 'debug').listen()
        }
    }

    /**
     * Initializes the scene.
     * @param map - Optional parameter specifying the Tiled map (.tmx) to load.
     * @returns A promise that resolves when the initialization is complete.
     */
    async init(map?: string): Promise<void> {
        const { debug, gui } = this.game
        if (map) {
            const { layers, tilesets, tilewidth, tileheight, width, height } = await tmx(map)
            this.setDimensions(vec2(width, height), vec2(tilewidth, tileheight))
            this.createTilesets(tilesets)
            this.createLayers(layers)
        }
        if (debug && gui) {
            const f1 = gui.addFolder('Scene')
            const f2 = f1.addFolder('Layers')
            f1.add(this, 'gravity').name('Gravity').step(0.01).min(0.01).max(1)
            f1.add(this.camera, 'scale').name('Scale').step(0.1).min(1).max(10).listen()
            this.layers.map(layer => {
                f2.add(layer, 'visible').name(layer.name || `Layer#${layer.id}`)
            })
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
     * Draws the scene on the canvas.
     */
    draw() {
        const { ctx, width, height, useWebGL } = this.game
        useWebGL && glPreRender(this)
        ctx.imageSmoothingEnabled = false
        ctx.save()
        // ctx.scale(scale, scale)
        ctx.clearRect(0, 0, width, height)
        // renders layers and contained objects
        for (const layer of this.layers) layer instanceof Layer && layer.draw()
        // renders object not attached to any layer
        const objects = this.objects.filter(({ layerId }) => !layerId)
        objects.sort((a, b) => a.renderOrder - b.renderOrder)
        for (const obj of objects) obj.visible && obj.draw()
        ctx.restore()
        useWebGL && glCopyToContext(ctx)
        this.debug && this.displayDebug()
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
            this.tileCollision =
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
    tileCollisionTest(pos: Vector, size: Vector, entity?: Entity) {
        const minX = Math.max((pos.x - size.x / 2) | 0, 0)
        const minY = Math.max((pos.y - size.y / 2) | 0, 0)
        const maxX = Math.min(pos.x + size.x / 2, this.size.x)
        const maxY = Math.min(pos.y + size.y / 2, this.size.y)

        for (let y = minY; y < maxY; ++y) {
            for (let x = minX; x < maxX; ++x) {
                const tileData = this.tileCollision[x + this.size.x * y]
                if (tileData && (!entity || entity.collideWithTile(tileData, vec2(x, y)))) return true
            }
        }
        return false
    }

    /**
     * Performs a raycast to check for tile collisions between two positions.
     * @param start The starting position of the raycast.
     * @param end The ending position of the raycast.
     * @param entity An optional entity to check for collisions with tiles.
     * @returns The position of the first tile hit by the raycast, or null if no collision occurred.
     */
    tileCollisionRaycast(start: Vector, end: Vector, entity?: Entity) {
        const pos = start.floor()
        const delta = end.subtract(start)
        const length = delta.length()
        const norm = delta.normalize()
        const unit = vec2(Math.abs(1 / norm.x), Math.abs(1 / norm.y))

        let x1 = unit.x * (delta.x < 0 ? start.x - pos.x : pos.x - start.x + 1)
        let y1 = unit.y * (delta.y < 0 ? start.y - pos.y : pos.y - start.y + 1)

        while (1) {
            const tileData = this.getTileCollisionData(pos)
            if (tileData && (!entity || entity.collideWithTile(tileData, pos))) {
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
     */
    addLayer(l: Constructable<Layer> | TMXLayer) {
        // @todo: add index to position layer in array
        if (typeof l === 'function') {
            this.layers.push(new l(this))
        } else {
            this.layers.push(new Layer(this, l))
            l.objects && l.objects.forEach(obj => this.addObject(obj.type, { ...obj, layerId: l.id }))
        }
    }

    /**
     * Adds an object to the scene.
     *
     * @param type - The type of the object.
     * @param props - The properties of the object.
     * @param index - The optional index at which to insert the object in the objects array.
     * @returns The newly created entity.
     */
    addObject(type: string, props: Record<string, any>, index?: number) {
        const Model: Constructable<Entity> = this.game.objectClasses[type]
        const entity: Entity = Model ? new Model(this, props) : new Entity(this, props)
        const sprite =
            (entity.image && this.createSprite(entity.image, entity.size)) || (entity.gid && this.tiles[entity.gid])
        if (sprite) entity.addSprite(sprite)

        index !== undefined ? this.objects.splice(index, 0, entity) : this.objects.push(entity)
        return entity
    }

    /**
     * Removes an object from the scene.
     *
     * @param obj - The object to be removed.
     */
    removeObject(obj: Entity) {
        this.objects.splice(this.objects.indexOf(obj), 1)
    }

    /**
     * Adds a tileset to the scene.
     *
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
     *
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
     *
     * @param pos - The position of the tile.
     * @param data - The collision data to set for the tile. Defaults to 0.
     */
    setTileCollisionData(pos: Vector, data = 0) {
        pos.inRange(this.size) && (this.tileCollision[((pos.y | 0) * this.size.x + pos.x) | 0] = data)
    }

    /**
     * Retrieves the tile collision data at the specified position.
     *
     * @param pos - The position to retrieve the tile collision data from.
     * @returns The tile collision data at the specified position.
     */
    getTileCollisionData(pos: Vector) {
        return pos.inRange(this.size) ? this.tileCollision[((pos.y | 0) * this.size.x + pos.x) | 0] : 0
    }

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
     * Creates a sprite object using the specified image ID and size.
     * @param imageId The ID of the image to use for the sprite.
     * @param size The size of the sprite. Defaults to a zero vector if not provided.
     * @returns A new Sprite object created using the specified image and size.
     */
    createSprite(imageId: string, size = vec2()) {
        const image = this.game.getImage(imageId)
        if (image instanceof HTMLImageElement) {
            return new Sprite(this, image, size.multiply(this.tileSize))
        }
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
        const { x, y } = this.getGridPos(pos).divide(scale).floor()
        const pointerPos = this.getPointerPos()
        const write = (text: string, align: CanvasTextAlign = 'left') => {
            const x = (align === 'left' && 4) || (align === 'right' && width - 4) || width / 2
            draw.text(text, x, height - 4, primaryColor, '1em', align, 'bottom')
        }
        write(`[${-x},${-y}][${pos.x.toFixed(2)},${pos.y.toFixed(2)}][x${scale.toFixed(1)}]`)
        write(`[${pointerPos.x},${pointerPos.y}]`, 'center')
        write(`[${this.objects.length}][${avgFPS.toFixed(1)} FPS]`, 'right')
    }
}
