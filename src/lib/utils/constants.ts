enum NODE_TYPE {
    CUSTOM = 'custom',
    IMAGE_LAYER = 'imagelayer',
    LAYER = 'layer',
    OBJECT_GROUP = 'objectgroup',
    PROPERTIES = 'properties',
    TILESET = 'tileset'
}

// DawnBringer 16 color palette
enum COLORS {
    BLACK = '#140C1C',
    DARK_RED = '#442434',
    DARK_BLUE = '#30346D',
    DARK_GRAY = '#4E4A4F',
    BROWN = '#854C30',
    DARK_GREEN = '#346524',
    RED = '#D04648',
    LIGHT_GRAY = '#757161',
    LIGHT_BLUE = '#597DCE',
    ORANGE = '#D27D2C',
    BLUE_GRAY = '#8595A1',
    LIGHT_GREEN = '#6DAA2C',
    PEACH = '#D2AA99',
    CYAN = '#6DC2CA',
    YELLOW = '#DAD45E',
    WHITE = '#DEEED6'
}

enum FLIPPED {
    DIAGONALLY = 0x20000000,
    HORIZONTALLY = 0x80000000,
    VERTICALLY = 0x40000000
}

export { NODE_TYPE, COLORS, FLIPPED }
