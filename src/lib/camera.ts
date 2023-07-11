import { Box, Vector } from './utils/math'
import { Shaker } from './utils/shaker'
import { Entity } from './entity'
import { Game } from './game'

export class Camera {
    pos = new Vector()
    offset = new Vector()
    anchor = new Vector()
    speed = new Vector(1, 1)
    shaker: Shaker
    bounds?: Box
    follow?: Entity

    constructor(public game: Game) {
        this.shaker = new Shaker(game)
    }

    moveTo(x: number, y: number) {
        const bounds = this.getBounds()
        const px = Math.max(bounds.pos.x, Math.min(x, bounds.w))
        const py = Math.max(bounds.pos.y, Math.min(y, bounds.h))
        this.pos = new Vector(-px + this.game.resolution.x / 2, -py + this.game.resolution.y / 2)
        this.anchor = this.pos.clone()
    }

    center() {
        this.follow
            ? this.moveTo(this.follow.pos.x + this.follow.width / 2, this.follow.pos.y + this.follow.height / 2)
            : this.moveTo(this.game.resolution.x / 2, this.game.resolution.y / 2)
    }

    getBounds() {
        if (!this.bounds) {
            this.setBounds(0, 0, Infinity, Infinity)
        }
        return this.bounds as Box
    }

    setBounds(x: number, y: number, width: number, height: number) {
        this.bounds = new Box(new Vector(x, y), width, height)
    }

    setSpeed(x: number, y = x) {
        this.speed = new Vector(x, y)
    }

    setOffset(x: number, y: number) {
        this.offset = new Vector(-x, -y)
    }

    setFollow(follow: Entity, center = true) {
        this.follow = follow
        center && this.center()
    }

    unfollow() {
        this.follow = undefined
    }

    shake(duration: number, intensity: Vector) {
        this.shaker.start(duration, intensity)
    }

    update() {
        if (this.follow) {
            const { speed, follow } = this
            const { x, y } = this.game.resolution
            const { w, h } = this.getBounds()
            const midPos = new Vector(
                -x / 2 + follow.pos.x + follow.force.x + follow.width / 2,
                -y / 2 + follow.pos.y + follow.force.y + follow.height / 2
            )
            const moveTo = new Vector(
                (midPos.x + this.pos.x - this.offset.x - this.shaker.offset.x) * speed.x,
                (midPos.y + this.pos.y - this.offset.y - this.shaker.offset.y) * speed.y
            )
            this.pos = this.pos.sub(
                new Vector(Math.round(moveTo.x / this.game.scale), Math.round(moveTo.y / this.game.scale))
            )
            if (this.pos.x - x < -w) this.pos.x = -w + x
            if (this.pos.y - y < -h) this.pos.y = -h + y
            if (this.pos.x > 0) this.pos.x = 0
            if (this.pos.y > 0) this.pos.y = 0
        } else {
            this.pos.x = this.anchor.x - Math.round(this.offset.x - this.shaker.offset.x)
            this.pos.y = this.anchor.y - Math.round(this.offset.y - this.shaker.offset.y)
        }
        this.shaker.update()
    }
}
