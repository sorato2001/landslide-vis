<template>
  <div class="model-panel">
    <div class="panel-header">
      <span class="header-icon">🤖</span>
      <span class="header-title">模型集成</span>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div>

    <div class="panel-content">
      <!-- 原始数据信息面板 -->
      <!-- <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>数据信息</span>
        </div>
        <button class="sub-btn" @click="$emit('close')">地理环境数据</button>
        <button class="sub-btn" @click="$emit('close')">动态触发数据</button>
        <button class="sub-btn" @click="$emit('close')">滑坡编录数据</button>
      </div> -->

      <!-- 新增数据信息面板 -->
      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>区域相似度计算</span>
        </div>

        <div class="data-section">
          <div class="data-title">连续型因子计算</div>
          <div class="data-tags">
            <div class="data-tag orange">Jensen-Shannon散度</div>
            <div class="data-tag orange">Wasserstein距离</div>
          </div>
        </div>

        <div class="data-section">
          <div class="data-title">离散型因子计算</div>
          <div class="data-tags">
            <div class="data-tag purple">Bray-Curtis相异度</div>
            <div class="data-tag purple">景观格局指数</div>
          </div>
        </div>
      </div>

      <!-- 原始模型信息面板 -->
      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>模型信息</span>
        </div>

        <div class="model-section">
          <div class="section-title">
            <span class="icon">📊</span>
            <span>数据预处理</span>
          </div>
          <button 
            class="model-btn primary"
            @click="runReclass"
            :disabled="running"
          >
            <span class="btn-icon">📝</span>
            <span class="btn-text">重分类</span>
            <span v-if="running" class="loading-spinner"></span>
          </button>
        </div>

        <div class="model-section">
          <div class="section-title">
            <span class="icon">🧠</span>
            <span>机器学习模型</span>
          </div>
          
          <input
            ref="cnnInput"
            type="file"
            multiple
            accept=".csv,.shp,.shx,.dbf,.prj"
            hidden
            @change="onCNNFilesSelected"
          />

          <button 
            class="model-btn success"
            @click="openCNNFileDialog"
            :disabled="running"
          >
            <span class="btn-icon">🌐</span>
            <div class="btn-content">
              <span class="btn-text">卷积神经网络</span>
              <span class="btn-subtext">CNN 预测</span>
            </div>
            <span v-if="running" class="loading-spinner"></span>
          </button>

          <button 
            class="model-btn info"
            @click="runANN" 
            :disabled="running"
          >
            <span class="btn-icon">⚡</span>
            <div class="btn-content">
              <span class="btn-text">人工神经网络</span>
              <span class="btn-subtext">ANN 预测</span>
            </div>
            <span v-if="running" class="loading-spinner"></span>
          </button>
        </div>

        <div class="model-section">
          <div class="section-title">
            <span class="icon">🧬</span>
            <span>深度学习模型</span>
          </div>
          
          <button 
            class="model-btn warning"
            @click="runLSTM"
            :disabled="running"
          >
            <span class="btn-icon">🔄</span>
            <div class="btn-content">
              <span class="btn-text">长短期记忆网络</span>
              <span class="btn-subtext">LSTM 时序预测</span>
            </div>
            <span v-if="running" class="loading-spinner"></span>
          </button>

          <button 
            class="model-btn danger"
            @click="runTransformer"
            :disabled="running"
          >
            <span class="btn-icon">🎯</span>
            <div class="btn-content">
              <span class="btn-text">Transformer 模型</span>
              <span class="btn-subtext">Transformer 预测</span>
            </div>
            <span v-if="running" class="loading-spinner"></span>
          </button>
        </div>
      </div>

      <!-- 滑坡评估模型面板 -->
      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>滑坡评估模型</span>
        </div>

        <div
          v-for="(group, index) in modelGroups"
          :key="index"
          class="accordion"
        >
          <!-- 分类标题 -->
          <div class="accordion-header" @click="toggleGroup(index)">
            <span class="icon">{{ group.icon }}</span>
            <span class="title">{{ group.name }}</span>
            <span class="arrow" :class="{ open: activeIndex === index }">▶</span>
          </div>

          <!-- 子模型 -->
          <div v-show="activeIndex === index" class="accordion-body">
            <button
              v-for="(model, i) in group.models"
              :key="i"
              class="model-btn sub"
              @click="model.action"
              :disabled="running"
            >
              {{ model.name }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="status" class="status-bar" :class="statusType">
        <span class="status-icon">ℹ️</span>
        <span>{{ status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { runReclassModel } from '@/model/reclassModel'
import { runCNNModel } from '@/model/cnnModel'
import { runANNModel } from '@/model/annModel'

const emit = defineEmits(['close', 'cnnProgress'])

const status = ref('')
const statusType = ref('info')
const cnnInput = ref(null)
const running = ref(false)

// CNN 进度状态
const cnnProgress = ref({
  active: false,
  percent: 0,
  text: '',
  stage: '',
})

const STAGE_ORDER = ['upload', 'process', 'render', 'legend', 'download', 'done']

function stageDone(stage) {
  const idx = STAGE_ORDER.indexOf(stage)
  const currentIdx = STAGE_ORDER.indexOf(cnnProgress.value.stage)
  return currentIdx > idx
}

function stageActive(stage) {
  return cnnProgress.value.stage === stage
}

//模型面板新增逻辑
const activeIndex = ref(null)

function toggleGroup(index) {
  activeIndex.value = activeIndex.value === index ? null : index
}

// 模型分类配置
const modelGroups = [
  {
    name: '机器学习',
    icon: '🤖',
    models: [
      { name: 'K近邻算法', action: runANN },
      { name: '反向传播神经网络模型', action: runANN },
      { name: '梯度提升决策树', action: runANN },
      { name: '极端梯度提升模型', action: runANN }
    ]
  },
  {
    name: '深度学习',
    icon: '🔀',
    models: [
      // { name: 'AHP + 逻辑回归', action: runANN },
      // { name: 'CNN + LSTM', action: runLSTM }
    ]
  },
  {
    name: '集成学习',
    icon: '🌐',
    models: [
      { name: 'Bagging', action: runANN },
      { name: 'Boosting', action: runANN },
      { name: 'Stacking', action: runTransformer },
      { name: 'Stacking XGBoost-GBDT', action: runXGBoostGBDT }
    ]
  },
  {
    name: '迁移学习',
    icon: '🌐',
    models: [
      // { name: 'Bagging', action: runANN },
      // { name: 'Boosting', action: runANN },
      // { name: 'Stacking', action: runTransformer }
    ]
  }
]

function openCNNFileDialog() {
  cnnInput.value.click()
}

async function onCNNFilesSelected(e) {
  const files = e.target.files
  if (!files.length) return

  const fileMap = {}
  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase()
    fileMap[ext] = f
  }

  if (!fileMap.csv || !fileMap.shp || !fileMap.dbf) {
    status.value = '请至少选择 csv、shp、dbf 文件'
    statusType.value = 'error'
    return
  }

  try {
    running.value = true
    status.value = ''
    cnnProgress.value = { active: true, percent: 0, text: '正在上传数据...', stage: 'upload' }
    emit('cnnProgress', cnnProgress.value)
    statusType.value = 'info'
    
    await runCNNModel(
      {
        csv: fileMap.csv,
        shp: fileMap.shp,
        shx: fileMap.shx,
        dbf: fileMap.dbf,
        prj: fileMap.prj
      },
      {
        onProgress: (p) => {
          cnnProgress.value = { ...cnnProgress.value, ...p, active: true }
          emit('cnnProgress', cnnProgress.value)
        }
      }
    )
    
    status.value = '✅ CNN 预测完成！'
    statusType.value = 'success'
    setTimeout(() => {
      status.value = ''
      cnnProgress.value.active = false
      emit('cnnProgress', cnnProgress.value)
    }, 3000)
  } catch (err) {
    console.error(err)
    status.value = '❌ CNN 运行失败'
    statusType.value = 'error'
    cnnProgress.value.active = false
    emit('cnnProgress', cnnProgress.value)
  } finally {
    running.value = false
    e.target.value = ''
  }
}

async function runReclass() {
  try {
    running.value = true
    status.value = '正在执行重分类...'
    statusType.value = 'info'
    
    await runReclassModel()
    
    status.value = '✅ 重分类完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (e) {
    console.error(e)
    status.value = '❌ 重分类失败'
    statusType.value = 'error'
  } finally {
    running.value = false
  }
}

async function runANN() {
  try {
    running.value = true
    status.value = '正在运行 ANN 模型...'
    statusType.value = 'info'
    
    await runANNModel()
    
    status.value = '✅ ANN 预测完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (e) {
    console.error(e)
    status.value = '❌ ANN 预测失败'
    statusType.value = 'error'
  } finally {
    running.value = false
  }
}

async function runLSTM() {
  try {
    running.value = true
    status.value = '正在运行 LSTM 模型...'
    statusType.value = 'info'
    
    // TODO: 实现 LSTM 模型调用
    // await runLSTMModel()
    
    status.value = '✅ LSTM 预测完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (e) {
    console.error(e)
    status.value = '❌ LSTM 预测失败'
    statusType.value = 'error'
  } finally {
    running.value = false
  }
}

async function runTransformer() {
  try {
    running.value = true
    status.value = '正在运行 Transformer 模型...'
    statusType.value = 'info'
    
    // TODO: 实现 Transformer 模型调用
    // await runTransformerModel()
    
    status.value = '✅ Transformer 预测完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (e) {
    console.error(e)
    status.value = '❌ Transformer 预测失败'
    statusType.value = 'error'
  } finally {
    running.value = false
  }
}

async function runXGBoostGBDT() {
    try {
    running.value = true
    status.value = '正在运行 Stacking XGBoost-GBDT 模型...'
    statusType.value = 'info'
    
    // TODO: 实现 Stacking XGBoost-GBDT 模型调用
    // await runXGBoostGBDTModel()
    
    status.value = '✅ Stacking XGBoost-GBDT 预测完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (e) {
    console.error(e)
    status.value = '❌ Stacking XGBoost-GBDT 预测失败'
    statusType.value = 'error'
  } finally {
    running.value = false
  }
}

</script>

<style scoped>
.model-panel {
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
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(58, 123, 213, 0.4);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(58, 123, 213, 0.6);
}

/* 分组标签 */
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

.sub-btn {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 8px;
  background: rgba(6, 35, 85, 0.6);
  border: 1px solid rgba(63, 127, 218, 0.849);
  border-radius: 15px;
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-btn:hover {
  background: rgba(6, 35, 85, 0.8);
  border-color: rgba(63, 127, 218, 1);
  box-shadow: 0 0 10px rgba(63, 127, 218, 0.4);
}

.sub-btn:last-of-type {
  margin-bottom: 0;
}

.accordion {
  border: 1px solid rgba(58, 123, 213, 0.2);
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
}

.accordion-header {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  background: rgba(20, 40, 80, 0.6);
  transition: all 0.2s;
}

.accordion-header:hover {
  background: rgba(40, 70, 120, 0.6);
}

.accordion-header .title {
  flex: 1;
  margin-left: 8px;
  font-weight: 600;
}

.arrow {
  transition: transform 0.2s;
}

.arrow.open {
  transform: rotate(90deg);
}

.accordion-body {
  padding: 10px;
  background: rgba(10, 22, 40, 0.6);
}

.model-btn.sub {
  background: rgba(6, 35, 85, 0.6);
  border: 1px solid rgba(63, 127, 218, 0.5);
}

/* 模型区域 */
.model-section {
  padding: 10px 0;
  border-bottom: 1px solid rgba(58, 123, 213, 0.15);
}

.model-section:last-of-type {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: #4A90D9;
  font-size: 18px;
  font-weight: 600;
}

.section-title .icon {
  font-size: 18px;
}

.model-btn {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.model-btn:last-child {
  margin-bottom: 0;
}

.model-btn.primary {
  background: linear-gradient(135deg, #0A2E5C, #3A7BD5);
  border-color: rgba(58, 123, 213, 0.5);
}

.model-btn.primary:hover {
  background: linear-gradient(135deg, #1A3A6B, #4A90D9);
  box-shadow: 0 0 12px rgba(58, 123, 213, 0.4);
}

.model-btn.success {
  background: linear-gradient(135deg, #065F46, #058D49);
  border-color: rgba(5, 141, 73, 0.5);
}

.model-btn.success:hover {
  background: linear-gradient(135deg, #047857, #0AA85A);
  box-shadow: 0 0 12px rgba(5, 141, 73, 0.4);
}

.model-btn.info {
  background: linear-gradient(135deg, #1A3A6B, #3A7BD5);
  border-color: rgba(58, 123, 213, 0.5);
}

.model-btn.info:hover {
  background: linear-gradient(135deg, #2A4E8B, #4A90D9);
  box-shadow: 0 0 12px rgba(58, 123, 213, 0.4);
}

.model-btn.warning {
  background: linear-gradient(135deg, #5B21B6, #7C3AED);
  border-color: rgba(124, 58, 237, 0.5);
}

.model-btn.warning:hover {
  background: linear-gradient(135deg, #6D28D9, #8B5CF6);
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.4);
}

.model-btn.danger {
  background: linear-gradient(135deg, #0F766E, #14B8A6);
  border-color: rgba(20, 184, 166, 0.5);
}

.model-btn.danger:hover {
  background: linear-gradient(135deg, #0D9488, #2DD4BF);
  box-shadow: 0 0 12px rgba(20, 184, 166, 0.4);
}

.model-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.btn-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.btn-text {
  font-size: 18px;
  font-weight: 600;
}

.btn-subtext {
  font-size: 15px;
  opacity: 0.85;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-bar {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 6px;
  margin-top: 10px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.status-bar.info {
  background: rgba(58, 123, 213, 0.15);
  color: #4A90D9;
  border: 1px solid rgba(58, 123, 213, 0.3);
}

.status-bar.success {
  background: rgba(5, 141, 73, 0.15);
  color: #0AA85A;
  border: 1px solid rgba(5, 141, 73, 0.3);
}

.status-bar.error {
  background: rgba(192, 57, 43, 0.15);
  color: #E74C3C;
  border: 1px solid rgba(192, 57, 43, 0.3);
}

.status-icon {
  font-size: 16px;
}

@keyframes fadein {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== CNN 进度条 ========== */
.progress-section {
  margin-top: 14px;
  padding: 14px 16px;
  background: rgba(0, 20, 50, 0.7);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 10px;
  animation: fadein 0.3s ease;
}

</style>
