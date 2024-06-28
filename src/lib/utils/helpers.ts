const noop = () => {}
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
const getPerformance = () => (typeof performance !== 'undefined' && performance.now()) || 0
const isValidArray = (arr: any) => !!(arr && arr.length)
const getFilename = (path: string) => path.replace(/^.*[\\\/]/, '')
const rad2deg = (rad: number) => (rad * 180) / Math.PI
const clamp = (val: number, min = 0, max = 1) => Math.max(min, Math.min(max, val))
const lerp = (percent: number, a: number, b: number) => a + clamp(percent) * (b - a)
const rand = (a = 1, b = 0) => b + Math.random() * (a - b)
const percent = (val: number, a: number, b: number) => (b - a ? clamp((val - a) / (b - a)) : 0)

function normalize(n: number, min: number, max: number) {
    while (n < min) n += max - min
    while (n >= max) n -= max - min
    return n
}

export { clamp, uuid, getFilename, getPerformance, noop, isValidArray, rad2deg, lerp, rand, percent, normalize }
