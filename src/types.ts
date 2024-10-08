import { Color, Entity, Scene, Vector } from './index'
import { Shape } from './lib/constants'

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

export interface CustomShader {
    uniforms?: Record<string, any>
    vertexShader: string
    fragmentShader: string
}

export interface GameConfig {
    scenes: Record<string, Constructable<Scene>>
    entities?: Record<string, Constructable<Entity>>
    fixedSize?: number[]
    backgroundColor?: string
    primaryColor?: string
    pixelPerfect?: boolean
    useWebGL?: boolean
    postProcessShader?: CustomShader
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
    emitConeAngle?: number
    colorStart?: Color
    colorEnd?: Color
    ttl?: number
    sizeStart?: number
    sizeEnd?: number
    mass?: number
    speed?: number
    damping?: number
    angleDamping?: number
    gravityScale?: number
    particleConeAngle?: number
    fadeRate?: number
    randomness?: number
    collideTiles?: boolean
    collideObjects?: boolean
    stretchScale?: number
    elasticity?: number
    renderOrder?: number
    shape?: Shape
}
