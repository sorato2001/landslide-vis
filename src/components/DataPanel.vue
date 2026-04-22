<template>
  <div class="data-panel">
    <div class="panel-header">
      <span class="header-icon">📊</span>
      <span class="header-title">数据管理</span>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div>

    <div class="panel-content">

      <DataPre />
      
      <!-- <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>数据信息</span>
        </div>

        <div class="data-section">
          <div class="data-title">地理环境数据</div>
          <div class="data-tags">
            <div class="data-tag blue">地质条件数据</div>
            <div class="data-tag blue">水文因子数据</div>
            <div class="data-tag blue">地形数据</div>
            <div class="data-tag blue">土地覆被与土壤数据</div>
          </div>
        </div>

     
        <div class="data-section">
          <div class="data-title">动态触发数据</div>
          <div class="data-tags">
            <div class="data-tag orange">降雨数据</div>
            <div class="data-tag orange">地震数据</div>
            <div class="data-tag orange">人类活动数据</div>
          </div>
        </div>

      
        <div class="data-section">
          <div class="data-title">滑坡编录数据</div>
          <div class="data-tags">
           
          </div>
        </div>
      </div> -->

      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>数据信息</span>
        </div>

        <!-- ✅ 数据驱动渲染 -->
        <div
          class="data-section"
          v-for="group in dataGroups"
          :key="group.title"
        >
          <div class="data-title">{{ group.title }}</div>

          <div class="data-tags">
            <!-- 有数据 -->
            <template v-if="group.list.length">
              <div
                class="data-tag"
                :class="group.color"
                v-for="item in group.list"
                :key="item.key"
              >
                <span>{{ item.name }}</span>

                <button
                  class="input-btn"
                  @click="handleInput(item.key)"
                >
                  输入
                </button>
              </div>
            </template>

            <!-- 空数据 -->
            <div
              v-else
              class="data-tag empty"
            >
              暂无数据
            </div>
          </div>
        </div>
      </div>
      
      <!-- <AreaInput /> -->
      <AdminDivision />
      <OnlineData @openUrl="$emit('openUrl', $event)" />
      <ElevationInput />
      <SoilInput />
      <RoadInput />
    </div>
  </div>
</template>

<script setup>
import DataPre from './data/DataPre.vue'
import AreaInput from './data/AreaInput.vue'
import AdminDivision from './data/AdminDivision.vue'
import OnlineData from './data/OnlineData.vue'
import ElevationInput from './data/ElevationInput.vue'
import SoilInput from './data/SoilInput.vue'
import RoadInput from './data/RoadInput.vue'

defineEmits(['close', 'openUrl'])

const dataGroups = [
  {
    title: '地理环境数据',
    color: 'blue',
    list: [
      { name: '地质条件数据', key: 'geology' },
      { name: '水文因子数据', key: 'hydrology' },
      { name: '地形数据', key: 'terrain' },
      { name: '土地覆被与土壤数据', key: 'landcover' }
    ]
  },
  {
    title: '动态触发数据',
    color: 'orange',
    list: [
      { name: '降雨数据', key: 'rain' },
      { name: '地震数据', key: 'earthquake' },
      { name: '人类活动数据', key: 'human' }
    ]
  },
  {
    title: '滑坡编录数据',
    color: 'purple',
    list: [
      
    ]
  }
]

const handleInput = (key) => {
  console.log('点击输入：', key)
}
</script>

<style scoped>
.data-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(10, 22, 40, 0.95);
  color: #E0E8F0;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #0A2E5C, #1A3A6B);
  border-bottom: 1px solid rgba(58, 123, 213, 0.4);
  flex-shrink: 0;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  flex: 1;
  font-size: 19px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(58, 123, 213, 0.5);
}

.close-btn {
  background: none;
  border: none;
  color: #8BA4C0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(58, 123, 213, 0.3);
  color: #FFFFFF;
}

.panel-content {
  padding: 14px;
  overflow-y: auto;
  flex: 1;
}

.panel-content::-webkit-scrollbar {
  width: 5px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(10, 22, 40, 0.5);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(58, 123, 213, 0.4);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(58, 123, 213, 0.6);
}

.section-group {
  margin-bottom: 14px;
  background: rgba(0, 20, 50, 0.6);
  border: 2px solid rgba(0, 179, 255, 0.342);
  border-radius: 8px;
  padding: 14px;
  position: relative;
  animation: fadein 0.5s ease both;
  transition: border-color 0.2s;
}

.section-group:hover {
  border-color: rgba(0, 179, 255, 0.685);
}

.section-group::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 179, 255, 0.2);
}

.section-bar {
  display: inline-block;
  flex-shrink: 0;
  width: 4px;
  height: 20px;
  background: #00d4ff;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
  border-radius: 2px;
}

/* 每一块 */
.data-section {
  margin-bottom: 14px;
}

/* 标题 */
.data-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #4A90D9;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 标签容器 */
.data-tags {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

/* 标签块 */
.data-tag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: all 0.2s;
}

/* 小圆点 */
.data-tag::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 不同类别颜色 */
.data-tag.blue::before {
  background: #4A90D9;
}

.data-tag.orange::before {
  background: #F5A623;
}

.data-tag.purple::before {
  background: #9B59B6;
}

/* hover 效果 */
.data-tag:hover {
  background: rgba(74, 144, 217, 0.15);
  border-color: rgba(74, 144, 217, 0.4);
  transform: translateY(-1px);
}

/* 空数据 */
.data-tag.empty {
  opacity: 0.5;
  cursor: default;
}
.input-btn {
  background: rgba(0, 180, 255, 0.2);
  border: 1px solid rgba(0, 180, 255, 0.5);
  color: #00d4ff;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.input-btn:hover {
  background: rgba(0, 180, 255, 0.4);
  color: #fff;
}
</style>
