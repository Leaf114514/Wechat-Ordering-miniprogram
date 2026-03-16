/**
 * 统一路由入参，兼容直接传 url 和传完整配置对象。
 * @param {string|Object} target - 目标页面。
 * @returns {Object} 标准化后的路由参数。
 */
function normalizeTarget(target) {
  if (typeof target === 'string') {
    return { url: target }
  }

  return target || {}
}

/**
 * 延迟执行指定任务，适合 toast 显示后再跳转。
 * @param {number} delay - 延迟毫秒数。
 * @param {Function} task - 需要执行的任务。
 * @returns {number} 定时器 ID。
 */
function runLater(delay, task) {
  return setTimeout(task, delay || 0)
}

/**
 * 保留当前页面并跳转到新页面。
 * @param {string|Object} target - 目标页面。
 * @returns {*} wx.navigateTo 的返回结果。
 */
function navigateTo(target) {
  return wx.navigateTo(normalizeTarget(target))
}

/**
 * 跳转到 tabBar 页面。
 * @param {string|Object} target - 目标页面。
 * @returns {*} wx.switchTab 的返回结果。
 */
function switchTab(target) {
  return wx.switchTab(normalizeTarget(target))
}

/**
 * 关闭当前页面并跳转到新页面。
 * @param {string|Object} target - 目标页面。
 * @returns {*} wx.redirectTo 的返回结果。
 */
function redirectTo(target) {
  return wx.redirectTo(normalizeTarget(target))
}

/**
 * 返回上一级页面。
 * @param {number} delta - 返回层级，默认 1。
 * @returns {*} wx.navigateBack 的返回结果。
 */
function navigateBack(delta) {
  return wx.navigateBack({ delta: delta || 1 })
}

/**
 * 根据页面类型自动决定使用 navigateTo 还是 switchTab。
 * @param {string|Object} target - 目标页面。
 * @returns {*} 路由执行结果。
 */
function open(target) {
  const options = normalizeTarget(target)
  if (options.isTab) {
    return switchTab(options)
  }

  return navigateTo(options)
}

/**
 * 延迟跳转到 tabBar 页面，常用于先提示再跳转。
 * @param {string|Object} target - 目标页面。
 * @param {number} delay - 延迟毫秒数。
 * @returns {number} 定时器 ID。
 */
function switchTabLater(target, delay) {
  return runLater(delay, () => {
    switchTab(target)
  })
}

module.exports = {
  navigateTo,
  switchTab,
  switchTabLater,
  redirectTo,
  navigateBack,
  open
}
