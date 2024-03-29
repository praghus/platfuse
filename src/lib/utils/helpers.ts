import { TMXFlips } from '../../types'
import { FLIPPED } from './constants'

const noop = () => {}

export function uuid(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getPerformance(): number {
    return (typeof performance !== 'undefined' && performance.now()) || 0
}

export function isValidArray(arr: any): boolean {
    return !!(arr && arr.length)
}

export function getFlips(gid: number): TMXFlips {
    return {
        H: !!(gid & FLIPPED.HORIZONTALLY),
        V: !!(gid & FLIPPED.VERTICALLY),
        D: !!(gid & FLIPPED.DIAGONALLY)
    }
}

const getFilename = (path: string) => path.replace(/^.*[\\\/]/, '')

export { getFilename, noop }
