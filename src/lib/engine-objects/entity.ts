/* eslint-disable @typescript-eslint/no-unused-vars */
import { Animation, Drawable } from '../../types'
import { Color, Vector, box, vec2, randVector, Box } from '../engine-helpers'
import { DefaultColors } from '../constants'
import { clamp, lerp } from '../utils/helpers'
import { Scene } from './scene'
import { Sprite } from './sprite'

export class Entity {
    id: number //               ID of the object
    type: string //             Type of the object
    gid?: number //             Global ID of the object image from TMX map (if any)
    ttl?: number //             Time to live of the object
    name?: string //            Name of the object
    image?: string //           Image of the object (if any)
    color?: Color //            Color of the object (if no sprite)
    layerId?: number //         Layer ID of the object (if any)
    animation?: Animation //    Animation of the object sprite
    // Flags --------------------------------------------------------------------------
    flipH = false //            Whether the object is flipped horizontally (mirrored)
    flipV = false //            Whether the object is flipped vertically
    solid = true //             Whether the object is solid and collides with other objects
    visible = true //           Whether the object is visible and should be drawn
    active = true //            Whether the object is active and should be updated
    dead = false //             Whether the object is dead and should be removed
    collideTiles = true //      Whether the object collides with tiles
    collideObjects = true //    Whether the object collides with other objects
    onGround: Entity | boolean = false // Object the entity is standing on
    // Physics -------------------------------------------------------------------------
    pos = vec2() //             Position of the object (center, scaled by tileSize)
    lastPos = vec2() //         Last position of the object
    size = vec2() //            Size of the object (scaled by tileSize)
    force = vec2() //           Force applied to the object (acceleration)
    mass = 1 //                 Mass of the object, 0 is static
    damping = 0.9 //            How much force is kept each frame (0-1)
    elasticity = 0 //           Bounciness of the object (0-1)
    friction = 0.8 //           Friciton when on ground (0-1)
    gravityScale = 1 //         Hot gravity affects the object
    angleVelocity = 0 //        Angular velocity
    angleDamping = 0.9 //       Rotation slowdown (0-1)
    angle = 0 //                Rotation angle
    maxSpeed = 1 //             Maximum speed
    // Time ---------------------------------------------------------------------------
    spawnTime = 0 //            Time the object was spawned
    // Rendering ----------------------------------------------------------------------
    renderOrder = 0 //          Order in which the object is drawn (higher is later)
    // Custom -------------------------------------------------------------------------
    properties: Record<string, any> // Custom properties of the object

    sprite?: Drawable

