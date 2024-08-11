import { Polygon } from '../engine-helpers/polygon'
import { vec2 } from './geometry'
import { deg2rad } from './math'

/**
 * Converts a TMX color string to a hex color string.
 * @param color - The TMX color string to convert.
 * @returns The hex color string.
 */
const tmxColor = (color: string) => `#${color.slice(3, 9)}${color.slice(1, 3)}`

/**
 * Converts a TMX polygon object to a Polygon object.
 * @param obj - The TMX object to convert.
 * @returns The Polygon object.
 */
function tmxPolygon(obj: Record<string, any>) {
    const pointXY = obj.points.reduce(
        (acc: [number[], number[]], [px, py]: number[]) => {
            acc[0].push(px)
            acc[1].push(py)
            return acc
        },
        [[], []]
    )
    const angle = obj?.rotation ? deg2rad(obj.rotation) : 0
    const min = vec2(Math.min(...pointXY[0]), Math.min(...pointXY[1]))
    const max = vec2(Math.max(...pointXY[0]), Math.max(...pointXY[1]))
    const size = vec2(max.x - min.x, max.y - min.y)
    const rotatedCenter = size.divide(2).add(min).rotate(angle)
    const pos = vec2(obj.x, obj.y).add(rotatedCenter)
    const points = obj.points.map(([x, y]: [number, number]) => vec2(x, y).subtract(min).subtract(size.divide(2)))
    return new Polygon(pos, points)
}

export { tmxPolygon, tmxColor }
