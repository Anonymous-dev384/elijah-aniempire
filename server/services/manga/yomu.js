/**
 * Yomu manga service stub — yomu-api is not available in this environment.
 */
const stub = async () => null
const stubList = async () => ({ data: [], hasNextPage: false })

module.exports = {
  search:      stubList,
  getInfo:     stub,
  getChapters: stubList,
  getPages:    stubList,
}
