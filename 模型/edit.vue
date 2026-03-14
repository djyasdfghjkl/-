<template>
  <view class="diary-page">
    <!-- 顶部栏 -->
    <view class="top-bar">
      <view class="top-bar-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="date-picker" @click="selectDate">
        {{ formattedDate }}
      </view>
      <view class="top-bar-right" @click="saveDiary">
        <text class="save-text" :class="{ saved: isSaved }">{{
          saveButtonText
        }}</text>
      </view>
    </view>

    <!-- 纸张主体 -->
    <scroll-view
      class="paper"
      scroll-y
      :scroll-top="scrollTop"
      @scroll="onScroll"
    >
      <view class="paper-inner">
        <!-- 标题输入 -->
        <input
          type="text"
          class="title-input"
          v-model="title"
          placeholder="无题"
          placeholder-class="placeholder"
          @focus="onTitleFocus"
          @blur="onTitleBlur"
          maxlength="50"
        />
        <!-- 正文输入（使用 textarea） -->
        <textarea
          class="body-textarea"
          v-model="content"
          placeholder="写下你的故事..."
          placeholder-class="placeholder"
          @focus="onBodyFocus"
          @blur="onBodyBlur"
          @keydown.enter="onEnterKey"
          :auto-height="true"
          :maxlength="-1"
          :show-confirm-bar="false"
          :adjust-position="false"
          @keyboardheightchange="onKeyboardHeightChange"
        />
      </view>
    </scroll-view>

    <!-- 底部工具栏 -->
    <view class="toolbar" :style="{ bottom: keyboardHeight + 'px' }">
      <view class="toolbar-item" @click="formatText('bold')"
        ><text class="bold">B</text></view
      >
      <view class="toolbar-item" @click="formatText('italic')"
        ><text class="italic">I</text></view
      >
      <view class="toolbar-item" @click="formatText('underline')"
        ><text class="underline">U</text></view
      >
      <view class="toolbar-item" @click="insertImage"
        ><text class="image-icon">🖼️</text></view
      >
      <view class="toolbar-item" @click="insertEmoji"
        ><text class="emoji-icon">😊</text></view
      >
    </view>
  </view>
</template>

<script>
import { diaryApi } from '@/utils/api.js';

export default {
  data() {
    return {
      title: "",
      content: "",
      diaryDate: new Date(),
      isSaved: false,
      saveButtonText: "保存",
      keyboardHeight: 0,
      scrollTop: 0,
      isSaving: false,
      metaData: null,
    };
  },
  computed: {
    formattedDate() {
      const d = this.diaryDate;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const weekday = weekdays[d.getDay()];
      return `${year}年${month}月${day}日 ${weekday}`;
    },
  },
  onLoad(option) {
    if (option.meta) {
      try {
        this.metaData = JSON.parse(decodeURIComponent(option.meta));
        // 处理传递过来的元数据
        if (this.metaData.signature) {
          // 如果有签名，将其作为日记的开头
          this.content = this.metaData.signature + '\n\n';
        }
        // 其他元数据处理可以在这里添加
      } catch (e) {
        console.error('解析元数据失败:', e);
      }
    }
  },
  methods: {
    selectDate() {
      uni.chooseDate({
        success: (res) => {
          this.diaryDate = new Date(res.year, res.month, res.day);
        },
      });
    },
    saveDiary() {
      // 检查标题和内容
      if (!this.title.trim()) {
        uni.showToast({
          title: "请填写标题",
          icon: "none",
        });
        return;
      }

      if (!this.content.trim()) {
        uni.showToast({
          title: "请写下你的故事",
          icon: "none",
        });
        return;
      }

      this.isSaving = true;

      // 调用保存日记的API
      diaryApi.create({
        title: this.title,
        content: this.content,
        emotion: this.metaData?.moodIndex !== null ? this.metaData.moodIndex : "",
        date: this.diaryDate.toISOString(),
        location: this.metaData?.location || "",
        tags: this.metaData?.tags || ""
      })
      .then((res) => {
        this.isSaving = false;
        if (res.success) {
          this.isSaved = true;
          this.saveButtonText = "已保存";
          uni.showToast({
            title: "日记保存成功",
            icon: "success",
          });
          setTimeout(() => {
            this.isSaved = false;
            this.saveButtonText = "保存";
          }, 2000);
        } else {
          uni.showToast({
            title: "保存失败，请重试",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        this.isSaving = false;
        uni.showToast({
          title: "保存失败，请检查网络",
          icon: "none",
        });
        console.error("保存日记失败:", err);
      });
    },
    goBack() {
      uni.navigateBack();
    },
    // 处理键盘高度变化（仅支持 App 和小程序基础库较高版本）
    onKeyboardHeightChange(e) {
      this.keyboardHeight = e.detail.height;
    },
    // 模拟插入图片
    insertImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const tempFile = res.tempFilePaths[0];
          // 在正文中插入图片标记，实际应根据光标位置插入，简化：追加文本标记
          this.content += `\n![image](${tempFile})\n`;
        },
      });
    },
    insertEmoji() {
      // 调起系统表情键盘或自定义面板，简化：追加一个😊
      this.content += "😊";
    },
    formatText(type) {
      // 简单实现：在光标位置插入标记
      let formatMark = "";
      switch (type) {
        case 'bold':
          formatMark = "**粗体**";
          break;
        case 'italic':
          formatMark = "*斜体*";
          break;
        case 'underline':
          formatMark = "__下划线__";
          break;
        default:
          return;
      }
      // 直接在内容末尾添加格式标记，实际应用中可以通过光标位置插入
      this.content += formatMark;
      uni.showToast({
        title: `已添加${type === 'bold' ? '粗体' : type === 'italic' ? '斜体' : '下划线'}格式`,
        icon: "none",
      });
    },
    onTitleFocus() {
      // 可滚动到顶部，防止键盘遮挡
      this.scrollTop = 0;
    },
    onBodyFocus() {
      // 滚动到正文区域
      this.scrollTop = 9999;
    },
    onTitleBlur() {},
    onBodyBlur() {},
    onScroll(e) {
      this.scrollTop = e.detail.scrollTop;
    },
    onEnterKey(e) {
      // 处理回车键，添加首行缩进
      // 阻止默认行为，手动处理
      e.preventDefault();
      // 在内容末尾添加换行和两个空格（首行缩进）
      this.content += '\n  ';
    },
  },
};
</script>

