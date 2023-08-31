import { boxOverlap, Box, Vector } from './utils/math'
import { Animation, Drawable, TMXFlips } from '../types'
import { COLORS, NODE_TYPE, SHAPE } from './utils/constants'
import { isValidArray, uuid, noop } from './utils/helpers'
import { Game } from './game'

export class Entity {
    id: string
    width = 0
    height = 0
    pos = new Vector()
    expectedPos = new Vector()
    initialPos = new Vector()
    force = new Vector()
    shape = SHAPE.BOX
    layerId: number
    type: string
    color?: string
    gid?: number
    family?: string
    image?: string
    bounds?: Box
    redius?: number
    flips?: TMXFlips
    rotatation?: number
    animation?: Animation
    properties: Record<string, any>
    collisionLayers: number[] = []
    collisions = false
    solid = false
    visible = true
    active = true
    dead = false
    #sprite?: Drawable

    constructor(obj: Record<string, any>, public game: Game) {
        this.id = (obj.id && `${obj.id}`) || uuid()
        this.gid = obj.gid
        this.pos = new Vector(obj.x, obj.y - (obj.gid ? obj.height : 0))
        this.color = obj.color
        this.type = obj.type
        this.width = obj.width || this.width
        this.height = obj.height || this.height
        this.properties = obj.properties
        this.rotatation = obj.rotation
        this.layerId = obj.layerId
        this.visible = obj.visible !== undefined ? obj.visible : true
        this.initialPos = this.pos.clone()
    }

    collide(obj: Entity) {} // eslint-disable-line @typescript-eslint/no-unused-vars

    setCollisionArea(...args: number[]) {
        if (args.length === 4) {
            const [x, y, w, h] = args
            this.bounds = new Box(new Vector(x, y), w, h)
        } else {
            this.bounds = new Box(new Vector(), this.width, this.height)
        }
    }

    getCollisionArea() {
        return this.bounds || new Box(new Vector(), this.width, this.height)
    }

    getBoundingBox(nextX = this.pos.x, nextY = this.pos.y) {
        if (this.bounds) {
            const { pos, w, h } = this.bounds
            return new Box(new Vector(pos.x + nextX, pos.y + nextY), w, h)
        } else return new Box(new Vector(nextX, nextY), this.width, this.height)
    }

    draw() {
        if (this.visible && this.onScreen()) {
            const { ctx } = this.game
            const { camera, debug } = this.game.getCurrentScene()
            const pos = new Vector(Math.floor(this.pos.x + camera.pos.x), Math.floor(this.pos.y + camera.pos.y))
            if (this.#sprite) {
                this.#sprite.draw(pos, this.flips)
            } else if (this.color) {
                ctx.save()
                ctx.fillStyle = this.color
                ctx.beginPath()
                ctx.rect(this.pos.x + camera.pos.x, this.pos.y + camera.pos.y, this.width, this.height)
                ctx.fill()
                ctx.closePath()
                ctx.restore()
            }
            if (debug) this.displayDebug()
        }
    }

    addSprite(sprite: Drawable) {
        this.#sprite = sprite
    }

