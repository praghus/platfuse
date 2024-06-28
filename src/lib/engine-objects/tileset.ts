import { TMXTileset } from 'tmx-map-parser'
import { Scene } from './scene'
import { vec2 } from '../engine-helpers'

export class Tileset {
    size = vec2()

    constructor(
        public scene: Scene,
        public config: TMXTileset,
        public image: HTMLImageElement
    ) {}
}
