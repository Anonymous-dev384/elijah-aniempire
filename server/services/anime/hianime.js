/**
 * HiAnime service stub — wraps the hianime npm package gracefully.
 * Falls back to empty responses if the package fails (proxy/network not available).
 */
let HiAnimeLib
try { HiAnimeLib = require('hianime').Hianime } catch (e) { HiAnimeLib = null }

class HiAnime {
  constructor() {
    try { if (HiAnimeLib) this.hianime = new HiAnimeLib() } catch {}
    this.name = 'zoro'
  }

  async search(query) { try { return await this.hianime?.search(query) ?? { results: [] } } catch { return { results: [] } } }
  async getInfo(id)   { try { return await this.hianime?.getInfo(id) ?? null } catch { return null } }
  async getEpisodes(id) { try { return await this.hianime?.getEpisodes(id) ?? [] } catch { return [] } }
  async getEpisodeSources(ep, server, type) { try { return await this.hianime?.getEpisodeSources(ep, server, type) ?? null } catch { return null } }
  async getServers(ep) { try { return await this.hianime?.getEpisodeServers(ep) ?? [] } catch { return [] } }

  // Legacy compat
  async getZoroServers(ep) { return this.getServers(ep) }
  async getZoroStreamingLinks(ep, server) { return this.getEpisodeSources(ep, server, 'sub') }
  async searchAnime(query) { return this.search(query) }
  async getAnimeInfo(id) { return this.getInfo(id) }
}

module.exports = new HiAnime()
