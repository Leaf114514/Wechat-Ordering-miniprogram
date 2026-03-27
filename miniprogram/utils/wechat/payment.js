/**
 * 使用 Promise 风格封装微信支付。
 * 真实支付参数不足时可通过 mock 标记走演示流程，保证小程序可运行。
 * @param {Object} options - 支付参数。
 * @returns {Promise<Object>} 支付结果。
 */
function requestPayment(options) {
  const paymentOptions = Object.assign({}, options)

  if (paymentOptions.mock) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ errMsg: 'requestPayment:mockok' })
      }, 300)
    })
  }

  delete paymentOptions.mock

  return new Promise((resolve, reject) => {
    wx.requestPayment(Object.assign({}, paymentOptions, {
      success: resolve,
      fail: reject
    }))
  })
}

module.exports = {
  requestPayment
}
