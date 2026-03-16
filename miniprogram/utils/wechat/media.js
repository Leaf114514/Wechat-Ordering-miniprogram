/**
 * 选择单张图片，适合菜品图或头像补充场景。
 * @param {Object} options - wx.chooseMedia 配置。
 * @returns {Promise<string>} 选中的本地图片路径。
 */
function chooseSingleImage(options) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia(Object.assign({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(result) {
        const file = result.tempFiles && result.tempFiles[0]
        resolve(file ? file.tempFilePath : '')
      },
      fail: reject
    }, options))
  })
}

/**
 * 预览图片。
 * @param {Array<string>} urls - 图片列表。
 * @param {string} current - 当前高亮图片。
 * @returns {*} wx.previewImage 返回值。
 */
function previewImages(urls, current) {
  return wx.previewImage({
    urls,
    current: current || urls[0]
  })
}

module.exports = {
  chooseSingleImage,
  previewImages
}
