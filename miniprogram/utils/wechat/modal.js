/**
 * 使用 Promise 风格调用微信确认弹窗。
 * @param {Object} options - 弹窗配置。
 * @returns {Promise<Object>} 弹窗结果。
 */
function showModal(options) {
  return new Promise((resolve, reject) => {
    wx.showModal(Object.assign({}, options, {
      success: resolve,
      fail: reject
    }))
  })
}

/**
 * 显示确认弹窗，并直接返回用户是否确认。
 * @param {Object} options - 弹窗配置。
 * @returns {Promise<boolean>} 用户是否确认。
 */
async function confirm(options) {
  const result = await showModal(Object.assign({
    confirmColor: '#ff8c00'
  }, options))
  return Boolean(result.confirm)
}

/**
 * 显示仅确认按钮的信息弹窗。
 * @param {Object} options - 弹窗配置。
 * @returns {Promise<Object>} 弹窗结果。
 */
function alert(options) {
  return showModal(Object.assign({
    showCancel: false,
    confirmColor: '#ff8c00'
  }, options))
}

module.exports = {
  showModal,
  confirm,
  alert
}
