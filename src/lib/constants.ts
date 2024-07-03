import { Color } from './engine-helpers/color'

// DawnBringer 16 color palette
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

enum NodeType {
    Custom = 'custom',
    ImageLayer = 'imagelayer',
    Layer = 'layer',
    ObjectGroup = 'objectgroup',
    Properties = 'properties',
    TileSet = 'tileset'
}

enum Flipped {
    Diagonally = 0x20000000,
    Horizontally = 0x80000000,
    Vertically = 0x40000000
}

export { NodeType, Flipped, DefaultColors }
