# 云函数接口文档

> 建议结合 `docs/cloud-functions.md` 一起阅读。本文更偏向接口入参与返回结构示例。

## `loginUser`

- 说明：结合微信登录态同步当前用户，并写入 `users` 集合

### 入参示例

```json
{
  "loginCode": "0812abc",
  "profile": {
    "nickname": "暖橙食客",
    "avatarUrl": "cloud://xxx/avatar.png"
  }
}
```

### 返回示例

```json
{
  "code": 0,
  "data": {
    "_id": "user-demo",
    "openId": "o123",
    "nickname": "暖橙食客",
    "avatarUrl": "cloud://xxx/avatar.png",
    "role": "customer"
  }
}
```

## `placeOrder`

- 说明：事务化创建订单并扣减库存，支持 `idempotencyToken` 防重复提交

### 入参示例

```json
{
  "userId": "user-demo",
  "remark": "少冰，不要香菜",
  "idempotencyToken": "user-demo-1773560400000-11",
  "cartItems": [
    {
      "itemKey": "dish-1001__口味-蜜汁橙香|辣度-不辣",
      "dishId": "dish-1001",
      "name": "橙香嫩煎鸡腿饭",
      "quantity": 1,
      "price": 34,
      "selections": [
        {
          "groupName": "口味",
          "optionLabel": "蜜汁橙香",
          "delta": 2
        }
      ]
    }
  ]
}
```

### 返回示例

```json
{
  "code": 0,
  "data": {
    "_id": "order-abc",
    "status": "pending_payment",
    "totalPrice": 34,
    "items": []
  }
}
```

## `updateOrderStatus`

- 说明：按订单状态机更新状态，并在取消时回滚库存

### 入参示例

```json
{
  "orderId": "order-abc",
  "nextStatus": "preparing",
  "operatorRole": "admin"
}
```

### 返回示例

```json
{
  "code": 0,
  "data": {
    "_id": "order-abc",
    "status": "preparing",
    "statusTimeline": {
      "preparing": 1773560400000
    }
  }
}
```

## `recommendDishes`

- 说明：基于历史已完成订单做协同过滤推荐

### 入参示例

```json
{
  "userId": "user-demo",
  "limit": 4
}
```

### 返回示例

```json
{
  "code": 0,
  "data": [
    {
      "_id": "dish-1007",
      "name": "番茄炖牛腩饭",
      "reason": "与你口味相近的食客也常点这道菜"
    }
  ]
}
```

## `manageDish`

- 说明：管理员新增、编辑、上下架菜品，以及配置首页推荐

### 新增 / 编辑示例

```json
{
  "action": "save",
  "payload": {
    "name": "奶油蘑菇汤",
    "category": "暖胃汤面",
    "price": 22,
    "stock": 30,
    "description": "今日现熬",
    "isManualRecommend": true
  }
}
```

### 推荐配置示例

```json
{
  "action": "recommend",
  "payload": {
    "dishId": "dish-1001",
    "isManualRecommend": true
  }
}
```

## `adminDashboard`

- 说明：管理员经营概览统计

### 返回示例

```json
{
  "code": 0,
  "data": {
    "totalOrders": 128,
    "totalRevenue": 3890,
    "totalRevenueText": "3890.00",
    "pendingCount": 6,
    "availableDishCount": 18,
    "topDishes": []
  }
}
```
