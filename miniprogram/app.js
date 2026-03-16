const cache = require('./utils/cache')
const config = require('./config/index')
const { STORAGE_KEYS } = require('./constants/index')
const mockStore = require('./services/mockStore')
const { cloud } = require('./utils/wechat/index')

/**
 * 初始化云开发能力。
 * 这里统一走微信能力层，避免 App 与原生 API 直接耦合。
 * @returns {boolean} 是否成功启用云开发。
 */
function initCloud() {
  if (!config.cloudEnvId) {
    return false
  }

  try {
    cloud.init({
      env: config.cloudEnvId,
      traceUser: true
    })
    return true
  } catch (error) {
    console.error('[云开发初始化失败]', error)
    return false
  }
}

App({
  /**
   * 小程序启动时初始化全局运行环境。
   */
  onLaunch() {
    const cloudReady = initCloud()
    const useMockData = config.useMockData || !cloudReady

    this.globalData = {
      cloudReady,
      useMockData,
      cartItems: cache.getStorage(STORAGE_KEYS.CART, []),
      currentUser: cache.getStorage(STORAGE_KEYS.CURRENT_USER, null),
      restaurantProfile: config.restaurantProfile,
      cloudEnvId: config.cloudEnvId
    }

    if (useMockData) {
      mockStore.ensureMockSeeds()
      this.globalData.currentUser = cache.getStorage(
        STORAGE_KEYS.CURRENT_USER,
        null
      )
    }
  },

  /**
   * 同步购物车到全局状态与本地缓存。
   * @param {Array} cartItems - 最新购物车条目。
   */
  setCart(cartItems) {
    this.globalData.cartItems = cartItems
    cache.setStorage(STORAGE_KEYS.CART, cartItems)
  },

  /**
   * 同步当前用户到全局状态与本地缓存。
   * @param {Object|null} user - 当前用户。
   */
  setCurrentUser(user) {
    this.globalData.currentUser = user || null
    if (user) {
      cache.setStorage(STORAGE_KEYS.CURRENT_USER, user)
      return
    }

    cache.removeStorage(STORAGE_KEYS.CURRENT_USER)
  }
})
