const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 校验管理员权限。
 * @param {string} openId - 用户 openId。
 * @returns {Promise<void>} 校验结果。
 */
async function ensureAdmin(openId) {
  const userResult = await db
    .collection('users')
    .where({ openId, role: 'admin' })
    .limit(1)
    .get()

  if (!userResult.data.length) {
    throw new Error('当前账号无管理员权限')
  }
}

/**
 * 处理菜品管理写操作。
 * @param {Object} event - 云函数参数。
 * @returns {Promise<Object>} 返回结果。
 */
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { action = '', payload = {} } = event

  try {
    await ensureAdmin(wxContext.OPENID)

    if (action === 'save') {
      const now = Date.now()
      const safePayload = {
        name: payload.name,
        category: payload.category,
        price: Number(payload.price),
        stock: Number(payload.stock),
        description: payload.description || '',
        image: payload.image || '/assets/dishes/dish-6.png',
        isAvailable: payload.isAvailable !== false,
        specs: payload.specs || [
          {
            name: '规格',
            required: true,
            options: [{ label: '标准', delta: 0 }]
          }
        ],
        updatedAt: now
      }

      if (payload._id) {
        await db.collection('dishes').doc(payload._id).update({
          data: safePayload
        })

        return {
          code: 0,
          data: Object.assign({}, safePayload, { _id: payload._id })
        }
      }

      const createResult = await db.collection('dishes').add({
        data: Object.assign({}, safePayload, {
          originPrice: Number(payload.price),
          sales: 0,
          rating: 4.8,
          createdAt: now
        })
      })

      return {
        code: 0,
        data: Object.assign({}, safePayload, {
          _id: createResult._id,
          originPrice: Number(payload.price),
          sales: 0,
          rating: 4.8,
          createdAt: now
        })
      }
    }

    if (action === 'toggle') {
      await db.collection('dishes').doc(payload.dishId).update({
        data: {
          isAvailable: payload.isAvailable,
          updatedAt: Date.now()
        }
      })

      return {
        code: 0,
        data: {
          _id: payload.dishId,
          isAvailable: payload.isAvailable
        }
      }
    }

    return {
      code: 400,
      message: '不支持的菜品管理操作'
    }
  } catch (error) {
    console.error('[manageDish] failed', error)
    return {
      code: 500,
      message: error.message || '菜品管理失败'
    }
  }
}
