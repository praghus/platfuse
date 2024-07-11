/**
 * Asynchronously preloads a collection of assets.
 * @param assets - The collection of assets to preload.
 * @param indicator - A callback function that receives the progress of the preload operation.
 * @returns A promise that resolves to an object containing the preloaded assets.
 */
async function preload(assets: Record<string, string>, indicator: (p: number) => void) {
    const count = Object.keys(assets).length
    let loadedCount = 0

    const load = (key: string) => {
        const src = assets[key]
        return new Promise(res => {
            if (/\.(gif|jpe?g|png|webp|bmp)$/i.test(src) || /(data:image\/[^;]+;base64[^"]+)$/i.test(src)) {
                const img = new Image()
                img.src = src
                img.onload = () => {
                    indicator(++loadedCount / count)
                    return res(img)
                }
            } else if (/\.(webm|mp3|wav)$/i.test(src) || /(data:audio\/[^;]+;base64[^"]+)$/i.test(src)) {
                const audio = new Audio()
                audio.addEventListener(
                    'canplaythrough',
                    () => {
                        indicator(++loadedCount / count)
                        return res(audio)
                    },
                    false
                )
                audio.src = src
            } else return Promise.resolve()
        })
    }

    return Promise.resolve(
        Object.assign(
            {},
            ...(await Promise.all(
                Object.keys(assets).map(async (key: string) => ({
                    [key]: await load(key)
                }))
            ))
        )
    )
}

export { preload }
