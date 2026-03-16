/**
 * 使用 Promise 风格调用微信登录接口。
 * @param {Object} options - wx.login 可选参数。
 * @returns {Promise<Object>} 登录结果。
 */
function login(options) {
  return new Promise((resolve, reject) => {
    wx.login(Object.assign({}, options, {
      success: resolve,
      fail: reject
    }))
  })
}

/**
 * 获取微信登录 code，供服务层换取登录态。
 * @param {Object} options - wx.login 可选参数。
 * @returns {Promise<string>} 微信登录 code。
 */
async function getLoginCode(options) {
  const result = await login(options)
  return result.code || ''
}

module.exports = {
  login,
  getLoginCode
}
