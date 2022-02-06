import { Box, Vec2 } from './utils/math'
import { Entity } from './entity'
import { Game } from './game'

export class Camera {
    pos = new Vec2(0, 0)
    focusPoint = new Vec2(0, 0)
    width: number
    height: number
    scale: number
    bounds?: Box
    follow?: Entity

    constructor(game: Game) {
        const { width, height, scale } = game
        this.width = width / scale
        this.height = height / scale
        this.scale = scale
        this.setBounds(0, 0, this.width, this.height)
        this.setFocusPoint(Math.round(width / scale) / 2, Math.round(height / scale) / 2)
    }
    moveTo(x: number, y: number): void {
        this.pos = new Vec2(-x, -y)
    }
    center(): void {
        this.follow
            ? this.moveTo(
                  this.follow.pos.x + this.follow.width / 2 - this.focusPoint.x,
                  this.follow.pos.y + this.follow.height / 2 - this.focusPoint.y
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
    setFocusPoint(x: number, y: number): void {
        this.focusPoint = new Vec2(x, y)
    }
    setFollow(follow: Entity, center = true): void {
        this.follow = follow
        center && this.center()
    }
    update(): void {
        if (!this.follow) return
        const { follow, focusPoint, width, height, scale } = this
        const {
            pos: { x, y },
            width: w,
            height: h
        } = this.getBounds()

        const resolutionX = Math.round(width / scale)
        const resolutionY = Math.round(height / scale)
        const moveX = (follow.pos.x + follow.width / 2 + this.pos.x - focusPoint.x) / (resolutionX / 10)
        const moveY = (follow.pos.y + follow.height / 2 + this.pos.y - focusPoint.y) / (resolutionY / 10)
        const followMidX = follow.pos.x + follow.width / 2
        const followMidY = follow.pos.y + follow.height / 2

        this.pos.x -= Math.round(moveX + follow.force.x)
        this.pos.y -= Math.round(moveY + follow.force.y)

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
    }
}
