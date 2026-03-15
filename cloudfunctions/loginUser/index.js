const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const DEFAULT_AVATAR_URL = '/images/icons/avatar.png'

/**
 * 登录并同步用户档案。
 * @param {Object} event - 云函数入参。
 * @returns {Promise<Object>} 用户资料。
 */
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID
  const profile = event.profile || {}
  const safeNickname = profile.nickname
    ? String(profile.nickname).trim()
    : '微信用户'
  const safeAvatarUrl = profile.avatarUrl || DEFAULT_AVATAR_URL
  const now = Date.now()

  try {
    const users = await db
      .collection('users')
      .where({ openId })
      .limit(1)
      .get()

    if (users.data.length) {
      const currentUser = users.data[0]
      const updates = {
        lastLoginAt: now,
        updatedAt: now
      }

      if (safeNickname) {
        updates.nickname = safeNickname
      }
      if (safeAvatarUrl) {
        updates.avatarUrl = safeAvatarUrl
      }

      await db.collection('users').doc(currentUser._id).update({
        data: updates
      })

      return {
        code: 0,
        data: Object.assign({}, currentUser, updates)
      }
    }

    const createdUser = {
      openId,
      nickname: safeNickname,
      avatarUrl: safeAvatarUrl,
      role: 'customer',
      favoriteCategories: [],
      orderCount: 0,
      totalSpend: 0,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now
    }
    const createResult = await db.collection('users').add({
      data: createdUser
    })

    return {
      code: 0,
      data: Object.assign({}, createdUser, {
        _id: createResult._id
      })
    }
  } catch (error) {
    console.error('[loginUser] failed', error)
    return {
      code: 500,
      message: error.message || '用户初始化失败'
    }
  }
}
