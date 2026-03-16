/**
 * 将金额格式化为两位小数。
 * @param {number|string} amount - 原始金额。
 * @returns {string} 金额字符串。
 */
function formatCurrency(amount) {
  return Number(amount || 0).toFixed(2)
}

/**
 * 将时间戳格式化为展示文本。
 * @param {number|string|Date} timestamp - 时间值。
 * @returns {string} 格式化结果。
 */
function formatTimestamp(timestamp) {
  if (!timestamp) {
    return '--'
  }

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 组合规格描述。
 * @param {Array} selections - 已选规格数组。
 * @returns {string} 规格展示文本。
 */
function joinSelections(selections) {
  if (!Array.isArray(selections) || !selections.length) {
    return '标准份'
  }

  return selections
    .map((item) => `${item.groupName}:${item.optionLabel}`)
    .join(' / ')
}

/**
 * 深拷贝普通对象。
 * @param {*} value - 任意值。
 * @returns {*} 深拷贝结果。
 */
function clonePlainData(value) {
  return JSON.parse(JSON.stringify(value))
}

module.exports = {
  formatCurrency,
  formatTimestamp,
  joinSelections,
  clonePlainData
}
