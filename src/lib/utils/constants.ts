export enum NODE_TYPE {
    CUSTOM = 'custom',
    IMAGE_LAYER = 'imagelayer',
    LAYER = 'layer',
    OBJECT_GROUP = 'objectgroup',
    PROPERTIES = 'properties',
    TILESET = 'tileset'
}
export enum TILE_TYPE {
    NON_COLLIDING = 'noCollide',
    INVISIBLE = 'invisible',
    LADDER = 'ladder',
    ONE_WAY = 'oneWay'
}
export enum COLORS {
    BLACK = '#000',
    BLACK1 = '#000000FF',
    BLACK0 = '#00000000',
    LIGHT = '#FADC96CC',
    BLUE = '#7CF',
    DARK_GREY = '#222',
    DARK_RED = '#D00',
    GREEN = '#0F0',
    LIGHT_RED = '#F00',
    PURPLE = '#F0F',
    WHITE = '#FFF',
    WHITE_25 = '#FFFFFF19',
    WHITE_50 = '#FFFFFF80'
}
export enum SHAPE {
    BOX = 'box',
    POLYGON = 'polygon'
}
export enum FLIPPED {
    DIAGONALLY = 0x20000000,
    HORIZONTALLY = 0x80000000,
    VERTICALLY = 0x40000000
}
