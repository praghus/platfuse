import { tmx, getFlips, TMXTileset, TMXLayer, TMXFlips } from 'tmx-map-parser'
import { Constructable } from '../types'
import { isValidArray, noop, getFilename } from './utils/helpers'
import { Box, Vector, vec2 } from './utils/math'
import { Game } from './game'
import { Camera } from './camera'
import { Entity } from './entity'
import { Layer } from './layer'
import { Sprite } from './sprite'
import { Tile } from './tile'
import { FLIPPED } from './utils/constants'
import { glCopyToContext, glPreRender } from './utils/webgl'

export class Scene {
    game: Game
    camera: Camera
    layers: Layer[] = []
    size: Vector = vec2()
    tileSize: Vector = vec2()
    tiles: Record<string, Tile> = {}
    tileCollision: number[] = []
    objects: Entity[] = []
    gravity = 0
    debug = false

    constructor(game: Game) {
        this.game = game
        this.camera = new Camera(vec2(game.width, game.height))
        if (game.debug && game.gui) {
            game.gui.add(this, 'debug').listen()
        }
    }

    /**
     * Initializes the scene.
     *
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
     *
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
     * Draws the scene on the canvas.
     */
    draw() {
        const { ctx, width, height, useWebGL } = this.game
        const { scale } = this.camera

        useWebGL && glPreRender(this)
        ctx.imageSmoothingEnabled = false
        ctx.save()
        ctx.scale(scale, scale)
        ctx.clearRect(0, 0, width / scale, height / scale)
        for (const layer of this.layers) {
            layer instanceof Layer && layer.draw()
        }
        ctx.restore()
        useWebGL && glCopyToContext(ctx, true)
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
        // this.camera.setBounds(-16, -16, size.x * tileSize.x, size.y * tileSize.y)
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
     *
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
     * @param posStart The starting position of the raycast.
     * @param posEnd The ending position of the raycast.
     * @param entity An optional entity to check for collisions with tiles.
     * @returns The position of the first tile hit by the raycast, or null if no collision occurred.
     */
    tileCollisionRaycast(posStart: Vector, posEnd: Vector, entity?: Entity) {
        // test if a ray collides with tiles from start to end
        // todo: a way to get the exact hit point, it must still be inside the hit tile
        const delta = posEnd.subtract(posStart)
        const totalLength = delta.length()
        const normalizedDelta = delta.normalize()
        const unit = vec2(Math.abs(1 / normalizedDelta.x), Math.abs(1 / normalizedDelta.y))
        const flooredPosStart = posStart.floor()

        // setup iteration variables
        const pos = flooredPosStart
        let xi = unit.x * (delta.x < 0 ? posStart.x - pos.x : pos.x - posStart.x + 1)
        let yi = unit.y * (delta.y < 0 ? posStart.y - pos.y : pos.y - posStart.y + 1)

        while (1) {
            // check for tile collision
            const tileData = this.getTileCollisionData(pos)
            if (tileData && (!entity || entity.collideWithTile(tileData, pos))) {
                // debugRaycast && debugLine(posStart, posEnd, '#f00', .02);
                // debugRaycast && debugPoint(pos.add(vec2(.5)), '#ff0');
                return pos.add(vec2(0.5))
            }

            // check if past the end
            if (xi > totalLength && yi > totalLength) break

            // get coordinates of the next tile to check
            if (xi > yi) (pos.y += Math.sign(delta.y)), (yi += unit.y)
            else (pos.x += Math.sign(delta.x)), (xi += unit.x)
        }
        // debugRaycast && debugLine(posStart, posEnd, '#00f', 0.02)
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
            this.layers.push(new l(null, this.game))
        } else {
            this.layers.push(new Layer(l, this.game))
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
        const entity: Entity = Model ? new Model(props, this) : new Entity(props, this)

        entity.init()

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
        const newTileset = { ...tileset, image: { ...tileset.image, source } }
        for (let i = 0; i < newTileset.tilecount; i++) {
            this.tiles[i + newTileset.firstgid] = new Tile(this.game, i + newTileset.firstgid, newTileset)
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

    /**
     * Returns position in grid for a given vector position.
     * @param pos - The vector position.
     * @returns The grid position as a vector.
     */
    getGridPos(pos: Vector) {
        return vec2(Math.ceil(pos.x / this.tileSize.x) | 0, Math.ceil(pos.y / this.tileSize.y) | 0)
    }

    /**
     * Calculates position on screen based on the given position and size.
     * @param pos - The position vector.
     * @param size - The size vector (optional).
     * @returns The calculated screen position.
     */
    getScreenPos(pos: Vector, size?: Vector) {
        return pos.multiply(this.tileSize).subtract(size ? size.multiply(this.tileSize).divide(vec2(2)) : vec2())
    }

    /**
     * Calculates the grid position rectangle for the given entity or box.
     * @param entity - The entity or box for which to calculate the grid position rectangle.
     * @returns The grid position rectangle as a new Box object.
     */
    getGridPosRect(entity: Entity | Box) {
        return new Box(this.getGridPos(entity.pos), entity.size.divide(this.tileSize))
    }

    /**
     * Calculates the screen position rectangle for the given entity or box.
     * @param entity - The entity or box for which to calculate the screen position rectangle.
     * @returns The screen position rectangle.
     */
    getScreenPosRect(entity: Entity | Box) {
        return new Box(this.getScreenPos(entity.pos, entity.size), entity.size.multiply(this.tileSize))
    }

    createSprite(imageId: string, size = vec2()) {
        const image = this.game.getImage(imageId)
        if (image instanceof HTMLImageElement) {
            return new Sprite(this.game, image, size.multiply(this.tileSize))
        }
    }

    getLayer(id: number) {
        return this.layers.find(layer => layer.id === id) || ({} as Layer)
    }

    getObjectById(id: string) {
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
        return this.getTileObject(this.getLayer(layerId).get(pos) || 0)
    }

    getTileObject(id: number) {
        const gid: number = (id &= ~(FLIPPED.HORIZONTALLY | FLIPPED.VERTICALLY | FLIPPED.DIAGONALLY))
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

    /**
     * Iterates over each visible object in the scene and invokes the provided callback function.
     * The objects are sorted based on their render order before iteration.
     *
     * @param cb - The callback function to be invoked for each visible object.
     */
    forEachVisibleObject(cb: (obj: Entity) => void = noop) {
        this.objects.sort((a, b) => a.renderOrder - b.renderOrder)
        for (const obj of this.objects) {
            obj.visible && cb(obj)
        }
    }

    /**
     * Iterates over each visible tile in the specified layer and executes the provided callback function.
     *
     * @param layer - The layer containing the tiles.
     * @param fn    - The callback function to execute for each visible tile.
     *                It receives the tile object, position, and flips as parameters.
     * @returns void
     */
    forEachVisibleTile(layer: Layer, fn: (tile: Tile, pos: Vector, flips?: TMXFlips) => void = noop) {
        const { camera, tileSize } = this
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
                const tileId = layer?.get(vec2(tileXIndex, tileYIndex))

                if (tileId) {
                    const tile = this.getTileObject(tileId)
                    const position = vec2(xOffset, yOffset)
                    const flips = getFlips(tileId)

                    fn(tile, position, flips)
                }
            }
        }
    }

    displayDebug() {
        const { avgFPS, canvas, draw, accentColor } = this.game
        const { x, y } = this.getGridPos(this.camera.pos)

        draw.text(`Camera: ${Math.floor(-x)},${Math.floor(-y)}`, 4, 4, accentColor)
        draw.text(avgFPS.toFixed(1), canvas.width - 4, canvas.height - 4, accentColor, 1, 'right', 'bottom')
    }
}