    constructor(
        public scene: Scene,
        obj: Record<string, any>
    ) {
        this.id = obj.id
        this.gid = obj.gid
        this.type = obj.type
        this.name = obj.name
        this.layerId = obj.layerId
        this.properties = obj.properties
        this.angle = obj.rotation * (Math.PI / 180) || this.angle
        this.visible = obj.visible !== undefined ? obj.visible : true
        this.spawnTime = scene.game.time
        this.flipH = obj.flipH || this.flipH
        this.flipV = obj.flipV || this.flipV

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
            this.pos = obj?.pos || this.pos
            this.size = obj?.size || this.size
        }
    }

    createSprite() {
        if (this.image) this.sprite = new Sprite(this)
        else if (this.gid) this.sprite = this.scene.tiles[this.gid]
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
     * Checks if this entity collides with another entity.
     * @param entity - The entity to check collision with.
     * @returns `true` if a collision occurs, `false` otherwise.
     */
    collideWithObject(entity: Entity) {
        return true
    }

    /**
     * Checks if the entity collides with a tile using raycasting.
     * @param tileData - The data of the tile to check collision with.
     * @param pos - The position of the entity.
     * @returns True if the entity collides with the tile, false otherwise.
     */
    collideWithTileRaycast(tileData: number, pos: Vector) {
        return tileData > 0
    }

    /**
     * Draws the entity on the screen.
     * - If the entity is visible and on the screen, it will be drawn using the provided scene's camera and game.
     * - If the entity has a sprite, the sprite will be drawn at the entity's position with the specified
     *   transformations.
     * - If the entity does not have a sprite but has a color, a filled rectangle will be drawn at the entity's
     *   translated bounding rectangle.
     * - If the game is in debug mode, the entity's debug information will be displayed.
     */
    draw() {
        if (this.visible && this.onScreen()) {
            const { camera, game } = this.scene
            if (this.sprite) {
                this.sprite.draw(this.scene.getScreenPos(this.pos, this.size), this.flipH, this.flipV, this.angle)
            } else if (this.color) {
                game.draw.fillRect(this.getRelativeBoundingRect(), this.color, this.angle)
            }
            if (game.debug) this.displayDebug()
        }
    }

    /**
     * Animates the entity using the specified animation.
     */
    animate() {
        if (this.animation && this.sprite && this.sprite.animate) {
            this.sprite.animate(this.animation)
        }
    }

    /**
     * Sets the animation for the entity.
     * @param animation - The animation to set.
     * @param flipH - (Optional) Whether to flip the animation horizontally. Default is false.
     * @param flipV - (Optional) Whether to flip the animation vertically. Default is false.
     */
    setAnimation(animation: Animation, flipH = false, flipV = false) {
        if (this.sprite && this.sprite.animate) {
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
        return this.sprite?.animFrame || 0
    }

    /**
     * Sets the animation frame for the entity's sprite.
     * @param frame - The frame number to set.
     */
    setAnimationFrame(frame: number) {
        if (this.sprite) this.sprite.animFrame = frame
    }

    /**
     * Returns the translated position rectangle of the entity.
     * The translated position rectangle is calculated based on the entity's position in the scene.
     * @returns The translated position rectangle of the entity.
     */
    getTranslatedBoundingRect() {
        return new Box(
            this.scene.getScreenPos(this.pos, this.size),
            this.size.clone().multiply(this.scene.tileSize).scale(this.scene.camera.scale)
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
    isOverlapping(pos: Vector, size: Vector) {
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
     * @see https://github.com/KilledByAPixel/LittleJS/blob/main/src/engineObject.js
     */
    update() {
        const { scene } = this

        this.animate()

        // Kill if TTL is up
        if (this.ttl && Math.min((scene.game.time - this.spawnTime) / this.ttl, 1) === 1) {
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

        const wasMovingDown = this.force.y >= 0

        if (this.onGround) {
            const groundSpeed = this.onGround instanceof Entity ? this.onGround.force.x : 0
            this.force.x = groundSpeed + (this.force.x - groundSpeed) * this.friction
            this.onGround = false
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
    }

    /**
     * Checks if the entity is currently on the screen.
     * @returns {boolean} True if the entity is on the screen, false otherwise.
     */
    onScreen() {
        return this.scene.getCameraVisibleArea().overlaps(new Box(this.pos, this.size))
    }

    /**
     * Displays debug information about the entity.
     */
    displayDebug() {
        const { draw, primaryColor } = this.scene.game
        const { angle, id, type, visible, force, pos } = this
        const { Cyan, LightGreen, Red } = DefaultColors
        const rect = this.getRelativeBoundingRect()
        const fs = '1em'
        const {
            pos: { x, y },
            size
        } = rect

        draw.outline(rect, visible ? LightGreen : Cyan, 1)
        draw.text(`${type || id || ''}[${angle.toFixed(2)}]`, x + size.x / 2, y - 14, primaryColor, fs, 'center')
        draw.text(`x:${pos.x.toFixed(1)}`, x + size.x / 2 - size.x / 2 - 2, y, primaryColor, fs, 'right')
        draw.text(`y:${pos.y.toFixed(1)}`, x + size.x / 2 - size.x / 2 - 2, y + 14, primaryColor, fs, 'right')
        Math.abs(force.x) > 0.012 &&
            draw.text(`x:${force.x.toFixed(3)}`, x + size.x / 2 + size.x / 2 + 2, y, Red, fs, 'left')
        Math.abs(force.y) > 0.012 &&
            draw.text(`y:${force.y.toFixed(3)}`, x + size.x / 2 + size.x / 2 + 2, y + 14, Red, fs, 'left')
    }
}