<style lang="scss">
.diary-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f4fa; // 与首页背景一致，纸张在上面
  position: relative;
  overflow: hidden;
}

.diary-page::before {
  content: '';
  position: absolute;
  right: -100rpx;
  top: -100rpx;
  width: 500rpx;
  height: 500rpx;
  background-image: url('/static/image/sea/RbiE9t4Sjv.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.05;
  border-radius: 50%;
  z-index: 0;
}

.diary-page::after {
  content: '';
  position: absolute;
  left: -100rpx;
  bottom: -100rpx;
  width: 400rpx;
  height: 400rpx;
  background-image: url('/static/image/tree/TUIK2pETF9.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.05;
  border-radius: 50%;
  z-index: 0;
}

.top-bar,
.paper,
.toolbar {
  position: relative;
  z-index: 1;
}

.top-bar {
  height: 96rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  z-index: 5;
  .top-bar-left,
  .top-bar-right {
    width: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .back-icon {
    font-size: 32rpx;
    color: #4a5a6e;
  }
  .date-picker {
    font-size: 28rpx;
    color: #4a5a6e;
    background: rgba(255, 255, 255, 0.4);
    padding: 12rpx 32rpx;
    border-radius: 48rpx;
    border-bottom: 2rpx solid #c0ccda;
    transition: background 0.2s;
    &:active {
      background: rgba(0, 0, 0, 0.03);
    }
  }
  .save-text {
    font-size: 28rpx;
    color: #6fa8dc;
    font-weight: 500;
    transition: color 0.2s;
    &.saved {
      color: #a5d6a5;
    }
  }
}

.paper {
  flex: 1;
  background-color: #fdfbf7;
  background-image: radial-gradient(rgba(0, 0, 0, 0.008) 1px, transparent 1px);
  background-size: 16rpx 16rpx;
  box-shadow: inset 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
  border-radius: 48rpx 48rpx 0 0;
  margin: 24rpx 24rpx 0;
  overflow-y: auto;
  .paper-inner {
    padding: 40rpx 48rpx 120rpx; // 底部留出空间避免被工具栏遮挡
  }
}

.title-input {
  width: 100%;
  font-size: 44rpx;
  font-weight: 500;
  color: #1e2a3a;
  background: transparent;
  border: none;
  outline: none;
  margin-bottom: 40rpx;
  caret-color: #6fa8dc;
  &::placeholder {
    color: #e5e5e5;
    font-weight: 400;
  }
}

.body-textarea {
  width: 100%;
  font-size: 32rpx;
  line-height: 56rpx;
  color: #1e2a3a;
  background: transparent;
  border: none;
  outline: none;
  min-height: 70vh;
  caret-color: #6fa8dc;
  &::placeholder {
    color: #e5e5e5;
  }
  /* 首行缩进效果 */
  &.indent {
    text-indent: 64rpx;
  }
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 32rpx;
  box-shadow: 0 -4rpx 10rpx rgba(0, 0, 0, 0.02);
  transition: bottom 0.3s ease;
  z-index: 20;
  .toolbar-item {
    width: 72rpx;
    height: 72rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #4a5a6e;
    font-size: 32rpx;
    transition: background 0.2s;
    &:active {
      background: rgba(0, 0, 0, 0.05);
    }
    .bold {
      font-weight: 700;
    }
    .italic {
      font-style: italic;
    }
    .underline {
      text-decoration: underline;
    }
    .image-icon,
    .emoji-icon {
      font-size: 28rpx;
    }
  }
}

/* 占位符公共样式 */
.placeholder {
  color: #e5e5e5;
  font-weight: 400;
}
</style>