/**
 * 统一规范提示参数，兼容直接传字符串和传完整配置对象两种写法。
 * @param {string|Object} options - 提示配置。
 * @param {Object} defaults - 默认配置。
 * @returns {Object} 标准化后的提示配置。
 */
function normalizeOptions(options, defaults) {
  if (typeof options === 'string') {
    return Object.assign({}, defaults, { title: options })
  }

  return Object.assign({}, defaults, options)
}

/**
 * 显示通用消息提示。
 * @param {string|Object} options - toast 配置。
 * @returns {*} wx.showToast 的返回结果。
 */
function showToast(options) {
  return wx.showToast(normalizeOptions(options, {}))
}

/**
 * 显示成功提示。
 * @param {string|Object} options - 成功提示配置。
 * @returns {*} wx.showToast 的返回结果。
 */
function showSuccess(options) {
  return showToast(normalizeOptions(options, { icon: 'success' }))
}

/**
 * 显示错误提示。
 * @param {string|Object} options - 错误提示配置。
 * @returns {*} wx.showToast 的返回结果。
 */
function showError(options) {
  return showToast(normalizeOptions(options, { icon: 'none' }))
}

/**
 * 显示加载提示。
 * @param {string|Object} options - loading 配置。
 * @returns {*} wx.showLoading 的返回结果。
 */
function showLoading(options) {
  return wx.showLoading(normalizeOptions(options, { mask: true }))
}

/**
 * 关闭加载提示。
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 在统一的加载态下执行异步任务，避免页面层重复写 show/hide。
 * @param {string|Object} options - loading 配置。
 * @param {Function} task - 需要执行的异步任务。
 * @returns {Promise<*>} 异步任务结果。
 */
async function withLoading(options, task) {
  if (typeof task !== 'function') {
    throw new TypeError('withLoading 需要传入异步任务函数')
  }

  showLoading(options)
  try {
    return await task()
  } finally {
    hideLoading()
  }
}

module.exports = {
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  withLoading
}
