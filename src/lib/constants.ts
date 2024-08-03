import { Color } from './engine-helpers/color'

/**
 * Body style.
 */
const BodyStyle = `
    margin: 0;
    overflow: hidden;
    touch-action: none; 
    user-select: none; 
    -webkit-user-select: none;
    -webkit-touch-callout: none;
`

/**
 * Canvas style.
 */
const CanvasStyle = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
`

/**
 * DawnBringer 32 color palette
 * @see {@link https://lospec.com/palette-list/dawnbringer-32}
 */
const DefaultColors = {
    Black: new Color('#000000'),
    Valhalla: new Color('#222034'),
    Loulou: new Color('#45283C'),
    OiledCedar: new Color('#663931'),
    Rope: new Color('#8F563B'),
    TahitiGold: new Color('#DF7126'),
    Twine: new Color('#D9A066'),
    Pancho: new Color('#EEC39A'),
    GoldenFizz: new Color('#FBF236'),
    Atlantis: new Color('#99E550'),
    Christi: new Color('#6ABE30'),
    ElfGreen: new Color('#37946E'),
    Dell: new Color('#4B692F'),
    Verdigris: new Color('#524B24'),
    Opal: new Color('#323C39'),
    DeepKoamaru: new Color('#3F3F74'),
    VeniceBlue: new Color('#306082'),
    RoyalBlue: new Color('#5B6EE1'),
    Cornflower: new Color('#639BFF'),
    Viking: new Color('#5FCDE4'),
    LightSteelBlue: new Color('#CBDBFC'),
    White: new Color('#FFFFFF'),
    Heather: new Color('#9BADB7'),
    Topaz: new Color('#847E87'),
    DimGray: new Color('#696A6A'),
    SmokeyAsh: new Color('#595652'),
    Clairvoyant: new Color('#76428A'),
    Brown: new Color('#AC3232'),
    Mandy: new Color('#D95763'),
    Plum: new Color('#D77BBA'),
    Rainforest: new Color('#8F974A'),
    Stinger: new Color('#8A6F30')
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

/**
 * Represents the shape types.
 */
enum Shape {
    Rectangle = 'rectangle',
    Ellipse = 'ellipse',
    Polygon = 'polygon'
}

/**
 * The Platfuse logo.
 */
const PlatfuseLogo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAGFBMVEUAAAD///9DQDtfzeRqvjDZV2P78jb///98Eu/2AAAAAnRSTlMAA++anIIAAAABYktHRAJmC3xkAAAAJUlEQVQI12NgS0tLYAhgYGBmCCgvBxIF7ECiUBzOBUqwuLg4AACUiAc8Yjh8HgAAAABJRU5ErkJggg=='

/**
 * A pixel font image.
 */
const PixelFontImage = `data:image/png;base64,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
`

export { NodeType, Flipped, Shape, DefaultColors, BodyStyle, CanvasStyle, PlatfuseLogo, PixelFontImage }
