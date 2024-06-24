import { Box, Vector, vec2, clamp, box, lerp, randVector, isOverlapping } from './utils/math'
import { Animation, Drawable, TMXFlips } from '../types'
import { COLORS } from './utils/constants'
import { uuid, noop } from './utils/helpers'
import { Game } from './game'
import { Scene } from './scene'

export class Entity {
    id: string
    pos = vec2()
    size = vec2()
    force = vec2()
    // shape = SHAPE.BOX
    type: string
    color?: string
    gid?: number
    name?: string
    image?: string
    redius?: number
    flips?: TMXFlips
    rotatation?: number
    animation?: Animation
    properties: Record<string, any>

    solid = true
    visible = true
    active = true
    dead = false

    tmxRect: Box | null

    collideTiles = true
    collideObjects = true
    collideSolidObjects = true
    groundObject: Entity | boolean = false
    maxSpeed = 1

    mass = 1 // How heavy the object is, static if 0
    damping = 0.9 // How much to slow down force each frame (0-1)
    elasticity = 0 //  How bouncy the object is when colliding (0-1)
    friction = 0.8 // How much friction to apply when sliding (0-1)
    gravityScale = 1 // How much to scale gravity by for this object
    angleVelocity = 0 // Angular force of the object
    angleDamping = 0.9 // How much to slow down rotation each frame (0-1)
    angle = 0

    c: Vector[] = []

    #sprite?: Drawable

    constructor(
        obj: Record<string, any>,
        public scene: Scene,
        public game: Game
    ) {
        this.id = (obj.id && `${obj.id}`) || uuid()
        this.gid = obj.gid
        this.type = obj.type
        this.name = obj.name
        this.tmxRect = obj.x && obj.y ? box(obj.x, obj.y, obj.width, obj.height) : null
        this.properties = obj.properties
        this.rotatation = obj.rotation
        this.visible = obj.visible !== undefined ? obj.visible : true
    }

    init() {
        const { tileSize } = this.scene
        if (this.tmxRect) {
            this.size = vec2(this.tmxRect.size.x / tileSize.x, this.tmxRect.size.y / tileSize.y)
            this.pos = vec2(
                this.tmxRect.pos.x / tileSize.x + this.size.x / 2,
                this.tmxRect.pos.y / tileSize.y + this.size.y / 2 - (this.gid ? this.size.y : 0)
            )
        }
    }

    destroy() {
        this.dead = true
    }

