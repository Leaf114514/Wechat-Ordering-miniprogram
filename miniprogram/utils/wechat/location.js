/**
 * 选择位置。
 * @param {Object} options - wx.chooseLocation 配置。
 * @returns {Promise<Object>} 位置结果。
 */
function chooseLocation(options) {
  return new Promise((resolve, reject) => {
    wx.chooseLocation(Object.assign({}, options, {
      success: resolve,
      fail: reject
    }))
  })
}

/**
 * 打开地图位置。
 * @param {Object} options - wx.openLocation 配置。
 * @returns {*} wx.openLocation 返回值。
 */
function openLocation(options) {
  return wx.openLocation(options)
}

module.exports = {
  chooseLocation,
  openLocation
}
