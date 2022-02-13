import { Box, Vec2 } from './utils/math'
import { Entity } from './entity'
import { Game } from './game'
import Shaker from './utils/shaker'

export class Camera {
    pos = new Vec2()
    offset = new Vec2()
    anchor = new Vec2()
    speed = new Vec2(1)
    shaker: Shaker
    bounds?: Box
    follow?: Entity

    constructor(public game: Game) {
        this.shaker = new Shaker(game)
    }

    moveTo(x: number, y: number): void {
        this.pos = new Vec2(-x, -y)
        this.anchor = this.pos.clone()
    }

    center(): void {
        this.follow
            ? this.moveTo(this.follow.pos.x + this.follow.width / 2, this.follow.pos.y + this.follow.height / 2)
            : this.moveTo(this.game.resolution.x / 2, this.game.resolution.y / 2)
    }

    getBounds(): Box {
        if (!this.bounds) {
            this.setBounds(0, 0, this.game.resolution.x, this.game.resolution.y)
        }
        return this.bounds as Box
    }

    setBounds(x: number, y: number, width: number, height: number): void {
        this.bounds = new Box(new Vec2(x, y), width, height)
    }

    setSpeed(x: number, y = x): void {
        this.speed = new Vec2(x, y)
    }

    setOffset(x: number, y: number): void {
        this.offset = new Vec2(-x, -y)
    }

    setFollow(follow: Entity, center = true): void {
        this.follow = follow
        center && this.center()
    }

    shake(duration: number, intensity: Vec2) {
        this.shaker.start(duration, intensity)
    }

    update(): void {
        if (this.follow) {
            const { speed, follow } = this
            const { x, y } = this.game.resolution
            const { width, height } = this.getBounds()
            const midPos = new Vec2(
                -x / 2 + follow.pos.x + follow.force.x + follow.width / 2,
                -y / 2 + follow.pos.y + follow.force.y + follow.height / 2
            )
            const moveTo = new Vec2(
                (midPos.x + this.pos.x - this.offset.x - this.shaker.offset.x) * speed.x,
                (midPos.y + this.pos.y - this.offset.y - this.shaker.offset.y) * speed.y
            )
            this.pos = this.pos.sub(
                new Vec2(Math.round(moveTo.x / this.game.scale), Math.round(moveTo.y / this.game.scale))
            )
            if (this.pos.x - x < -width) this.pos.x = -width + x
            if (this.pos.y - y < -height) this.pos.y = -height + y
            if (this.pos.x > 0) this.pos.x = 0
            if (this.pos.y > 0) this.pos.y = 0
        } else {
            this.pos.x = this.anchor.x - Math.round(this.offset.x - this.shaker.offset.x)
            this.pos.y = this.anchor.y - Math.round(this.offset.y - this.shaker.offset.y)
        }
        this.shaker.update()
    }
}
