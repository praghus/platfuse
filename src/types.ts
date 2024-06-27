import { Vector } from './lib/utils/math'
import { Color, Entity, Scene } from './index'
import { TMXFlips } from 'tmx-map-parser'

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
    draw(pos: Vector, flips?: TMXFlips): void
}

export interface GameConfig {
    fixedSize?: Vector
    entities: Record<string, Constructable<Entity>>
    scenes: Record<string, Constructable<Scene>>
    backgroundColor?: Color
    preloaderColor?: Color
    scale?: number
    global?: boolean
    debug?: boolean
}
