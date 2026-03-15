const mockDishes = [
  {
    _id: 'dish-1001',
    name: '橙香嫩煎鸡腿饭',
    category: '招牌主食',
    price: 32,
    originPrice: 36,
    sales: 428,
    stock: 40,
    rating: 4.9,
    image: '/assets/dishes/dish-1.png',
    isManualRecommend: true,
    description: '慢煎鸡腿搭配橙香酱汁与时蔬沙拉。',
    tags: ['爆款', '低油'],
    isAvailable: true,
    specs: [
      {
        name: '口味',
        required: true,
        options: [
          { label: '经典原味', delta: 0 },
          { label: '蜜汁橙香', delta: 2 },
          { label: '黑椒炙烤', delta: 3 }
        ]
      },
      {
        name: '辣度',
        required: true,
        options: [
          { label: '不辣', delta: 0 },
          { label: '微辣', delta: 0 },
          { label: '热辣', delta: 1 }
        ]
      }
    ]
  },
  {
    _id: 'dish-1002',
    name: '奶油南瓜菌菇面',
    category: '暖胃汤面',
    price: 28,
    originPrice: 30,
    sales: 312,
    stock: 28,
    rating: 4.8,
    image: '/assets/dishes/dish-2.png',
    description: '南瓜泥与菌菇熬制浓汤，口感温润顺滑。',
    tags: ['暖胃', '人气'],
    isAvailable: true,
    specs: [
      {
        name: '面量',
        required: true,
        options: [
          { label: '标准', delta: 0 },
          { label: '加量', delta: 4 }
        ]
      },
      {
        name: '加料',
        required: true,
        options: [
          { label: '无加料', delta: 0 },
          { label: '温泉蛋', delta: 3 },
          { label: '培根片', delta: 4 }
        ]
      }
    ]
  },
  {
    _id: 'dish-1003',
    name: '炙烤牛肉能量碗',
    category: '轻食能量',
    price: 36,
    originPrice: 39,
    sales: 288,
    stock: 35,
    rating: 4.9,
    image: '/assets/dishes/dish-3.png',
    description: '谷物饭、牛肉片、玉米与牛油果一次满足。',
    tags: ['高蛋白', '精选'],
    isAvailable: true,
    specs: [
      {
        name: '酱汁',
        required: true,
        options: [
          { label: '和风芝麻', delta: 0 },
          { label: '凯撒风味', delta: 1 },
          { label: '香辣油醋', delta: 1 }
        ]
      },
      {
        name: '谷物底',
        required: true,
        options: [
          { label: '藜麦饭', delta: 0 },
          { label: '糙米饭', delta: 0 },
          { label: '双拼', delta: 2 }
        ]
      }
    ]
  },
  {
    _id: 'dish-1004',
    name: '焦糖南瓜布丁',
    category: '甜品饮品',
    price: 16,
    originPrice: 18,
    sales: 256,
    stock: 52,
    rating: 4.7,
    image: '/assets/dishes/dish-4.png',
    description: '焦糖脆面搭配南瓜布丁，细腻不甜腻。',
    tags: ['甜品', '新品'],
    isAvailable: true,
    specs: [
      {
        name: '甜度',
        required: true,
        options: [
          { label: '标准甜', delta: 0 },
          { label: '轻甜', delta: 0 }
        ]
      }
    ]
  },
  {
    _id: 'dish-1005',
    name: '蒜香脆薯配辣酱',
    category: '轻食能量',
    price: 14,
    originPrice: 16,
    sales: 365,
    stock: 60,
    rating: 4.8,
    image: '/assets/dishes/dish-5.png',
    description: '现炸细薯条，外脆内绵，适合拼单加购。',
    tags: ['加购必选', '热销'],
    isAvailable: true,
    specs: [
      {
        name: '蘸酱',
        required: true,
        options: [
          { label: '番茄酱', delta: 0 },
          { label: '蛋黄酱', delta: 1 },
          { label: '香辣酱', delta: 1 }
        ]
      }
    ]
  },
  {
    _id: 'dish-1006',
    name: '茉莉橙柚气泡饮',
    category: '甜品饮品',
    price: 18,
    originPrice: 20,
    sales: 229,
    stock: 45,
    rating: 4.6,
    image: '/assets/dishes/dish-6.png',
    isManualRecommend: true,
    description: '茉莉茶底融合柚子果香，清爽解腻。',
    tags: ['清爽', '当季'],
    isAvailable: true,
    specs: [
      {
        name: '冰量',
        required: true,
        options: [
          { label: '去冰', delta: 0 },
          { label: '少冰', delta: 0 },
          { label: '标准冰', delta: 0 }
        ]
      },
      {
        name: '甜度',
        required: true,
        options: [
          { label: '三分糖', delta: 0 },
          { label: '五分糖', delta: 0 },
          { label: '七分糖', delta: 0 }
        ]
      }
    ]
  },
  {
    _id: 'dish-1007',
    name: '番茄炖牛腩饭',
    category: '招牌主食',
    price: 34,
    originPrice: 38,
    sales: 341,
    stock: 30,
    rating: 4.9,
    image: '/assets/dishes/dish-3.png',
    description: '番茄汤汁慢炖牛腩，配粒粒分明米饭。',
    tags: ['经典', '暖心'],
    isAvailable: true,
    specs: [
      {
        name: '配菜',
        required: true,
        options: [
          { label: '时蔬', delta: 0 },
          { label: '溏心蛋', delta: 3 },
          { label: '芝士焗南瓜', delta: 4 }
        ]
      }
    ]
  },
  {
    _id: 'dish-1008',
    name: '鲜蔬豆乳乌冬',
    category: '暖胃汤面',
    price: 26,
    originPrice: 29,
    sales: 205,
    stock: 22,
    rating: 4.7,
    image: '/assets/dishes/dish-2.png',
    description: '豆乳汤底细腻柔和，鲜蔬口感更轻盈。',
    tags: ['素食友好', '轻负担'],
    isAvailable: true,
    specs: [
      {
        name: '配料',
        required: true,
        options: [
          { label: '标准', delta: 0 },
          { label: '双倍鲜蔬', delta: 3 },
          { label: '嫩豆腐', delta: 2 }
        ]
      }
    ]
  }
]

module.exports = {
  mockDishes
}
