const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

/**
 * 基于菜品和规格构建安全订单明细。
 * @param {Array} cartItems - 客户端购物车。
 * @param {Object} dishMap - 菜品映射。
 * @returns {{items:Array,totalPrice:number}} 安全订单结果。
 */
function buildOrderItems(cartItems, dishMap) {
  return cartItems.reduce(
    (accumulator, cartItem) => {
      const dish = dishMap[cartItem.dishId]
      const safeSelections = (cartItem.selections || []).map((selection) => ({
        groupName: selection.groupName,
        optionLabel: selection.optionLabel,
        delta: Number(selection.delta || 0)
      }))
      const extraPrice = safeSelections.reduce((sum, selection) => {
        return sum + Number(selection.delta || 0)
      }, 0)
      const unitPrice = Number(dish.price) + extraPrice

      accumulator.items.push({
        itemKey: cartItem.itemKey,
        dishId: dish._id,
        name: dish.name,
        image: dish.image,
        quantity: cartItem.quantity,
        price: unitPrice,
        selections: safeSelections
      })
      accumulator.totalPrice += unitPrice * cartItem.quantity
      return accumulator
    },
    {
      items: [],
      totalPrice: 0
    }
  )
}

/**
 * 交易式提交订单并扣减库存。
 * @param {Object} event - 云函数入参。
 * @returns {Promise<Object>} 下单结果。
 */
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const { userId, cartItems = [], remark = '', idempotencyToken = '' } = event

  if (!userId || !idempotencyToken || !cartItems.length) {
    return {
      code: 400,
      message: '缺少必要下单参数'
    }
  }

  try {
    const existed = await db
      .collection('orders')
      .where({ dedupToken: idempotencyToken })
      .limit(1)
      .get()

    if (existed.data.length) {
      return {
        code: 0,
        data: existed.data[0],
        duplicate: true
      }
    }

    const orderData = await db.runTransaction(async (transaction) => {
      const dishIds = cartItems.map((item) => item.dishId)
      const dishResult = await transaction
        .collection('dishes')
        .where({ _id: _.in(dishIds) })
        .get()
      const dishMap = dishResult.data.reduce((accumulator, dish) => {
        accumulator[dish._id] = dish
        return accumulator
      }, {})

      cartItems.forEach((item) => {
        const dish = dishMap[item.dishId]
        if (!dish || !dish.isAvailable) {
          throw new Error(`${item.name} 已下架，请刷新菜单`)
        }
        if (dish.stock < item.quantity) {
          throw new Error(`${item.name} 库存不足，请稍后重试`)
        }
      })

      const safeOrder = buildOrderItems(cartItems, dishMap)
      const now = Date.now()
      const orderRecord = {
        userId,
        openId: wxContext.OPENID,
        status: 'pending_payment',
        totalPrice: Number(safeOrder.totalPrice.toFixed(2)),
        remark,
        dedupToken: idempotencyToken,
        items: safeOrder.items,
        stockRollbacked: false,
        statusTimeline: {
          pending_payment: now
        },
        createdAt: now,
        updatedAt: now
      }

      for (const item of safeOrder.items) {
        await transaction.collection('dishes').doc(item.dishId).update({
          data: {
            stock: _.inc(-item.quantity),
            sales: _.inc(item.quantity),
            updatedAt: now
          }
        })
      }

      const orderResult = await transaction.collection('orders').add({
        data: orderRecord
      })

      await transaction.collection('users').doc(userId).update({
        data: {
          orderCount: _.inc(1),
          totalSpend: _.inc(orderRecord.totalPrice),
          lastLoginAt: now,
          updatedAt: now
        }
      })

      return Object.assign({}, orderRecord, {
        _id: orderResult._id
      })
    })

    return {
      code: 0,
      data: orderData
    }
  } catch (error) {
    console.error('[placeOrder] failed', error)
    return {
      code: 500,
      message: error.message || '订单创建失败'
    }
  }
}
