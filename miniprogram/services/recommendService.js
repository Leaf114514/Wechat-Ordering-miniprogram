const { ORDER_STATUS } = require('../constants/index')
const cloudService = require('./cloudService')
const mockStore = require('./mockStore')
const dishService = require('./dishService')

/**
 * 计算用户相似度。
 * @param {Object} baseVector - 当前用户偏好向量。
 * @param {Object} compareVector - 目标用户偏好向量。
 * @returns {number} 相似度分数。
 */
function calculateSimilarity(baseVector, compareVector) {
  const baseKeys = Object.keys(baseVector)
  const compareKeys = Object.keys(compareVector)
  const overlapKeys = baseKeys.filter((item) => compareKeys.indexOf(item) > -1)

  if (!overlapKeys.length) {
    return 0
  }

  const dot = overlapKeys.reduce((sum, key) => {
    return sum + baseVector[key] * compareVector[key]
  }, 0)
  const baseNorm = Math.sqrt(
    baseKeys.reduce((sum, key) => sum + baseVector[key] * baseVector[key], 0)
  )
  const compareNorm = Math.sqrt(
    compareKeys.reduce(
      (sum, key) => sum + compareVector[key] * compareVector[key],
      0
    )
  )

  return dot / (baseNorm * compareNorm)
}

/**
 * 构建用户偏好向量。
 * @param {Array} orders - 订单列表。
 * @returns {Object} 偏好向量 map。
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
 * 获取智能推荐列表。
 * @param {Object} params - 查询参数。
 * @param {string} params.userId - 用户 ID。
 * @param {number} params.limit - 返回数量。
 * @returns {Promise<Array>} 推荐菜品列表。
 */
async function getPersonalRecommendations(params) {
  const options = params || {}
  const userId = options.userId
  const limit = options.limit || 4

  if (!userId) {
    return []
  }

  if (!cloudService.shouldUseMock()) {
    const result = await cloudService.callCloudFunction('recommendDishes', {
      userId,
      limit
    })
    if (result.result.code !== 0) {
      throw new Error(result.result.message || '推荐获取失败')
    }
    return result.result.data || []
  }

  const dishes = await dishService.getAllDishes(false)
  const orders = mockStore
    .getMockOrders()
    .filter((item) => item.status === ORDER_STATUS.COMPLETED)
  const vectors = buildUserVectors(orders)
  const baseVector = vectors[userId] || {}
  const ownedDishIds = Object.keys(baseVector)

  if (!ownedDishIds.length) {
    return dishes.slice(0, limit).map((item) => {
      item.reason = '热销优先推荐'
      return item
    })
  }

  const scoreMap = {}
  Object.keys(vectors).forEach((targetUserId) => {
    if (targetUserId === userId) {
      return
    }

    const similarity = calculateSimilarity(baseVector, vectors[targetUserId])
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
    .map((dishId) => dishes.find((item) => item._id === dishId))
    .filter(Boolean)
    .slice(0, limit)
    .map((item) => {
      item.reason = '与你口味相近的食客也常点这道'
      return item
    })

  if (recommended.length) {
    return recommended
  }

  return dishes.slice(0, limit).map((item) => {
    item.reason = '根据热销榜补充推荐'
    return item
  })
}

module.exports = {
  getPersonalRecommendations
}
