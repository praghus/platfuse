import { Color } from '../color'

enum NODE_TYPE {
    CUSTOM = 'custom',
    IMAGE_LAYER = 'imagelayer',
    LAYER = 'layer',
    OBJECT_GROUP = 'objectgroup',
    PROPERTIES = 'properties',
    TILESET = 'tileset'
}

// DawnBringer 16 color palette
const COLORS = {
    BLACK: new Color().setHex('#140C1C'),
    DARK_RED: new Color().setHex('#442434'),
    DARK_BLUE: new Color().setHex('#30346D'),
    DARK_GRAY: new Color().setHex('#4E4A4F'),
    BROWN: new Color().setHex('#854C30'),
    DARK_GREEN: new Color().setHex('#346524'),
    RED: new Color().setHex('#D04648'),
    LIGHT_GRAY: new Color().setHex('#757161'),
    LIGHT_BLUE: new Color().setHex('#597DCE'),
    ORANGE: new Color().setHex('#D27D2C'),
    BLUE_GRAY: new Color().setHex('#8595A1'),
    LIGHT_GREEN: new Color().setHex('#6DAA2C'),
    PEACH: new Color().setHex('#D2AA99'),
    CYAN: new Color().setHex('#6DC2CA'),
    YELLOW: new Color().setHex('#DAD45E'),
    WHITE: new Color().setHex('#DEEED6')
}

enum FLIPPED {
    DIAGONALLY = 0x20000000,
    HORIZONTALLY = 0x80000000,
    VERTICALLY = 0x40000000
}

export { NODE_TYPE, COLORS, FLIPPED }
