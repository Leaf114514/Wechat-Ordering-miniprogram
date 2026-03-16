const CLOUD_ENV_ID = ''
const PAGE_SIZE = 8

/**
 * 餐厅基础信息配置。
 * 页面层只读取配置，不直接散落静态文案，便于后续统一维护。
 */
const restaurantProfile = {
  name: '暖橙食堂',
  slogan: '现点现做，15 分钟内出餐',
  address: '云开发示例店 · 轻食热饭一体厨房',
  businessHours: '10:00 - 21:30',
  pickupTimeText: '平均 12 分钟可取餐',
  perCapitaText: '人均 32 元',
  serviceTags: ['现做热餐', '轻食友好', '支持自取'],
  phone: '400-800-2026',
  latitude: 31.230416,
  longitude: 121.473701,
  coverImage: '/assets/dishes/dish-1.png'
}

module.exports = {
  cloudEnvId: CLOUD_ENV_ID,
  useMockData: !CLOUD_ENV_ID,
  pageSize: PAGE_SIZE,
  restaurantProfile
}
