const noop = () => {}
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
const getPerformance = () => (typeof performance !== 'undefined' && performance.now()) || 0
const isValidArray = (arr: any) => !!(arr && arr.length)
const getFilename = (path: string) => path.replace(/^.*[\\\/]/, '')

export { uuid, getFilename, getPerformance, noop, isValidArray }
