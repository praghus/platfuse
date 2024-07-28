/* eslint-disable @typescript-eslint/no-unused-vars */
import { Animation } from '../../types'
import { box, vec2, randVector } from '../utils/geometry'
import { Box } from '../engine-helpers/box'
import { Color } from '../engine-helpers/color'
import { clamp, deg2rad, lerp } from '../utils/math'
import { Vector } from '../engine-helpers/vector'
import { DefaultColors, Shape } from '../constants'
import { Scene } from './scene'
import { Sprite } from './sprite'

/**
 * The Entity class represents a game object in the scene.
 */
export class Entity {
    /** The ID of the object. */
    id = Date.now()

    /** The type of the object. */
    type?: string

    /** The family of the object. */
    family?: string

    /** The global ID of the object image from TMX map (if any). */
    gid?: number

    /** The time to live of the object in milliseconds. */
    ttl?: number

    /** The name of the object. */
    name?: string

    /** The image of the object (if any). */
    image?: string

    /** The color of the object (if no sprite). */
    color?: Color

    /** The layer ID of the object (if any). */
    layerId?: number

    /** Whether the object is bounded by the scene and cannot move outside. */
    bounded = false

    /** Whether the object is flipped horizontally (mirrored) */
    flipH = false

    /** Whether the object is flipped vertically */
    flipV = false

    /** Whether the object is solid and collides with other objects */
    solid = true

    /** Whether the object is visible and should be drawn */
    visible = true

    /** Whether the object is active and should be updated */
    active = true

    /** Whether the object is dead and should be removed */
    dead = false

    /** Whether the object is static and should not move */
    collideTiles = true

    /** Whether the object collides with other objects */
    collideObjects = true

    /** The object the entity is standing on */
    onGround: Entity | boolean = false

    /** The shape of the entity. */
    shape: Shape = Shape.Rectangle

    /** Current position of the object */
    pos = vec2()

    /** Last position of the object */
    lastPos = vec2()

    /** The size of the object (scaled by tileSize) */
    size = vec2()

    /** The force applied to the object (acceleration) */
    force = vec2()

    /** The object's mass (0 is static) */
    mass = 1

    /** The object's damping (0-1) */
    damping = 1

    /** The object's elasticity (0-1) */
    elasticity = 0

    /** The object's friction (0-1) */
    friction = 0.8

    /** How much gravity affects the object */
    gravityScale = 1

    /** The object's angular velocity */
    angleVelocity = 0

    /** Rotation slowdown (0-1) */
    angleDamping = 1

    /** Rotation angle (in radians) */
    angle = 0

    /** Maximum speed */
    maxSpeed = 1

    /** Time the entity was spawned */
    spawnTime = 0

    /** Render order */
    renderOrder = 0

    /** Custom properties of the object */
    properties: Record<string, any> = {}

    /**
     * The animation of the object sprite.
     * @see {@link Animation}
     */
    animation?: Animation

    /**
     * The sprite of the object.
     * @see {@link Sprite}
     */
    sprite = new Sprite(this)

    /**
     * Creates a new Entity object.
     * @param scene
     * @param obj
     */
    constructor(
        public scene: Scene,
        public obj?: Record<string, any>
    ) {
        if (obj) {
            this.id = obj.id
            this.gid = obj.gid
            this.type = obj.type
            this.name = obj.name
            this.layerId = obj.layerId
            this.properties = obj.properties
            // Translate TMX bounding rect into game grid
            if (obj.x && obj.y) {
                const { tileSize } = scene
                const tmxRect = box(obj.x, obj.y, obj.width, obj.height)
                this.size = vec2(tmxRect.size.x / tileSize.x, tmxRect.size.y / tileSize.y)
                this.pos = vec2(
                    tmxRect.pos.x / tileSize.x + this.size.x / 2,
                    tmxRect.pos.y / tileSize.y + this.size.y / 2 - (this.gid ? this.size.y : 0)
                )
            } else {
                this.size = obj.size || this.size
                this.pos = obj.pos || this.pos
            }
        }
        this.spawnTime = scene.game.time
        this.angle = obj?.rotation ? deg2rad(obj.rotation) : this.angle
        this.visible = obj?.visible !== undefined ? obj.visible : true
        this.force = obj?.force || this.force
        this.flipH = obj?.flipH || this.flipH
        this.flipV = obj?.flipV || this.flipV
        this.animation = obj?.animation || this.animation
        this.family = obj?.family || this.family
        this.shape = obj?.shape || this.shape
    }

    /**
     * Marks the entity as destroyed.
     */
    destroy() {
        this.dead = true
    }