    animate(animation: Animation, flips?: TMXFlips, cb: (frame: number) => void = noop) {
        if (this.#sprite && this.#sprite.animate) {
            this.flips = flips
            this.#sprite.animate(animation)
            cb(this.#sprite.animFrame)
        }
        if (animation !== this.animation && animation.bounds && isValidArray(animation.bounds)) {
            this.setCollisionArea(...animation.bounds)
        }
        this.animation = animation
    }

    getAnimationFrame() {
        return this.#sprite?.animFrame || 0
    }

    setAnimationFrame(frame: number) {
        if (this.#sprite) this.#sprite.animFrame = frame
    }

    kill() {
        this.dead = true
    }

    show() {
        this.visible = true
    }

    hide() {
        this.visible = false
    }

    approach(start: number, end: number, shift: number, delta = 1) {
        return start < end ? Math.min(start + shift * delta, end * delta) : Math.max(start - shift * delta, end * delta)
    }

    update() {
        this.move()
    }

    move(nextPos = this.force) {
        this.expectedPos = new Vector(this.pos.x + nextPos.x, this.pos.y + nextPos.y) // this.pos.add(nextPos)
        if (this.collisions) {
            const scene = this.game.getCurrentScene()
            const b = this.getCollisionArea()
            const cb = scene.camera.getBounds()
            const { tilewidth, tileheight } = scene

            if (this.expectedPos.x + b.pos.x <= cb.pos.x || this.expectedPos.x + b.pos.x + b.w >= cb.pos.x + cb.w)
                nextPos.x = 0
            if (this.expectedPos.y + b.pos.y <= cb.pos.y || this.expectedPos.y + b.pos.y + b.h >= cb.pos.y + cb.h)
                nextPos.y = 0

            const offsetX = this.pos.x + b.pos.x
            const offsetY = this.pos.y + b.pos.y
            const PX = Math.ceil((this.expectedPos.x + b.pos.x) / tilewidth) - 1
            const PY = Math.ceil((this.expectedPos.y + b.pos.y) / tileheight) - 1
            const PW = Math.ceil((this.expectedPos.x + b.pos.x + b.w) / tilewidth)
            const PH = Math.ceil((this.expectedPos.y + b.pos.y + b.h) / tileheight)
            const nextX = this.getBoundingBox(this.expectedPos.x, this.pos.y)
            const nextY = this.getBoundingBox(this.pos.x, this.expectedPos.y)

            if (isValidArray(this.collisionLayers)) {
                for (const layerId of this.collisionLayers) {
                    const layer = scene.getLayer(layerId)
                    switch (layer.type) {
                        case NODE_TYPE.LAYER:
                            for (let y = PY; y < PH; y++) {
                                for (let x = PX; x < PW; x++) {
                                    const tile = scene.getTile(x, y, layer.id)
                                    if (tile && tile.isSolid()) {
                                        const tb = tile.getBounds(x, y)
                                        if (boxOverlap(tb, nextX) && Math.abs(nextPos.x) > 0 && !tile.isOneWay()) {
                                            nextPos.x =
                                                nextPos.x < 0
                                                    ? tb.pos.x + tile.width - offsetX
                                                    : tb.pos.x - b.w - offsetX
                                        }
                                        if (boxOverlap(tb, nextY)) {
                                            if (!tile.isOneWay() && Math.abs(nextPos.y) > 0) {
                                                nextPos.y =
                                                    nextPos.y < 0
                                                        ? tb.pos.y + tile.height - offsetY
                                                        : tb.pos.y - b.h - offsetY
                                            } else if (
                                                nextPos.y >= 0 &&
                                                tile.isOneWay() &&
                                                this.pos.y + b.pos.y + b.h <= tb.pos.y
                                            ) {
                                                nextPos.y = tb.pos.y - b.h - offsetY
                                            }
                                        }
                                    }
                                }
                            }
                            break
                        case NODE_TYPE.OBJECT_GROUP:
                            scene.objects.forEach(obj => {
                                const ob = obj.getBoundingBox(obj.pos.x, obj.pos.y)
                                if (
                                    obj.id !== this.id &&
                                    obj.collisions &&
                                    obj.layerId === layerId &&
                                    obj.collisionLayers.includes(this.layerId)
                                ) {
                                    if (obj.solid) {
                                        if (boxOverlap(ob, nextY) && Math.abs(nextPos.y) > 0) {
                                            nextPos.y =
                                                nextPos.y < 0
                                                    ? ob.pos.y + obj.height - offsetY
                                                    : ob.pos.y - b.h - offsetY
                                        }
                                        if (boxOverlap(ob, nextX) && Math.abs(nextPos.x) > 0) {
                                            nextPos.x =
                                                nextPos.x < 0
                                                    ? ob.pos.x + obj.width - offsetX
                                                    : ob.pos.x - b.w - offsetX
                                        }
                                    }
                                    if (boxOverlap(ob, this.getBoundingBox(this.expectedPos.x, this.expectedPos.y))) {
                                        this.collide(obj)
                                        obj.collide(this)
                                    }
                                }
                            })
                            break
                    }
                }
            }
        }
        this.pos = this.pos.add(nextPos)
    }

    onScreen() {
        const scene = this.game.getCurrentScene()
        const { camera, tilewidth, tileheight } = scene
        const { pos, w, h } = this.getCollisionArea()
        const { x, y } = this.game.resolution
        const cx = this.pos.x + pos.x
        const cy = this.pos.y + pos.y
        return (
            cx + w + tilewidth > -camera.pos.x &&
            cy + h + tileheight > -camera.pos.y &&
            cx - tilewidth < -camera.pos.x + x &&
            cy - tileheight < -camera.pos.y + y
        )
    }

    onGround = () => this.pos.y < this.expectedPos.y
    onCeiling = () => this.pos.y > this.expectedPos.y
    onRightWall = () => this.pos.x < this.expectedPos.x
    onLeftWall = () => this.pos.x > this.expectedPos.x

    displayDebug() {
        const { draw } = this.game
        const { camera } = this.game.getCurrentScene()
        const { width, height, type, visible, force } = this
        const [posX, posY] = [Math.floor(this.pos.x + camera.pos.x), Math.floor(this.pos.y + camera.pos.y)]
        const [x, y] = [posX + width + 4, posY + height / 2]
        draw.outline(new Box(new Vector(posX, posY), width, height), visible ? COLORS.WHITE_50 : COLORS.PURPLE, 0.25)
        draw.outline(this.getBoundingBox(posX, posY), visible ? COLORS.GREEN : COLORS.PURPLE, 0.5)
        draw.fillText(`${type}`, posX, posY - 10, COLORS.WHITE)
        draw.fillText(`x:${Math.floor(this.pos.x)}`, posX, posY - 6, COLORS.LIGHT_RED)
        draw.fillText(`y:${Math.floor(this.pos.y)}`, posX, posY - 2, COLORS.LIGHT_RED)
        force.x !== 0 && draw.fillText(`${force.x.toFixed(2)}`, x, y - 2, COLORS.LIGHT_RED)
        force.y !== 0 && draw.fillText(`${force.y.toFixed(2)}`, x, y + 2, COLORS.LIGHT_RED)
    }
}
