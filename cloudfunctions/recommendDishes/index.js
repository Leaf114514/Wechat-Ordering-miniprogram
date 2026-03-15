const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 计算用户相似度。
 * @param {Object} baseVector - 当前用户向量。
 * @param {Object} targetVector - 目标用户向量。
 * @returns {number} 相似度。
 */
function calculateSimilarity(baseVector, targetVector) {
  const baseKeys = Object.keys(baseVector)
  const overlapKeys = baseKeys.filter((dishId) => targetVector[dishId])

  if (!overlapKeys.length) {
    return 0
  }

  const dot = overlapKeys.reduce((sum, dishId) => {
    return sum + baseVector[dishId] * targetVector[dishId]
  }, 0)
  const baseNorm = Math.sqrt(
    baseKeys.reduce((sum, dishId) => sum + baseVector[dishId] ** 2, 0)
  )
  const targetNorm = Math.sqrt(
    Object.keys(targetVector).reduce((sum, dishId) => {
      return sum + targetVector[dishId] ** 2
    }, 0)
  )

  return dot / (baseNorm * targetNorm)
}

/**
 * 构建已完成订单的用户向量。
 * @param {Array} orders - 订单数组。
 * @returns {Object} 向量 map。
 */
function buildUserVectors(orders) {
  return orders.reduce((accumulator, order) => {
    if (!accumulator[order.userId]) {
      accumulator[order.userId] = {}
    }

    order.items.forEach((item) => {
      accumulator[order.userId][item.dishId] =
        (accumulator[order.userId][item.dishId] || 0) + item.quantity
    })

    return accumulator
  }, {})
}

/**
 * 基于协同过滤推荐菜品。
 * @param {Object} event - 云函数参数。
 * @returns {Promise<Object>} 推荐结果。
 */
exports.main = async (event) => {
  const { userId, limit = 6 } = event

  if (!userId) {
    return {
      code: 400,
      message: '缺少用户 ID'
    }
  }

  try {
    const [orderResult, dishResult] = await Promise.all([
      db.collection('orders').where({ status: 'completed' }).get(),
      db.collection('dishes').where({ isAvailable: true }).get()
    ])
    const vectors = buildUserVectors(orderResult.data || [])
    const currentVector = vectors[userId] || {}
    const dishes = dishResult.data || []
    const ownedDishIds = Object.keys(currentVector)

    if (!ownedDishIds.length) {
      return {
        code: 0,
        data: dishes.slice(0, limit).map((dish) => {
          dish.reason = '热销优先推荐'
          return dish
        })
      }
    }

    const scoreMap = {}
    Object.keys(vectors).forEach((targetUserId) => {
      if (targetUserId === userId) {
        return
      }

      const similarity = calculateSimilarity(currentVector, vectors[targetUserId])
      if (!similarity) {
        return
      }

      Object.keys(vectors[targetUserId]).forEach((dishId) => {
        if (ownedDishIds.indexOf(dishId) > -1) {
          return
        }

        scoreMap[dishId] =
          (scoreMap[dishId] || 0) + vectors[targetUserId][dishId] * similarity
      })
    })

    const sortedDishIds = Object.keys(scoreMap).sort((left, right) => {
      return scoreMap[right] - scoreMap[left]
    })
    const recommended = sortedDishIds
      .map((dishId) => dishes.find((dish) => dish._id === dishId))
      .filter(Boolean)
      .slice(0, limit)
      .map((dish) => {
        dish.reason = '与你口味相近的食客也常点这道'
        return dish
      })

    return {
      code: 0,
      data: recommended.length
        ? recommended
        : dishes.slice(0, limit).map((dish) => {
            dish.reason = '根据热销榜补充推荐'
            return dish
          })
    }
  } catch (error) {
    console.error('[recommendDishes] failed', error)
    return {
      code: 500,
      message: error.message || '推荐生成失败'
    }
  }
}
