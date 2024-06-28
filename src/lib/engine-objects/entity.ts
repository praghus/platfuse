import { Animation, Drawable } from '../../types'
import { Box, Color, Vector, box, vec2, randVector } from '../engine-helpers'
import { DefaultColors } from '../constants'
import { clamp, lerp } from '../utils/helpers'
import { Scene } from './scene'

export class Entity {
    id: number
    pos = vec2()
    lastPos = vec2()
    size = vec2()
    force = vec2()
    type: string
    color?: Color
    gid?: number
    name?: string
    image?: string
    flipH = false
    flipV = false
    tmxRect: Box | null // Rectangle from Tiled map
    animation?: Animation
    properties: Record<string, any>

    solid = true
    visible = true
    active = true
    dead = false
    collideTiles = true
    collideObjects = true
    groundObject: Entity | boolean = false

    mass = 1 // How heavy the object is, static if 0
    damping = 0.9 // How much to slow down force each frame (0-1)
    elasticity = 0 //  How bouncy the object is when colliding (0-1)
    friction = 0.8 // How much friction to apply when sliding (0-1)
    gravityScale = 1 // How much to scale gravity by for this object
    angleVelocity = 0 // Angular force of the object
    angleDamping = 0.9 // How much to slow down rotation each frame (0-1)
    angle = 0 // @todo: implement rotation
    maxSpeed = 1
    renderOrder = 0

    #sprite?: Drawable

