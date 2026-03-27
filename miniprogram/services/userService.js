const cache = require('../utils/cache')
const { auth } = require('../utils/wechat/index')
const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const {
  STORAGE_KEYS,
  DEFAULT_AVATAR_URL,
  USER_ROLE
} = require('../constants/index')

/**
 * 复制用户对象，避免页面层直接修改全局状态。
 * @param {Object|null} user - 原始用户对象。
 * @returns {Object|null} 深拷贝后的用户对象。
 */
function cloneUser(user) {
  return user ? JSON.parse(JSON.stringify(user)) : null
}

/**
 * 规范化微信资料，确保头像和昵称始终可用。
 * @param {Object} profile - 页面传入的微信资料。
 * @returns {{avatarUrl:string,nickname:string}} 安全的用户资料。
 */
function buildSafeWechatProfile(profile) {
  return {
    avatarUrl: profile && profile.avatarUrl
      ? profile.avatarUrl
      : DEFAULT_AVATAR_URL,
    nickname: profile && profile.nickname
      ? profile.nickname.trim()
      : '微信用户'
  }
}

/**
 * 获取 mock 用户列表，并在需要时补齐种子数据。
 * @returns {Array} mock 用户列表。
 */
function getMockUsers() {
  mockStore.ensureMockSeeds()
  return mockStore.getMockUsers()
}

/**
 * 按角色获取 mock 用户，不存在时退回列表首项。
 * @param {Array} users - mock 用户列表。
 * @param {string} role - 目标角色。
 * @returns {Object|null} 命中的用户对象。
 */
function findMockUserByRole(users, role) {
  return users.find((item) => item.role === role) || users[0] || null
}

/**
 * 更新当前用户到全局状态和本地缓存。
 * @param {Object|null} user - 最新用户对象。
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
 * 获取当前缓存用户。
 * @returns {Object|null} 当前用户。
 */
function getCachedUser() {
  const app = cloudService.getAppInstance()
  if (app && app.globalData.currentUser) {
    return cloneUser(app.globalData.currentUser)
  }

  return cache.getStorage(STORAGE_KEYS.CURRENT_USER, null)
}

/**
 * 兼容旧调用，返回当前已登录用户。
 * @returns {Promise<Object|null>} 当前用户。
 */
async function ensureCurrentUser() {
  return getCachedUser()
}

/**
 * 判断当前是否已经登录。
 * @returns {boolean} 是否已登录。
 */
function isLoggedIn() {
  return Boolean(getCachedUser())
}

/**
 * 判断当前用户是否为管理员。
 * @returns {boolean} 是否为管理员。
 */
function isAdmin() {
  const user = getCachedUser()
  return Boolean(user && user.role === USER_ROLE.ADMIN)
}

/**
 * 获取微信登录 code。
 * @returns {Promise<string>} 登录 code。
 */
async function getWechatLoginCode() {
  return auth.getLoginCode()
}

/**
 * 在 mock 模式下完成登录。
 * @param {{avatarUrl:string,nickname:string}} profile - 规范化后的用户资料。
 * @returns {Promise<Object>} 登录后的用户对象。
 */
async function loginMockUser(profile) {
  const users = getMockUsers()
  const target = findMockUserByRole(users, USER_ROLE.CUSTOMER)

  if (!target) {
    throw new Error('未找到可用的模拟用户')
  }

  target.nickname = profile.nickname || target.nickname || '微信用户'
  target.avatarUrl = profile.avatarUrl || target.avatarUrl || DEFAULT_AVATAR_URL
  target.lastLoginAt = Date.now()

  mockStore.saveMockUsers(users)
  updateCurrentUserState(target)
  return cloneUser(target)
}

/**
 * 使用微信资料完成登录。
 * @param {Object} profile - 页面提供的头像和昵称。
 * @returns {Promise<Object>} 登录后的用户对象。
 */
async function loginWithWechatProfile(profile) {
  const safeProfile = buildSafeWechatProfile(profile)

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
    return cloneUser(result.result.data)
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
 * 切换 mock 演示角色。
 * @param {string} role - 目标角色。
 * @returns {Promise<Object|null>} 切换后的用户对象。
 */
async function switchMockRole(role) {
  if (!cloudService.shouldUseMock()) {
    return getCachedUser()
  }

  const users = getMockUsers()
  const nextUser = findMockUserByRole(users, role)

  if (!nextUser) {
    return null
  }

  nextUser.lastLoginAt = Date.now()
  mockStore.saveMockUsers(users)
  updateCurrentUserState(nextUser)
  return cloneUser(nextUser)
}

/**
 * 下单后更新 mock 用户统计。
 * @param {Object} order - 新创建的订单对象。
 */
function updateUserMetrics(order) {
  if (!cloudService.shouldUseMock()) {
    return
  }

  const currentUser = getCachedUser()
  if (!currentUser) {
    return
  }

  const users = getMockUsers()
  const target = users.find((item) => item._id === currentUser._id)

  if (!target) {
    return
  }

  target.orderCount += 1
  target.totalSpend += Number(order.totalPrice || 0)
  target.lastLoginAt = Date.now()
  mockStore.saveMockUsers(users)
  updateCurrentUserState(target)
}

module.exports = {
  updateCurrentUserState,
  ensureCurrentUser,
  getCachedUser,
  isLoggedIn,
  isAdmin,
  loginWithWechatProfile,
  logoutCurrentUser,
  switchMockRole,
  updateUserMetrics
}
