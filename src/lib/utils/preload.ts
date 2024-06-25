async function preloadAssets(assets: Record<string, string>, indicator: (p: number) => void) {
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
    const promises = Object.keys(assets).map(async (key: string) => ({
        [key]: await load(key)
    }))
    const loadedAssets = Object.assign({}, ...(await Promise.all(promises)))

    return Promise.resolve(loadedAssets)
}

export { preloadAssets }
