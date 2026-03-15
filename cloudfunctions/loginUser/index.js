const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 登录并同步用户档案。
 * @returns {Promise<Object>} 用户资料。
 */
exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID

  try {
    const users = await db
      .collection('users')
      .where({ openId })
      .limit(1)
      .get()

    if (users.data.length) {
      const currentUser = users.data[0]
      await db.collection('users').doc(currentUser._id).update({
        data: {
          lastLoginAt: Date.now()
        }
      })

      return {
        code: 0,
        data: Object.assign({}, currentUser, {
          lastLoginAt: Date.now()
        })
      }
    }

    const createdUser = {
      openId,
      nickname: '微信食客',
      avatarUrl: '/images/icons/avatar.png',
      role: 'customer',
      favoriteCategories: [],
      orderCount: 0,
      totalSpend: 0,
      lastLoginAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
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
