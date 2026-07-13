/**
 * Advanced Cache Manager with TTL and Smart Invalidation
 */

class CacheManager {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, value, ttl = 5 * 60 * 1000) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Store value with metadata
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    })

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)
    this.timers.set(key, timer)
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    const age = Date.now() - item.timestamp
    if (age > item.ttl) {
      this.delete(key)
      return null
    }

    return item.value
  }

  delete(key) {
    this.cache.delete(key)
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.cache.clear()
    this.timers.clear()
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key)
      }
    }
  }

  size() {
    return this.cache.size
  }
}

export const globalCache = new CacheManager()
