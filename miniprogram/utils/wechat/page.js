/**
 * 安全结束下拉刷新，避免低版本或非页面上下文报错。
 */
function stopPullDownRefresh() {
  if (typeof wx.stopPullDownRefresh === 'function') {
    wx.stopPullDownRefresh()
  }
}

/**
 * 在下拉刷新场景下统一执行任务，并在结束时自动关闭刷新动画。
 * @param {Function} task - 刷新期间需要执行的异步任务。
 * @returns {Promise<*>} 异步任务结果。
 */
async function withPullDownRefresh(task) {
  if (typeof task !== 'function') {
    throw new TypeError('withPullDownRefresh 需要传入异步任务函数')
  }

  try {
    return await task()
  } finally {
    stopPullDownRefresh()
  }
}

module.exports = {
  stopPullDownRefresh,
  withPullDownRefresh
}
