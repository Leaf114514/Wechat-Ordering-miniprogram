const cache = require('../utils/cache')
const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const {
  STORAGE_KEYS,
  DEFAULT_AVATAR_URL,
  USER_ROLE
} = require('../constants/index')

/**
 * 更新当前用户到全局状态。
 * @param {Object|null} user - 用户对象。
 */
function updateCurrentUserState(user) {
  const app = cloudService.getAppInstance()

  if (app && typeof app.setCurrentUser === 'function') {
    app.setCurrentUser(user || null)
    return
  }

  if (user) {
    cache.setStorage(STORAGE_KEYS.CURRENT_USER, user)
    return
  }

  cache.removeStorage(STORAGE_KEYS.CURRENT_USER)
}

/**
 * 获取当前用户缓存。
 * @returns {Object|null} 用户对象。
 */
function getCachedUser() {
  const app = cloudService.getAppInstance()
  if (app && app.globalData.currentUser) {
    return JSON.parse(JSON.stringify(app.globalData.currentUser))
  }

  return cache.getStorage(STORAGE_KEYS.CURRENT_USER, null)
}

/**
 * 兼容旧调用，返回当前已登录用户。
 * @returns {Promise<Object|null>} 用户对象。
 */
async function ensureCurrentUser() {
  return getCachedUser()
}

/**
 * 判断当前是否已登录。
 * @returns {boolean} 是否已登录。
 */
function isLoggedIn() {
  return Boolean(getCachedUser())
}

/**
 * 获取微信登录 code。
 * @returns {Promise<string>} 登录 code。
 */
function getWechatLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(result) {
        resolve(result.code || '')
      },
      fail(error) {
        reject(error)
      }
    })
  })
}

/**
 * 在 Mock 模式下完成登录。
 * @param {Object} profile - 用户资料。
 * @returns {Promise<Object>} 登录后的用户。
 */
async function loginMockUser(profile) {
  mockStore.ensureMockSeeds()
  const users = mockStore.getMockUsers()
  const target = users.find((item) => item.role === USER_ROLE.CUSTOMER) ||
    users[0]

  target.nickname = profile.nickname || target.nickname || '微信用户'
  target.avatarUrl = profile.avatarUrl || target.avatarUrl ||
    DEFAULT_AVATAR_URL
  target.lastLoginAt = Date.now()

  mockStore.saveMockUsers(users)
  updateCurrentUserState(target)
  return target
}

/**
 * 使用微信资料完成登录。
 * @param {Object} profile - 微信头像与昵称。
 * @returns {Promise<Object>} 登录后的用户。
 */
async function loginWithWechatProfile(profile) {
  const safeProfile = {
    avatarUrl: profile && profile.avatarUrl
      ? profile.avatarUrl
      : DEFAULT_AVATAR_URL,
    nickname: profile && profile.nickname
      ? profile.nickname.trim()
      : '微信用户'
  }

  if (cloudService.shouldUseMock()) {
    return loginMockUser(safeProfile)
  }

  try {
    const loginCode = await getWechatLoginCode()
    const result = await cloudService.callCloudFunction('loginUser', {
      loginCode,
      profile: safeProfile
    })

    if (result.result.code !== 0) {
      throw new Error(result.result.message || '微信登录失败')
    }

    updateCurrentUserState(result.result.data)
    return result.result.data
  } catch (error) {
    console.error('[微信登录失败]', error)
    throw error
  }
}

/**
 * 退出当前登录账号。
 */
function logoutCurrentUser() {
  updateCurrentUserState(null)
}

/**
 * 切换 Mock 身份。
 * @param {string} role - 目标角色。
 * @returns {Promise<Object>} 更新后的用户对象。
 */
async function switchMockRole(role) {
  if (!cloudService.shouldUseMock()) {
    return getCachedUser()
  }

  mockStore.ensureMockSeeds()
  const users = mockStore.getMockUsers()
  const nextUser = users.find((item) => item.role === role) || users[0]
  nextUser.lastLoginAt = Date.now()
  mockStore.saveMockUsers(users)
  updateCurrentUserState(nextUser)
  return nextUser
}

/**
 * 在下单后更新用户统计。
 * @param {Object} order - 订单对象。
 */
function updateUserMetrics(order) {
  if (!cloudService.shouldUseMock()) {
    return
  }

  const currentUser = getCachedUser()
  if (!currentUser) {
    return
  }

  const users = mockStore.getMockUsers()
  const target = users.find((item) => item._id === currentUser._id)

  if (!target) {
    return
  }

  target.orderCount += 1
  target.totalSpend += order.totalPrice
  target.lastLoginAt = Date.now()
  mockStore.saveMockUsers(users)
  updateCurrentUserState(target)
}

module.exports = {
  updateCurrentUserState,
  ensureCurrentUser,
  getCachedUser,
  isLoggedIn,
  loginWithWechatProfile,
  logoutCurrentUser,
  switchMockRole,
  updateUserMetrics
}
