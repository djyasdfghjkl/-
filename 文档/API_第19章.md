

### 19. 日记分析相关接口

#### 19.1 获取单篇日记分析结果

- **路径**：`GET /api/analysis/diary/{diary_id}`
- **描述**：获取指定日记的分析结果，如果没有分析结果会立即进行分析
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----- | ------ | -- | -------------- |
  | diary_id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "_id": "分析ID",
      "diary_id": "日记ID",
      "user_id": "用户ID",
      "sentiment": "positive",
      "sentiment_score": 0.5,
      "topics": ["生活", "工作"],
      "keywords": ["开心", "周末", "朋友"],
      "word_count": 500,
      "sentence_count": 10,
      "avg_sentence_length": 50.0,
      "created_at": "创建时间",
      "updated_at": "更新时间"
    }
  }
  ```

#### 19.2 重新分析日记

- **路径**：`POST /api/analysis/diary/{diary_id}`
- **描述**：重新分析指定日记
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----- | ------ | -- | -------------- |
  | diary_id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "分析成功",
    "data": {
      "_id": "分析ID",
      "diary_id": "日记ID",
      "user_id": "用户ID",
      "sentiment": "positive",
      "sentiment_score": 0.5,
      "topics": ["生活", "工作"],
      "keywords": ["开心", "周末", "朋友"],
      "word_count": 500,
      "sentence_count": 10,
      "avg_sentence_length": 50.0
    }
  }
  ```

#### 19.3 获取用户分析概览

- **路径**：`GET /api/analysis/overview` 或 `GET /api/user/analysis/overview`
- **描述**：获取用户的日记分析概览，包括情感分布、主题统计、写作习惯、关怀语录等
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total_diaries": 50,
      "total_words": 25000,
      "avg_sentiment": 0.25,
      "positive_ratio": 0.6,
      "neutral_ratio": 0.3,
      "negative_ratio": 0.1,
      "top_topics": [
        {"topic": "生活", "count": 30},
        {"topic": "工作", "count": 15},
        {"topic": "旅行", "count": 5}
      ],
      "top_keywords": [
        {"word": "开心", "count": 25},
        {"word": "周末", "count": 20},
        {"word": "朋友", "count": 15}
      ],
      "writing_times": {
        "morning": 10,
        "afternoon": 15,
        "evening": 20,
        "night": 5
      },
      "caring_message": "今天的你看起来心情不错呢！愿这份快乐延续到每一天 🌞",
      "streak_tips": "你已经连续记录7天啦！坚持是件了不起的事 🌟",
      "topic_tip": "工作压力是暂时的，记得照顾好自己 💼",
      "streak": 7
    }
  }
  ```

#### 19.4 获取情感趋势

- **路径**：`GET /api/analysis/sentiment-trend` 或 `GET /api/user/analysis/sentiment-trend`
- **描述**：获取用户的情感趋势数据，支持按天、周、月统计
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------------------------- |
  | type | string | 否 | 统计类型：day（天）、week（周）、month（月），默认day |
  | range | number | 否 | 统计数量，默认30 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "labels": ["2023-01-01", "2023-01-02", "2023-01-03"],
      "values": [0.5, 0.3, -0.2],
      "diary_counts": [1, 2, 1]
    }
  }
  ```

#### 19.5 获取主题情感关联

- **路径**：`GET /api/analysis/topic-sentiment`
- **描述**：获取用户各个主题的情感分布
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "topic": "生活",
        "positive": 20,
        "neutral": 8,
        "negative": 2,
        "avg": 0.45
      },
      {
        "topic": "工作",
        "positive": 5,
        "neutral": 6,
        "negative": 4,
        "avg": -0.1
      }
    ]
  }
  ```

#### 19.6 获取词云数据

- **路径**：`GET /api/analysis/wordcloud` 或 `GET /api/user/analysis/wordcloud`
- **描述**：获取用户的关键词词云数据
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------------------------- |
  | limit | number | 否 | 返回关键词数量，默认50 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {"word": "开心", "weight": 1.0},
      {"word": "周末", "weight": 0.8},
      {"word": "朋友", "weight": 0.6}
    ]
  }
  ```

#### 19.7 获取写作习惯

- **路径**：`GET /api/user/analysis/writing-habit`
- **描述**：获取用户的写作时段分布
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "writing_times": {
        "morning": 10,
        "afternoon": 15,
        "evening": 20,
        "night": 5
      },
      "total_diaries": 50
    }
  }
  ```

#### 19.8 按标签分析日记

- **路径**：`POST /api/analysis/tag`
- **描述**：按指定标签分析相关日记
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------- |
  | tags | array | 是 | 标签数组 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "tags": ["生活", "工作"],
      "total_diaries": 20,
      "avg_sentiment": 0.25,
      "sentiment_distribution": {
        "positive": 12,
        "neutral": 5,
        "negative": 3
      },
      "top_keywords": [
        {"word": "开心", "count": 10},
        {"word": "周末", "count": 8}
      ],
      "top_topics": [
        {"topic": "生活", "count": 15},
        {"topic": "工作", "count": 5}
      ],
      "diaries": [
        {
          "id": "日记ID",
          "title": "日记标题",
          "content": "日记内容...",
          "diary_date": "2023-01-01",
          "mood": "开心",
          "weather": "晴天",
          "tags": ["生活", "工作"],
          "analysis": {
            "sentiment": "positive",
            "sentiment_score": 0.5
          }
        }
      ]
    }
  }
  ```

#### 19.9 刷新关怀语录

- **路径**：`POST /api/analysis/caring-message/refresh`
- **描述**：刷新当前用户的关怀语录
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------------------------- |
  | sentiment | string | 否 | 情感类型：positive、neutral、negative |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": "别难过，明天会更好 💪"
  }
  ```
