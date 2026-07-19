/**
 * AnimePahe service stub — animepahe-api is not available in this environment.
 * All methods return empty/null gracefully so the server boots cleanly.
 */
const stub = async () => null
const stubList = async () => ({ data: [], hasNextPage: false })

module.exports = {
  search:           stubList,
  getInfo:          stub,
  getEpisodes:      stubList,
  getEpisodeSources: stubList,
  getSources:       stub,
}
