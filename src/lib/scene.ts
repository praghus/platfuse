import { Constructable, StringTMap, TMXTileset, TMXLayer, TMXFlips } from '../types'
import { isValidArray, getFlips, noop } from './utils/helpers'
import { Vec2 } from './utils/math'
import { Game } from './game'
import { Camera } from './camera'
import { Entity } from './entity'
import { Layer } from './layer'
import { Sprite } from './sprite'
import { Tile } from './tile'
import { COLORS, FLIPPED } from './utils/constants'

export class Scene {
    game: Game
    camera: Camera
    entities: StringTMap<any> = {}
    layers: Layer[] = []
    tiles: StringTMap<Tile> = {}
    objects: Entity[] = []
    tilewidth = 0
    tileheight = 0
    width = 0
    height = 0
    debug = false

    constructor(game: Game) {
        this.game = game
        this.camera = new Camera(game)
        if (game.debug && game.gui) {
            game.gui.add(this, 'debug').listen()
        }
    }

    async init(): Promise<void> {}

    update(): void {
        for (const layer of this.layers) {
            layer instanceof Layer && layer.update()
        }
        for (const obj of this.objects) {
            if (obj.active) {
                obj.update()
                obj.dead && this.removeObject(obj)
            }
        }
        this.camera.update()
    }

    draw(): void {
        const { ctx, colors, draw, width, height, scale } = this.game
        ctx.imageSmoothingEnabled = false
        ctx.save()
        ctx.scale(scale, scale)
        ctx.clearRect(0, 0, width / scale, height / scale)
        if (colors.backgroundColor) {
            ctx.fillStyle = colors.backgroundColor
            ctx.fillRect(0, 0, width / scale, height / scale)
        }
        for (const layer of this.layers) {
            layer instanceof Layer && layer.draw()
        }
        if (this.debug) {
            draw.fillText('CAMERA', 4, 8, COLORS.WHITE)
            draw.fillText(`x:${Math.floor(this.camera.pos.x)}`, 4, 12, COLORS.LIGHT_RED)
            draw.fillText(`y:${Math.floor(this.camera.pos.y)}`, 4, 16, COLORS.LIGHT_RED)
        }
        ctx.restore()
    }

    setDimensions(width: number, height: number, tilewidth: number, tileheight: number): void {
        this.tilewidth = tilewidth
        this.tileheight = tileheight
        this.width = width
        this.height = height
        this.camera.setBounds(0, 0, width * tilewidth, height * tileheight)
    }

    createLayers(layers: (Constructable<Layer> | TMXLayer)[]): void {
        this.layers = []
        layers.forEach(l => this.addLayer(l))
    }

    addLayer(l: Constructable<Layer> | TMXLayer): void {
        if (typeof l === 'function') {
            this.layers.push(new l(null, this.game))
        } else {
            this.layers.push(new Layer(l, this.game))
            l.objects && l.objects.forEach(obj => this.addObject(obj.type, { ...obj, layerId: l.id }))
        }
    }

    addObject(type: string, props: StringTMap<any>, index?: number): Entity {
        const Model: Constructable<Entity> = this.game.objectClasses[type]
        const entity: Entity = Model ? new Model(props, this.game) : new Entity(props, this.game)
        if (entity.image) {
            entity.addSprite(this.createSprite(entity.image, entity.width, entity.height))
        } else if (entity.gid) {
            entity.addSprite(this.tiles[entity.gid])
        }
        index !== undefined ? this.objects.splice(index, 0, entity) : this.objects.push(entity)
        return entity
    }

    removeObject(obj: Entity): void {
        this.objects.splice(this.objects.indexOf(obj), 1)
    }

    addTileset(tileset: TMXTileset, image: string): void {
        const newTileset = { ...tileset, image }
        for (let i = 0; i < newTileset.tilecount; i++) {
            this.tiles[i + newTileset.firstgid] = new Tile(i + newTileset.firstgid, newTileset, this.game)
        }
    }

    forEachVisibleObject(cb: (obj: Entity) => void = noop, layerId?: number): void {
        for (const obj of this.objects) {
            if ((layerId === undefined || obj.layerId === layerId) && obj.visible) {
                cb(obj)
            }
        }
    }

    forEachVisibleTile(layer: Layer, fn: (tile: Tile, pos: Vec2, flips?: TMXFlips) => void = noop): void {
        const { camera, tilewidth, tileheight } = this
        const { resolution } = this.game

        let y = Math.floor(camera.pos.y % tileheight)
        let _y = Math.floor(-camera.pos.y / tileheight)

        while (y <= resolution.y) {
            let x = Math.floor(camera.pos.x % tilewidth)
            let _x = Math.floor(-camera.pos.x / tilewidth)
            while (x <= resolution.x) {
                const tileId = layer?.get(_x, _y)
                tileId && fn(this.getTileObject(tileId), new Vec2(x, y), getFlips(tileId))
                x += tilewidth
                _x++
            }
            y += tileheight
            _y++
        }
    }

    resize(game: Game): void {
        this.camera && this.camera.resize(game.width, game.height, game.scale)
    }

    createSprite(id: string, width: number, height: number): Sprite {
        return new Sprite(id, width, height, this.game)
    }

    getLayer(id: number): Layer {
        return this.layers.find(layer => layer.id === id) || ({} as Layer)
    }

    getObjects(): Entity[] {
        return this.objects
    }

    getObjectById(id: string): Entity | undefined {
        return this.objects.find(object => object.id === id)
    }

    getObjectByType(type: string): Entity | undefined {
        return this.objects.find(object => object.type === type)
    }

    getObjectsByType(type: string): Entity[] {
        return this.objects.filter(object => object.type === type)
    }

    getObjectLayers(): Layer[] {
        return this.layers.filter((layer: Layer) => isValidArray(layer.objects))
    }

    getObjectGridPos(obj: Entity): Vec2 {
        return new Vec2(Math.round(obj.pos.x / this.tilewidth), Math.round(obj.pos.y / this.tileheight))
    }

    getTile(x: number, y: number, layerId: number): Tile {
        return this.getTileObject(this.getLayer(layerId).get(x, y) || 0)
    }

    getTileObject(id: number): Tile {
        const gid: number = (id &= ~(FLIPPED.HORIZONTALLY | FLIPPED.VERTICALLY | FLIPPED.DIAGONALLY))
        return this.tiles[gid]
    }

    removeLayer(index: number): void {
        this.layers.splice(index, 1)
    }

    showLayer(layerId: number): void {
        this.getLayer(layerId).toggleVisibility(true)
    }

    hideLayer(layerId: number): void {
        this.getLayer(layerId).toggleVisibility(false)
    }
}
