/**
 * Returns the current high-resolution timestamp, if available.
 * If the `performance` object is not available, it returns 0.
 * @returns The current high-resolution timestamp, or 0 if not available.
 */
const getPerformance = () => (typeof performance !== 'undefined' && performance.now()) || 0

const getTmxColor = (color: string) => `#${color.slice(3, 9)}${color.slice(1, 3)}`

/**
 * Sorts objects based on their render order.
 * @param a - The first object to compare.
 * @param b - The second object to compare.
 * @returns A negative value if `a` should be sorted before `b`, a positive value if `a` should be sorted after `b`, or 0 if they have the same render order.
 */
const sortByRenderOrder = (a: any, b: any) => a.renderOrder - b.renderOrder

/**
 * Delays the execution for the specified amount of time.
 * @param time - The time to delay in milliseconds.
 * @returns A promise that resolves after the specified delay.
 */
const delay = (time: number) => new Promise(resolve => setTimeout(resolve, time))

/**
 * Waits for the specified amount of time and then invokes the callback function.
 * @param time - The amount of time to wait in milliseconds.
 * @param cb - The callback function to invoke after the specified time has elapsed.
 */
const wait = (time: number, cb: () => void) => delay(time).then(cb)

export { delay, getPerformance, getTmxColor, sortByRenderOrder, wait }
