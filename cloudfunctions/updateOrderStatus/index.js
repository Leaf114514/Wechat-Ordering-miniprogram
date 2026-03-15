const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const ORDER_FLOW = {
  pending_payment: ['preparing', 'cancelled'],
  preparing: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
}

/**
 * 判断状态是否允许流转。
 * @param {string} currentStatus - 当前状态。
 * @param {string} nextStatus - 下一状态。
 * @returns {boolean} 是否允许。
 */
function canTransit(currentStatus, nextStatus) {
  return (ORDER_FLOW[currentStatus] || []).indexOf(nextStatus) > -1
}

/**
 * 更新订单状态并按需回滚库存。
 * @param {Object} event - 云函数入参。
 * @returns {Promise<Object>} 处理结果。
 */
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { orderId, nextStatus, operatorRole = 'customer' } = event

  if (!orderId || !nextStatus) {
    return {
      code: 400,
      message: '缺少状态更新参数'
    }
  }

  try {
    const updatedOrder = await db.runTransaction(async (transaction) => {
      const orderResult = await transaction.collection('orders').doc(orderId).get()
      const order = orderResult.data

      if (!order) {
        throw new Error('订单不存在')
      }
      if (operatorRole !== 'admin' && order.openId !== wxContext.OPENID) {
        throw new Error('无权更新当前订单')
      }
      if (!canTransit(order.status, nextStatus)) {
        throw new Error('当前订单状态不允许该操作')
      }

      const now = Date.now()
      const updates = {
        status: nextStatus,
        updatedAt: now,
        [`statusTimeline.${nextStatus}`]: now
      }

      if (nextStatus === 'cancelled' && !order.stockRollbacked) {
        for (const item of order.items) {
          await transaction.collection('dishes').doc(item.dishId).update({
            data: {
              stock: _.inc(item.quantity),
              sales: _.inc(-item.quantity),
              updatedAt: now
            }
          })
        }
        updates.stockRollbacked = true
      }

      await transaction.collection('orders').doc(orderId).update({
        data: updates
      })

      return Object.assign({}, order, updates)
    })

    return {
      code: 0,
      data: updatedOrder
    }
  } catch (error) {
    console.error('[updateOrderStatus] failed', error)
    return {
      code: 500,
      message: error.message || '订单状态更新失败'
    }
  }
}
