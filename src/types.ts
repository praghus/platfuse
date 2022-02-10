import { Vec2 } from './lib/utils/math'

export interface StringTMap<T> {
    [key: string]: T
}
export interface NumberTMap<T> {
    [key: number]: T
}
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
    bounds?: number[]
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
    draw(pos: Vec2, flips?: TMXFlips): void
}
export interface TMXTiledMap {
    backgroundcolor: string
    height: number
    infinite: number
    nextlayerid: number
    nextobjectid: number
    orientation: string
    renderorder: string
    tiledversion: string
    tileheight: number
    tilewidth: number
    version: number
    width: number
    editorsettings?: Record<string, any>
    properties: Record<string, any> | undefined
    layers: TMXLayer[]
    tilesets: TMXTileset[]
}
export interface TMXLayer {
    id: number
    type: string
    name?: string
    width: number
    height: number
    visible: boolean
    x?: number
    y?: number
    opacity?: number
    properties?: Record<string, any> | null
    tintcolor?: string
    offsetx?: number
    offsety?: number
    parallaxx?: number
    parallaxy?: number
    data?: (number | null)[]
    objects?: TMXObject[]
    image?: TMXImage
}
export interface TMXLayerGroup {
    id: number
    layers: TMXLayer[]
    name: string
    properties: Record<string, any> | null
    type: string
}
export interface TMXTileset {
    columns: number
    firstgid: number
    name: string
    image: string
    spacing?: number
    margin?: number
    tilecount: number
    tileheight: number
    tilewidth: number
    tiles: TMXTile[]
}
export interface TMXImage {
    height: number
    width: number
    source: string
}
export interface TMXTile {
    id: number
    type: string
    animation?: Record<string, any>
    objects?: Record<string, any>[]
    probability?: number
}
export interface TMXObject {
    gid: number
    height: number
    id: number
    name: string
    properties: Record<string, any> | null
    shape: string
    type: string
    width: number
    x: number
    y: number
    flips?: TMXFlips
}
export interface TMXFlips {
    H?: boolean
    V?: boolean
    D?: boolean
}
