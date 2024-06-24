import { Constructable, TMXTileset, TMXLayer, TMXFlips } from '../types'
import { isValidArray, getFlips, noop, getFilename } from './utils/helpers'
import { Vector, box, vec2 } from './utils/math'
import { Game } from './game'
import { Camera } from './camera'
import { Entity } from './entity'
import { Layer } from './layer'
import { Sprite } from './sprite'
import { Tile } from './tile'
import { COLORS, FLIPPED } from './utils/constants'
import { tmx } from 'tmx-map-parser'

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

    async init(map?: string): Promise<void> {
        if (map) {
            const { layers, tilesets, tilewidth, tileheight, width, height } = await tmx(map)
            this.setDimensions(vec2(width, height), vec2(tilewidth, tileheight), 2)
            this.createTilesets(tilesets)
            this.createLayers(layers)
        }
    }

    update() {}

    updateCamera() {
        this.camera.update()
    }

    updateLayers() {
        for (const layer of this.layers) {
            layer instanceof Layer && layer.update()
        }
    }

    updateObjects() {
        for (const obj of this.objects) {
            if (obj.active) {
                obj.update()
                obj.dead && this.removeObject(obj)
            }
        }
    }

    draw() {
        const { ctx, backgroundColor, width, height } = this.game
        const { scale } = this.camera
        ctx.save()
        ctx.scale(scale, scale)
        ctx.clearRect(0, 0, width / scale, height / scale)
        if (backgroundColor) {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, width / scale, height / scale)
        }
        for (const layer of this.layers) {
            layer instanceof Layer && layer.draw()
        }
        if (this.debug) {
            this.displayDebug()
        }
        ctx.restore()
    }

    setDimensions(size: Vector, tileSize: Vector, scale = 1) {
        this.size = size
        this.tileSize = tileSize
        this.camera.setScale(scale)
        this.camera.setBounds(0, 0, size.x * tileSize.x, size.y * tileSize.y)
    }

    setTileCollisionLayer(layerIndex: number) {
        const layer = this.layers[layerIndex]
        if (layer) {
            this.tileCollision =
                layer?.data?.map((id): number => {
                    const t = id && this.getTileObject(id)
                    return t && t.isSolid() ? 1 : 0
                }) || []
        }
    }

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

    createLayers(layers: (Constructable<Layer> | TMXLayer)[]) {
        this.layers = []
        layers.forEach(l => this.addLayer(l))
    }

    addLayer(l: Constructable<Layer> | TMXLayer) {
        if (typeof l === 'function') {
            this.layers.push(new l(null, this.game))
        } else {
            this.layers.push(new Layer(l, this.game))
            l.objects && l.objects.forEach(obj => this.addObject(obj.type, { ...obj, layerId: l.id }))
        }
    }

    addObject(type: string, props: Record<string, any>, index?: number) {
        const Model: Constructable<Entity> = this.game.objectClasses[type]
        const entity: Entity = Model ? new Model(props, this, this.game) : new Entity(props, this, this.game)
        if (entity.image) {
            entity.addSprite(this.createSprite(entity.image, entity.size))
        } else if (entity.gid) {
            entity.addSprite(this.tiles[entity.gid])
        }
        entity.init()
        index !== undefined ? this.objects.splice(index, 0, entity) : this.objects.push(entity)
        return entity
    }

    removeObject(obj: Entity) {
        this.objects.splice(this.objects.indexOf(obj), 1)
    }

    addTileset(tileset: TMXTileset, source: string) {
        const newTileset = { ...tileset, image: { ...tileset.image, source } }
        for (let i = 0; i < newTileset.tilecount; i++) {
            this.tiles[i + newTileset.firstgid] = new Tile(i + newTileset.firstgid, newTileset, this.game)
        }
    }

    createTilesets(tilesets: TMXTileset[]) {
        tilesets.map((tileset: TMXTileset) => {
            const asset = getFilename(tileset.image.source)
            if (Object.keys(this.game.assets).includes(asset)) {
                this.addTileset(tileset, asset)
            }
        })
    }

    setTileCollisionData(pos: Vector, data = 0) {
        pos.inRange(this.size) && (this.tileCollision[((pos.y | 0) * this.size.x + pos.x) | 0] = data)
    }

    getTileCollisionData(pos: Vector) {
        return pos.inRange(this.size) ? this.tileCollision[((pos.y | 0) * this.size.x + pos.x) | 0] : 0
    }

    getGridPos(pos: Vector) {
        return vec2(Math.ceil(pos.x / this.tileSize.x) | 0, Math.ceil(pos.y / this.tileSize.y) | 0)
    }

    // @todo: rename
    getRectGridPos(entity: Entity) {
        return box(
            entity.pos.x / this.tileSize.x,
            entity.pos.y / this.tileSize.y,
            entity.size.x / this.tileSize.x,
            entity.size.y / this.tileSize.y
        )
    }

    // @todo: rename
    getRectWorldPos(entity: Entity) {
        const { tileSize } = this
        return box(
            Math.round(entity.pos.x * tileSize.x - (entity.size.x * tileSize.x) / 2),
            Math.round(entity.pos.y * tileSize.y - (entity.size.y * tileSize.y) / 2),
            Math.round(entity.size.x * tileSize.x),
            Math.round(entity.size.y * tileSize.y)
        )
    }

    createSprite(id: string, size: Vector) {
        return new Sprite(id, size, this.game)
    }

    getLayer(id: number) {
        return this.layers.find(layer => layer.id === id) || ({} as Layer)
    }

    getObjects() {
        return this.objects
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

    forEachVisibleObject(cb: (obj: Entity) => void = noop) {
        for (const obj of this.objects) {
            obj.visible && cb(obj)
        }
    }

    forEachVisibleTile(layer: Layer, fn: (tile: Tile, pos: Vector, flips?: TMXFlips) => void = noop) {
        const { camera, tileSize } = this
        const { resolution } = this.camera

        let y = Math.floor(camera.pos.y % tileSize.y)
        let _y = Math.floor(-camera.pos.y / tileSize.y)

        while (y <= resolution.y) {
            let x = Math.floor(camera.pos.x % tileSize.x)
            let _x = Math.floor(-camera.pos.x / tileSize.x)
            while (x <= resolution.x) {
                const tileId = layer?.get(vec2(_x, _y))
                tileId && fn(this.getTileObject(tileId), vec2(x, y), getFlips(tileId))
                x += tileSize.x
                _x++
            }
            y += tileSize.y
            _y++
        }
    }

    displayDebug() {
        const { x, y } = this.camera.pos
        this.game.draw.fillText(`Camera: ${Math.floor(x)},${Math.floor(y)}`, 4, 4, COLORS.WHITE)
    }
}