    /**
     * Returns the alive time of the entity.
     * @returns The alive time in milliseconds.
     */
    getAliveTime() {
        return this.scene.game.time - this.spawnTime
    }

    /**
     * Applies a force to the entity (affected by mass)
     * @param force - The force to be applied.
     */
    applyForce(force: Vector) {
        if (this.mass) this.force = this.force.add(force.scale(1 / this.mass))
    }

    /**
     * Checks if the entity collides with a tile.
     * @param tileId - The ID of the tile to check collision with.
     * @param pos - The position of the entity.
     * @returns True if the entity collides with the tile, false otherwise.
     */
    collideWithTile(tileId: number, pos: Vector) {
        return tileId > 0
    }

    /**
     * Checks if the entity collides with a tile using raycasting.
     * @param tileId - The data of the tile to check collision with.
     * @param pos - The position of the entity.
     * @returns True if the entity collides with the tile, false otherwise.
     */
    collideWithTileRaycast(tileId: number, pos: Vector) {
        return tileId > 0
    }

    /**
     * Checks if this entity collides with another entity.
     * @param entity - The entity to check collision with.
     * @returns `true` if a collision occurs, `false` otherwise.
     */
    collideWithObject(entity: Entity) {
        return true
    }

    /**
     * Checks if the entity is currently on the screen.
     * @returns {boolean} True if the entity is on the screen, false otherwise.
     */
    onScreen() {
        return this.scene.getCameraVisibleArea().overlaps(this.pos, this.size)
    }

    /**
     * Draws the entity on the screen if it is visible and within the screen bounds.
     * If the entity has a tile object, it draws the tile object with the specified transformations.
     * Otherwise, it draws the entity's sprite.
     * If the game is in debug mode, it also displays debug information.
     */
    draw() {
        if (this.visible && this.onScreen()) {
            if (this.gid) {
                const tile = this.scene.getTileObject(this.gid)
                const scale = this.size.multiply(this.scene.tileSize).divide(tile.size).scale(this.scene.camera.scale)
                tile.draw(this.scene.getScreenPos(this.pos, this.size), this.flipH, this.flipV, this.angle, scale)
            } else {
                this.sprite.draw()
            }
            if (this.scene.game.debug) this.displayDebug()
        }
    }

    /**
     * Sets the animation for the entity.
     * @param animation - The animation to set.
     * @param flipH - (Optional) Whether to flip the animation horizontally. Default is false.
     * @param flipV - (Optional) Whether to flip the animation vertically. Default is false.
     */
    setAnimation(animation: Animation, flipH = false, flipV = false) {
        this.flipH = flipH
        this.flipV = flipV
        this.animation = animation
    }

    /**
     * Gets the current animation frame of the entity.
     * If the sprite is defined, it returns the animation frame of the sprite.
     * Otherwise, it returns 0.
     *
     * @returns The current animation frame.
     */
    getAnimationFrame() {
        return this.sprite?.animFrame || 0
    }

    /**
     * Sets the animation frame for the entity's sprite.
     * @param frame - The frame number to set.
     */
    setAnimationFrame(frame: number) {
        this.sprite.animFrame = frame
    }

    /**
     * Returns the translated position rectangle of the entity.
     * The translated position rectangle is calculated based on the entity's position in the scene.
     * @returns The translated position rectangle of the entity.
     */
    getTranslatedBoundingRect() {
        return new Box(
            this.scene.getScreenPos(this.pos, this.size),
            this.size.multiply(this.scene.tileSize).scale(this.scene.camera.scale)
        )
    }

    /**
     * Returns the relative bounding rectangle of the entity.
     * The relative bounding rectangle is calculated by translating the entity's bounding rectangle
     * and moving it based on the position of the scene's camera.
     * @returns The relative bounding rectangle of the entity.
     */
    getRelativeBoundingRect() {
        return this.getTranslatedBoundingRect().move(this.scene.camera.pos)
    }

    /**
     * Checks if the entity is overlapping with a given position and size.
     * @param pos - The position vector of the other object.
     * @param size - The size vector of the other object.
     * @returns True if the entity is overlapping with the other object, false otherwise.
     */
    isOverlapping(pos: Vector, size = vec2()) {
        return (
            Math.abs(this.pos.x - pos.x) * 2 < this.size.x + size.x &&
            Math.abs(this.pos.y - pos.y) * 2 < this.size.y + size.y
        )
    }

