const guardMap = {}

/**
 * 创建简单的防重提交守卫。
 * @param {number} expireMs - 锁定时长。
 * @returns {{canRun:Function,release:Function}} 守卫对象。
 */
function createSubmitGuard(expireMs) {
  const duration = expireMs || 1800

  return {
    /**
     * 判断指定 key 是否允许执行。
     * @param {string} key - 操作 key。
     * @returns {boolean} 是否允许执行。
     */
    canRun(key) {
      const now = Date.now()
      const previous = guardMap[key] || 0

      if (now - previous < duration) {
        return false
      }

      guardMap[key] = now
      return true
    },

    /**
     * 释放指定 key 的锁。
     * @param {string} key - 操作 key。
     */
    release(key) {
      delete guardMap[key]
    }
  }
}

/**
 * 生成订单幂等 token。
 * @param {string} userId - 用户 ID。
 * @returns {string} 幂等 token。
 */
function createIdempotencyToken(userId) {
  return `${userId || 'guest'}-${Date.now()}-${Math.floor(Math.random() * 99)}`
}

module.exports = {
  createSubmitGuard,
  createIdempotencyToken
}
