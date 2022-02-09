import { Box, Vec2 } from './utils/math'
import { Entity } from './entity'
import { Game } from './game'
import Shaker from './utils/shaker'

export class Camera {
    pos = new Vec2()
    focus = new Vec2()
    offset = new Vec2()
    anchor = new Vec2()
    width: number
    height: number
    scale: number
    shaker: Shaker
    bounds?: Box
    follow?: Entity

    constructor(public game: Game) {
        const { width, height, scale } = game
        this.width = width / scale
        this.height = height / scale
        this.scale = scale
        this.shaker = new Shaker(this)
        this.setFocus(Math.round(width / scale) / 2, Math.round(height / scale) / 2)
    }
    moveTo(x: number, y: number): void {
        this.pos = new Vec2(-x, -y)
        this.anchor = this.pos.clone()
    }
    center(): void {
        this.follow
            ? this.moveTo(
                  this.follow.pos.x + this.follow.width / 2 - this.focus.x,
                  this.follow.pos.y + this.follow.height / 2 - this.focus.y
              )
            : this.moveTo(this.width / 2, this.height / 2)
    }
    resize(width: number, height: number, scale: number): void {
        this.width = width
        this.height = height
        this.scale = scale
    }
    getBounds(): Box {
        if (!this.bounds) {
            this.setBounds(0, 0, this.width, this.height)
        }
        return this.bounds as Box
    }
    setBounds(x: number, y: number, width: number, height: number): void {
        this.bounds = new Box(new Vec2(x, y), width, height)
    }
    setFocus(x: number, y: number): void {
        this.focus = new Vec2(x, y)
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
        const { follow, focus, width, height, scale } = this
        const resolutionX = Math.round(width / scale)
        const resolutionY = Math.round(height / scale)

        this.shaker.update(this.game.delta)

        if (follow) {
            const {
                pos: { x, y },
                width: w,
                height: h
            } = this.getBounds()

            const moveX = (follow.pos.x + follow.width / 2 + this.pos.x - focus.x) / (resolutionX / 10)
            const moveY = (follow.pos.y + follow.height / 2 + this.pos.y - focus.y) / (resolutionY / 10)
            const followMidX = follow.pos.x + follow.width / 2
            const followMidY = follow.pos.y + follow.height / 2

            this.pos.x -= Math.round(moveX + follow.force.x - (this.offset.x - this.shaker.offset.x) / this.scale)
            this.pos.y -= Math.round(moveY + follow.force.y - (this.offset.y - this.shaker.offset.y) / this.scale)

            if (followMidX > x && followMidX < x + w && followMidY > y && followMidY < y + h) {
                if (this.pos.x - resolutionX < -x - w) this.pos.x = -x - w + resolutionX
                if (this.pos.y - resolutionY < -y - h) this.pos.y = -y - h + resolutionY
                if (this.pos.x > -x) this.pos.x = -x
                if (this.pos.y > -y) this.pos.y = -y
            } else {
                if (this.pos.x - resolutionX < -w) this.pos.x = -w + resolutionX
                if (this.pos.y - resolutionY < -h) this.pos.y = -h + resolutionY
                if (this.pos.x > 0) this.pos.x = 0
                if (this.pos.y > 0) this.pos.y = 0
            }
        } else {
            this.pos.x = this.anchor.x - Math.round(this.offset.x - this.shaker.offset.x / this.scale)
            this.pos.y = this.anchor.y - Math.round(this.offset.y - this.shaker.offset.y / this.scale)
        }
    }
}