    collideWithTile(tileId: number, pos: Vector) {
        if (tileId > 0 && this.scene.debug) {
            this.c.push(pos)
        }
        return tileId > 0
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collideWithObject(entity: Entity) {
        return 1
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collideWithTileRaycast(tileData: number, pos: Vector) {
        return tileData > 0
    }

    draw() {
        if (this.visible && this.onScreen()) {
            const { draw } = this.game
            const { debug } = this.scene
            const rect = this.scene.getRectWorldPos(this)
            if (this.#sprite) {
                this.#sprite.draw(rect.pos.add(this.scene.camera.pos), this.flips)
            } else if (this.color) {
                draw.fillRect(rect, this.color)
            }
            if (debug) this.displayDebug()
        }
    }

    addSprite(sprite: Drawable) {
        this.#sprite = sprite
    }

    animate(animation = this.animation, flips?: TMXFlips, cb: (frame: number) => void = noop) {
        if (this.#sprite && this.#sprite.animate) {
            this.flips = flips
            this.#sprite.animate(animation)
            cb(this.#sprite.animFrame)
        }
        this.animation = animation
    }

    getAnimationFrame() {
        return this.#sprite?.animFrame || 0
    }

    setAnimationFrame(frame: number) {
        if (this.#sprite) this.#sprite.animFrame = frame
    }

    getTranslatedPositionRect() {
        return this.scene.getRectWorldPos(this)
    }

    update() {
        const { scene } = this

        const engineObjectsCollide = scene.objects.filter(o => o.collideSolidObjects)

        // limit max speed to prevent missing collisions
        this.force.x = clamp(this.force.x, -this.maxSpeed, this.maxSpeed)
        this.force.y = clamp(this.force.y, -this.maxSpeed, this.maxSpeed)

        // do not update collision for fixed objects
        if (!this.mass) return

        // apply physics
        const oldPos = this.pos.copy()
        this.force.y += scene.gravity * this.gravityScale
        this.pos.x += this.force.x *= this.damping
        this.pos.y += this.force.y *= this.damping
        this.angle += this.angleVelocity *= this.angleDamping

        const wasMovingDown = this.force.y < 0

        if (this.groundObject) {
            // apply friction in local space of ground object
            const groundSpeed = 0 //this.groundObject.force ? this.groundObject.force.x : 0;
            this.force.x = groundSpeed + (this.force.x - groundSpeed) * this.friction
            this.groundObject = false
        }

        if (this.collideSolidObjects) {
            // check collisions against solid objects
            const epsilon = 0.001 // necessary to push slightly outside of the collision
            for (const o of engineObjectsCollide) {
                // non solid objects don't collide with eachother
                if ((!this.solid && !o.solid) || o.dead || o == this) continue

                // check collision
                if (!isOverlapping(this.pos, this.size, o.pos, o.size)) continue

                // notify objects of collision and check if should be resolved
                const collide1 = this.collideWithObject(o)
                const collide2 = o.collideWithObject(this)
                if (!collide1 || !collide2) continue

                if (isOverlapping(oldPos, this.size, o.pos, o.size)) {
                    // if already was touching, try to push away
                    const deltaPos = oldPos.subtract(o.pos)
                    const length = deltaPos.length()
                    const pushAwayAccel = 0.001 // push away if already overlapping
                    const force = length < 0.01 ? randVector(pushAwayAccel) : deltaPos.scale(pushAwayAccel / length)
                    this.force = this.force.add(force)
                    if (o.mass)
                        // push away if not fixed
                        o.force = o.force.subtract(force)

                    // debugOverlay && debugPhysics && debugAABB(this.pos, this.size, o.pos, o.size, '#f00')
                    continue
                }

                // check for collision
                const sizeBoth = this.size.add(o.size)
                const smallStepUp = (oldPos.y - o.pos.y) * 2 > sizeBoth.y + scene.gravity // prefer to push up if small delta
                const isBlockedX = Math.abs(oldPos.y - o.pos.y) * 2 < sizeBoth.y
                const isBlockedY = Math.abs(oldPos.x - o.pos.x) * 2 < sizeBoth.x
                const elasticity = Math.max(this.elasticity, o.elasticity)

                if (smallStepUp || isBlockedY || !isBlockedX) {
                    // resolve y collision
                    // push outside object collision
                    this.pos.y = o.pos.y + (sizeBoth.y / 2 + epsilon) * Math.sign(oldPos.y - o.pos.y)
                    if ((o.groundObject && wasMovingDown) || !o.mass) {
                        // set ground object if landed on something
                        if (wasMovingDown) this.groundObject = o

                        // bounce if other object is fixed or grounded
                        this.force.y *= -elasticity
                    } else if (o.mass) {
                        // inelastic collision
                        const inelastic = (this.mass * this.force.y + o.mass * o.force.y) / (this.mass + o.mass)

                        // elastic collision
                        const elastic0 =
                            (this.force.y * (this.mass - o.mass)) / (this.mass + o.mass) +
                            (o.force.y * 2 * o.mass) / (this.mass + o.mass)
                        const elastic1 =
                            (o.force.y * (o.mass - this.mass)) / (this.mass + o.mass) +
                            (this.force.y * 2 * this.mass) / (this.mass + o.mass)

                        // lerp betwen elastic or inelastic based on elasticity
                        this.force.y = lerp(elasticity, inelastic, elastic0)
                        o.force.y = lerp(elasticity, inelastic, elastic1)
                    }
                }
                if (!smallStepUp && isBlockedX) {
                    // resolve x collision
                    // push outside collision
                    this.pos.x = o.pos.x + (sizeBoth.x / 2 + epsilon) * Math.sign(oldPos.x - o.pos.x)
                    if (o.mass) {
                        // inelastic collision
                        const inelastic = (this.mass * this.force.x + o.mass * o.force.x) / (this.mass + o.mass)

                        // elastic collision
                        const elastic0 =
                            (this.force.x * (this.mass - o.mass)) / (this.mass + o.mass) +
                            (o.force.x * 2 * o.mass) / (this.mass + o.mass)
                        const elastic1 =
                            (o.force.x * (o.mass - this.mass)) / (this.mass + o.mass) +
                            (this.force.x * 2 * this.mass) / (this.mass + o.mass)

                        // lerp betwen elastic or inelastic based on elasticity
                        this.force.x = lerp(elasticity, inelastic, elastic0)
                        o.force.x = lerp(elasticity, inelastic, elastic1)
                    } // bounce if other object is fixed
                    else this.force.x *= -elasticity
                }
                // debugOverlay && debugPhysics && debugAABB(this.pos, this.size, o.pos, o.size, '#f0f');
            }
        }

        if (this.collideTiles) {
            // check collision against tiles
            if (scene.tileCollisionTest(this.pos, this.size, this)) {
                // if already was stuck in collision, don't do anything
                // this should not happen unless something starts in collision
                if (!scene.tileCollisionTest(oldPos, this.size, this)) {
                    // test which side we bounced off (or both if a corner)
                    const isBlockedY = scene.tileCollisionTest(vec2(oldPos.x, this.pos.y), this.size, this)
                    const isBlockedX = scene.tileCollisionTest(vec2(this.pos.x, oldPos.y), this.size, this)
                    if (isBlockedY || !isBlockedX) {
                        this.groundObject = wasMovingDown // set if landed on ground
                        this.force.y *= -this.elasticity // bounce force

                        // adjust next force to settle on ground
                        const o = ((oldPos.y - this.size.y / 2) | 0) - (oldPos.y - this.size.y / 2)
                        if (o < 0 && o > this.damping * this.force.y + scene.gravity * this.gravityScale)
                            this.force.y = this.damping ? (o - scene.gravity * this.gravityScale) / this.damping : 0

                        // move to previous position
                        this.pos.y = oldPos.y
                    }
                    if (isBlockedX) {
                        // move to previous position and bounce
                        this.pos.x = oldPos.x
                        this.force.x *= -this.elasticity
                    }
                }
            }
        }
        this.animate()
    }

    onScreen() {
        const scene = this.scene
        const { camera, tileSize } = scene
        const { pos, size } = this.getTranslatedPositionRect()
        const { x, y } = camera.resolution
        const cx = this.pos.x + pos.x
        const cy = this.pos.y + pos.y
        return (
            cx + size.x + tileSize.x > -camera.pos.x &&
            cy + size.y + tileSize.y > -camera.pos.y &&
            cx - tileSize.x < -camera.pos.x + x &&
            cy - tileSize.y < -camera.pos.y + y
        )
    }

    // onGround = () => this.pos.y < this.expectedPos.y
    // onCeiling = () => this.pos.y > this.expectedPos.y
    // onRightWall = () => this.pos.x < this.expectedPos.x
    // onLeftWall = () => this.pos.x > this.expectedPos.x

    displayDebug() {
        const scene = this.scene
        const { draw } = this.game
        const { type, visible } = this

        const rect = this.getTranslatedPositionRect().move(scene.camera.pos)

        draw.outline(rect, visible ? COLORS.PURPLE : COLORS.WHITE_50, 0.5)
        draw.fillText(`${type}`, rect.pos.x, rect.pos.y - 10, COLORS.WHITE)
        draw.fillText(`x:${this.pos.x.toFixed(1)}`, rect.pos.x, rect.pos.y - 5, COLORS.WHITE)
        draw.fillText(`y:${this.pos.y.toFixed(1)}`, rect.pos.x, rect.pos.y, COLORS.WHITE)

        // force.x !== 0 && draw.fillText(`${force.x.toFixed(2)}`, x, y - 2, COLORS.LIGHT_RED)
        // force.y !== 0 && draw.fillText(`${force.y.toFixed(2)}`, x, y + 2, COLORS.LIGHT_RED)

        if (this.type === 'player' && this.c.length > 0) {
            this.c.forEach(pos => {
                const pp = vec2(pos.x * scene.tileSize.x, pos.y * scene.tileSize.y).add(this.scene.camera.pos)
                draw.outline(new Box(pp, scene.tileSize), '#f00')
            })
        }

        this.c = []
    }
}
