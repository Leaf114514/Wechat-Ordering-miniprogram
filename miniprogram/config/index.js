const CLOUD_ENV_ID = ''
const PAGE_SIZE = 8

const restaurantProfile = {
  name: '暖橙食堂',
  slogan: '新鲜现做，15 分钟内出餐',
  address: '云开发示例店 · 轻食热饭一体厨房'
}

module.exports = {
  cloudEnvId: CLOUD_ENV_ID,
  useMockData: !CLOUD_ENV_ID,
  pageSize: PAGE_SIZE,
  restaurantProfile
}