    /**
     * Updates the entity's position, velocity, and handles collisions with other objects and tiles.
     * This method applies physics, friction, and collision resolution to the entity.
     * It also updates the entity's animation.
     *
     * Based on LittleJS by Frank Force.
     * @see {@link https://github.com/KilledByAPixel/LittleJS/blob/main/src/engineObject.js}
     */
    update() {
        const { scene } = this

        this.sprite.animate()

        // Kill if TTL is up
        if (this.ttl && Math.min(this.getAliveTime() / this.ttl, 1) === 1) {
            this.destroy()
        }

        // Obey speed limit
        this.force.x = clamp(this.force.x, -this.maxSpeed, this.maxSpeed)
        this.force.y = clamp(this.force.y, -this.maxSpeed, this.maxSpeed)

        // Do not perform physics on static objects
        if (!this.mass) return

        this.lastPos = this.pos.clone()
        this.force.y += scene.gravity * this.gravityScale
        this.pos.x += this.force.x *= this.damping
        this.pos.y += this.force.y *= this.damping
        this.angle += this.angleVelocity *= this.angleDamping

        // Check bounds
        if (this.bounded) {
            this.pos.x < 0 && (this.pos.x = 0)
            this.pos.y < 0 && (this.pos.y = 0)
            this.pos.x > scene.size.x && (this.pos.x = scene.size.x)
            this.pos.y > scene.size.y && (this.pos.y = scene.size.y)
        }

        const wasMovingDown = this.force.y > 0

        if (this.onGround) {
            const groundSpeed = this.onGround instanceof Entity ? this.onGround.force.x : 0
            this.force.x = groundSpeed + (this.force.x - groundSpeed) * this.friction
            this.onGround = false
        }

        if (this.collideObjects) {
            const epsilon = 0.001 // necessary to push slightly outside of the collision
            const collidingObjects = scene.objects.filter(o => o.visible && o.collideObjects)
            for (const o of collidingObjects) {
                if ((!this.solid && !o.solid) || o.dead || o == this) continue
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
                    if ((o.onGround && wasMovingDown) || !o.mass) {
                        if (wasMovingDown) this.onGround = o
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

        if (this.collideTiles) {
            if (scene.testTileCollision(this.pos, this.size, this)) {
                if (!scene.testTileCollision(this.lastPos, this.size, this)) {
                    const isBlockedY = scene.testTileCollision(vec2(this.lastPos.x, this.pos.y), this.size, this)
                    const isBlockedX = scene.testTileCollision(vec2(this.pos.x, this.lastPos.y), this.size, this)
                    if (isBlockedY || !isBlockedX) {
                        this.onGround = wasMovingDown
                        this.force.y *= -this.elasticity
                        const o = ((this.lastPos.y - this.size.y / 2) | 0) - (this.lastPos.y - this.size.y / 2)
                        if (o < 0 && o > this.damping * this.force.y + scene.gravity * this.gravityScale) {
                            this.force.y = this.damping ? (o - scene.gravity * this.gravityScale) / this.damping : 0
                        }
                        this.pos.y = this.lastPos.y
                    }
                    if (isBlockedX) {
                        this.pos.x = this.lastPos.x
                        this.force.x *= -this.elasticity
                    }
                }
            }
        }
    }

    /**
     * Displays debug information about the entity.
     */
    displayDebug() {
        const rect = this.getRelativeBoundingRect()
        const { draw, primaryColor } = this.scene.game
        const { angle, id, type, visible, force, pos } = this
        const { Cyan, LightGreen, Red } = DefaultColors
        const {
            pos: { x, y },
            size
        } = rect
        const s1 = size.x / 2
        const x1 = x + s1
        const fs = '1em'

        draw.outline(rect, visible ? LightGreen : Cyan, 1)
        draw.text(`${type || id || ''}[${angle.toFixed(2)}]`, vec2(x1, y - 14), primaryColor, fs, 'center', 'top', true)
        draw.text(`x:${pos.x.toFixed(1)}`, vec2(x1 - s1 - 2, y), primaryColor, fs, 'right', 'top', true)
        draw.text(`y:${pos.y.toFixed(1)}`, vec2(x1 - s1 - 2, y + 14), primaryColor, fs, 'right', 'top', true)
        Math.abs(force.x) > 0.012 &&
            draw.text(`x:${force.x.toFixed(3)}`, vec2(x1 + s1 + 2, y), Red, fs, 'left', 'top', true)
        Math.abs(force.y) > 0.012 &&
            draw.text(`y:${force.y.toFixed(3)}`, vec2(x1 + s1 + 2, y + 14), Red, fs, 'left', 'top', true)
    }
}
