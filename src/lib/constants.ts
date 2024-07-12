import { Color } from './engine-helpers/color'

/**
 * DawnBringer 16 color palette
 * @see {@link https://lospec.com/palette-list/dawnbringer-16}
 * @see {@link https://pixeljoint.com/forum/forum_posts.asp?TID=12795}
 */
const DefaultColors = {
    Black: new Color('#140C1C'),
    DarkRed: new Color('#442434'),
    DarkBlue: new Color('#30346D'),
    DarkGray: new Color('#4E4A4F'),
    Brown: new Color('#854C30'),
    DarkGreen: new Color('#346524'),
    Red: new Color('#D04648'),
    LightGray: new Color('#757161'),
    LightBlue: new Color('#597DCE'),
    Orange: new Color('#D27D2C'),
    BlueGray: new Color('#8595A1'),
    LightGreen: new Color('#6DAA2C'),
    Peach: new Color('#D2AA99'),
    Cyan: new Color('#6DC2CA'),
    Yellow: new Color('#DAD45E'),
    White: new Color('#DEEED6')
}

/**
 * The type of a node in a Tiled map.
 */
enum NodeType {
    Custom = 'custom',
    ImageLayer = 'imagelayer',
    Layer = 'layer',
    ObjectGroup = 'objectgroup',
    Properties = 'properties',
    TileSet = 'tileset'
}

/**
 * The flipped flags for a tile in a Tiled map.
 */
enum Flipped {
    Diagonally = 0x20000000,
    Horizontally = 0x80000000,
    Vertically = 0x40000000
}

const BodyStyle = `
    margin: 0;
    overflow: hidden;
    touch-action: none; 
    user-select: none; 
    -webkit-user-select: none;
    -webkit-touch-callout: none;
`

const CanvasStyle = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
`

export { NodeType, Flipped, DefaultColors, BodyStyle, CanvasStyle }
