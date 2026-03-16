/**
 * 微信能力统一出口。
 * 页面层和服务层只依赖这个聚合模块，避免直接耦合到内部文件结构。
 */
module.exports = {
  auth: require('./auth'),
  cloud: require('./cloud'),
  feedback: require('./feedback'),
  location: require('./location'),
  media: require('./media'),
  modal: require('./modal'),
  navigation: require('./navigation'),
  page: require('./page'),
  payment: require('./payment'),
  storage: require('./storage')
}
