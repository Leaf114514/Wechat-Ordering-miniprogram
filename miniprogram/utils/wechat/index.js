/**
 * 微信能力统一出口。
 * 页面和服务层只依赖这个聚合模块，避免直接耦合到内部文件结构。
 */
module.exports = {
  auth: require('./auth'),
  feedback: require('./feedback'),
  navigation: require('./navigation'),
  page: require('./page'),
  storage: require('./storage')
}