    constructor(
        public scene: Scene,
        obj: Record<string, any>
    ) {
        this.id = obj.id
        this.gid = obj.gid
        this.type = obj.type
        this.name = obj.name
        this.tmxRect = obj.x && obj.y ? box(obj.x, obj.y, obj.width, obj.height) : null
        this.properties = obj.properties
        this.angle = obj.rotation
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

    /**
     * Applies a force to the entity (affected by mass)
     *
     * @param force - The force to be applied.
     */
    applyForce(force: Vector) {
        if (this.mass) this.force = this.force.add(force.scale(1 / this.mass))
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collideWithTile(tileId: number, pos: Vector) {
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
            const { debug, game } = this.scene
            const rect = this.scene.getScreenPosRect(this).move(this.scene.camera.pos)
            if (this.#sprite) {
                this.#sprite.draw(rect.pos, this.flipH, this.flipV)
            } else if (this.color) {
                game.draw.fillRect(rect, this.color)
            }
            if (debug) this.displayDebug()
        }
    }

    addSprite(sprite: Drawable) {
        this.#sprite = sprite
    }

    animate() {
        if (this.animation && this.#sprite && this.#sprite.animate) {
            this.#sprite.animate(this.animation)
        }
    }

    /**
     * Sets the animation for the entity.
     * @param animation - The animation to set.
     * @param flipH - (Optional) Whether to flip the animation horizontally. Default is false.
     * @param flipV - (Optional) Whether to flip the animation vertically. Default is false.
     */
    setAnimation(animation: Animation, flipH = false, flipV = false) {
        if (this.#sprite && this.#sprite.animate) {
            this.flipH = flipH
            this.flipV = flipV
            this.animation = animation
        }
    }

    /**
     * Gets the current animation frame of the entity.
     * If the sprite is defined, it returns the animation frame of the sprite.
     * Otherwise, it returns 0.
     *
     * @returns The current animation frame.
     */
    getAnimationFrame() {
        return this.#sprite?.animFrame || 0
    }

    /**
     * Sets the animation frame for the entity's sprite.
     * @param frame - The frame number to set.
     */
    setAnimationFrame(frame: number) {
        if (this.#sprite) this.#sprite.animFrame = frame
    }

    /**
     * Returns the translated position rectangle of the entity.
     * The translated position rectangle is calculated based on the entity's position in the scene.
     * @returns The translated position rectangle of the entity.
     */
    getTranslatedPositionRect() {
        return this.scene.getScreenPosRect(this)
    }

    /**
     * Checks if the entity is overlapping with a given position and size.
     * @param pos - The position vector of the other object.
     * @param size - The size vector of the other object.
     * @returns True if the entity is overlapping with the other object, false otherwise.
     */
    isOverlapping(pos: Vector, size: Vector) {
        return (
            Math.abs(this.pos.x - pos.x) * 2 < this.size.x + size.x &&
            Math.abs(this.pos.y - pos.y) * 2 < this.size.y + size.y
        )
    }

    /**
     * Updates the entity's position, velocity, and handles collisions with other objects and tiles.
     * This method applies physics, friction, and collision resolution to the entity.
     */
    update() {
        const { scene } = this

        this.force.x = clamp(this.force.x, -this.maxSpeed, this.maxSpeed)
        this.force.y = clamp(this.force.y, -this.maxSpeed, this.maxSpeed)

        if (!this.mass) return

        this.lastPos = this.pos.copy()
        this.force.y += scene.gravity * this.gravityScale
        this.pos.x += this.force.x *= this.damping
        this.pos.y += this.force.y *= this.damping
        this.angle += this.angleVelocity *= this.angleDamping

        const wasMovingDown = this.force.y >= 0

        if (this.groundObject) {
            const groundSpeed = this.groundObject instanceof Entity ? this.groundObject.force.x : 0
            this.force.x = groundSpeed + (this.force.x - groundSpeed) * this.friction
            this.groundObject = false
        }

        if (this.collideTiles) {
            if (scene.tileCollisionTest(this.pos, this.size, this)) {
                if (!scene.tileCollisionTest(this.lastPos, this.size, this)) {
                    const isBlockedY = scene.tileCollisionTest(vec2(this.lastPos.x, this.pos.y), this.size, this)
                    const isBlockedX = scene.tileCollisionTest(vec2(this.pos.x, this.lastPos.y), this.size, this)
                    if (isBlockedY || !isBlockedX) {
                        this.groundObject = wasMovingDown
                        this.force.y *= -this.elasticity
                        const o = ((this.lastPos.y - this.size.y / 2) | 0) - (this.lastPos.y - this.size.y / 2)
                        if (o < 0 && o > this.damping * this.force.y + scene.gravity * this.gravityScale)
                            this.force.y = this.damping ? (o - scene.gravity * this.gravityScale) / this.damping : 0
                        this.pos.y = this.lastPos.y
                    }
                    if (isBlockedX) {
                        this.pos.x = this.lastPos.x
                        this.force.x *= -this.elasticity
                    }
                }
            }
        }

        if (this.collideObjects) {
            const epsilon = 0.001 // necessary to push slightly outside of the collision
            const collidingObjects = scene.objects.filter(o => o.visible && o.collideObjects)
            for (const o of collidingObjects) {
                if ((!this.solid && !o.solid) || o.dead || o == this) continue

                // @todo: change to use bounding box
                if (!o.isOverlapping(this.pos, this.size)) continue

                const collide1 = this.collideWithObject(o)
                const collide2 = o.collideWithObject(this)
                if (!collide1 || !collide2) continue

                if (o.isOverlapping(this.lastPos, this.size)) {
                    // if already was touching, try to push away
                    const deltaPos = this.lastPos.subtract(o.pos)
                    const length = deltaPos.length()
                    const pushAwayAccel = 0.001 // push away if already overlapping
                    const force = length < 0.01 ? randVector(pushAwayAccel) : deltaPos.scale(pushAwayAccel / length)
                    this.force = this.force.add(force)
                    if (o.mass) o.force = o.force.subtract(force)
                    continue
                }

                const sizeBoth = this.size.add(o.size)
                const smallStepUp = (this.lastPos.y - o.pos.y) * 2 > sizeBoth.y + scene.gravity
                const isBlockedX = Math.abs(this.lastPos.y - o.pos.y) * 2 < sizeBoth.y
                const isBlockedY = Math.abs(this.lastPos.x - o.pos.x) * 2 < sizeBoth.x
                const elasticity = Math.max(this.elasticity, o.elasticity)

                if (smallStepUp || isBlockedY || !isBlockedX) {
                    this.pos.y = o.pos.y + (sizeBoth.y / 2 + epsilon) * Math.sign(this.lastPos.y - o.pos.y)
                    if ((o.groundObject && wasMovingDown) || !o.mass) {
                        if (wasMovingDown) this.groundObject = o
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
                    this.pos.x = o.pos.x + (sizeBoth.x / 2 + epsilon) * Math.sign(this.lastPos.x - o.pos.x)
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
            }
        }

        this.animate()
    }

    /**
     * Checks if the entity is currently on the screen.
     * @returns {boolean} True if the entity is on the screen, false otherwise.
     */
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

    displayDebug() {
        const { game, camera } = this.scene
        const { draw } = game
        const { type, visible, force, pos } = this
        const { Cyan, LightGreen, Red, White } = DefaultColors

        const fontSize = 1.2 / camera.scale
        const rect = this.getTranslatedPositionRect().move(camera.pos)
        const {
            pos: { x, y },
            size
        } = rect

        draw.outline(rect, visible ? LightGreen : Cyan, 0.5)

        draw.text(`${type}`, x + size.x / 2, y - 5, White, fontSize, 'center')
        draw.text(`x:${pos.x.toFixed(1)}`, x + size.x / 2 - size.x / 2 - 2, y, White, fontSize, 'right')
        draw.text(`y:${pos.y.toFixed(1)}`, x + size.x / 2 - size.x / 2 - 2, y + 5, White, fontSize, 'right')

        Math.abs(force.x) > 0.012 &&
            draw.text(`x:${force.x.toFixed(3)}`, x + size.x / 2 + size.x / 2 + 2, y, Red, fontSize, 'left')
        Math.abs(force.y) > 0.012 &&
            draw.text(`y:${force.y.toFixed(3)}`, x + size.x / 2 + size.x / 2 + 2, y + 5, Red, fontSize, 'left')
    }
}
