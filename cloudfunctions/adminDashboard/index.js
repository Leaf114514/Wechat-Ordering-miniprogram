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
 * 获取经营统计面板。
 * @returns {Promise<Object>} 仪表盘结果。
 */
exports.main = async () => {
  const wxContext = cloud.getWXContext()

  try {
    await ensureAdmin(wxContext.OPENID)
    const [orderResult, dishResult] = await Promise.all([
      db.collection('orders').get(),
      db.collection('dishes').get()
    ])
    const orders = orderResult.data || []
    const dishes = dishResult.data || []
    const validOrders = orders.filter((order) => order.status !== 'cancelled')
    const totalRevenue = validOrders.reduce((sum, order) => {
      return sum + Number(order.totalPrice || 0)
    }, 0)
    const pendingCount = orders.filter((order) => {
      return order.status === 'pending_payment' || order.status === 'preparing'
    }).length
    const topDishes = dishes
      .slice()
      .sort((left, right) => right.sales - left.sales)
      .slice(0, 5)

    return {
      code: 0,
      data: {
        totalOrders: orders.length,
        totalRevenue,
        totalRevenueText: totalRevenue.toFixed(2),
        pendingCount,
        availableDishCount: dishes.filter((dish) => dish.isAvailable).length,
        topDishes
      }
    }
  } catch (error) {
    console.error('[adminDashboard] failed', error)
    return {
      code: 500,
      message: error.message || '统计数据获取失败'
    }
  }
}
