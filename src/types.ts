import { Color, Entity, Vector } from './index'

export interface Constructable<T> {
    new (...args: any[]): T
}

export interface AnimationStrip {
    x: number
    y: number
    frames: number
    duration: number
}

export interface Animation {
    strip?: AnimationStrip
    frames?: number[][]
    offset?: number[]
    width: number
    height: number
    loop: boolean
}

export interface Drawable {
    animation?: Animation
    animFrame: number
    then: number
    frameStart: number

    animate?(animation?: Animation): void
    getNextGid?(): number
    draw(pos: Vector, flipH: boolean, flipV: boolean, angle: number): void
}

export interface GameConfig {
    fixedSize?: Vector
    entities: Record<string, Constructable<Entity>>
    backgroundColor?: string
    primaryColor?: string
    secondaryColor?: string
    global?: boolean
    debug?: boolean
}

export interface ParticleConfig {
    pos: Vector
    angle?: number
    angleSpeed?: number
    emitSize?: number
    emitTime?: number
    emitRate?: number
    emitCone?: number
    emitConeAngle?: number
    colorStart?: Color
    colorEnd?: Color
    ttl?: number
    sizeStart?: number
    sizeEnd?: number
    speed?: number
    damping?: number
    angleDamping?: number
    gravityScale?: number
    particleConeAngle?: number
    fadeRate?: number
    randomness?: number
    collideTiles?: boolean
    stretchScale?: number
    elasticity?: number
    renderOrder?: number
}
