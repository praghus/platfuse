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

enum gl {
    ONE = 1,
    TRIANGLE_STRIP = 5,
    SRC_ALPHA = 770,
    ONE_MINUS_SRC_ALPHA = 771,
    BLEND = 3042,
    TEXTURE_2D = 3553,
    UNSIGNED_BYTE = 5121,
    FLOAT = 5126,
    RGBA = 6408,
    NEAREST = 9728,
    LINEAR = 9729,
    TEXTURE_MAG_FILTER = 10240,
    TEXTURE_MIN_FILTER = 10241,
    TEXTURE_WRAP_S = 10242,
    TEXTURE_WRAP_T = 10243,
    COLOR_BUFFER_BIT = 16384,
    CLAMP_TO_EDGE = 33071,
    TEXTURE0 = 33984,
    ARRAY_BUFFER = 34962,
    STATIC_DRAW = 35044,
    DYNAMIC_DRAW = 35048,
    FRAGMENT_SHADER = 35632,
    VERTEX_SHADER = 35633,
    COMPILE_STATUS = 35713,
    LINK_STATUS = 35714,
    UNPACK_FLIP_Y_WEBGL = 37440,
    INDICIES_PER_VERT = 6,
    MAX_BATCH = 1e5,
    VERTEX_BYTE_STRIDE = 4 * 2 * 2 + 4 * 2,
    VERTEX_BUFFER_SIZE = MAX_BATCH * VERTEX_BYTE_STRIDE
}

export { NodeType, DefaultColors, Flipped, gl }
