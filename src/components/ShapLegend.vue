<template>
  <div class="shap-legend-overlay" v-if="visible">
    <div class="shap-legend-panel" ref="panelRef">
      <div class="legend-header">
        <span class="legend-title">📈 SHAP {{ chartType === 'importance' ? '特征重要性' : 'SHAP值分布' }}</span>
        <button class="legend-close" @click="$emit('close')" title="关闭">✕</button>
      </div>
      <div class="legend-body">
        <canvas ref="chartCanvas" class="chart-canvas"></canvas>
      </div>
      <div class="legend-footer">
        <div class="color-scale" v-if="chartType === 'beeswarm'">
          <span class="scale-label">Low</span>
          <div class="scale-bar"></div>
          <span class="scale-label">High</span>
        </div>
        <div class="data-source">数据源: Stacking GBDT-XGB</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: Boolean,
  chartType: String,
  data: { type: Array, default: () => [] },
})

defineEmits(['close'])

const chartCanvas = ref(null)
const panelRef = ref(null)

// 获取面板实际宽度，用于Canvas自适应
function getPanelWidth() {
  if (panelRef.value) {
    return panelRef.value.clientWidth - 20 // 减去padding
  }
  // 默认20vw的像素值
  return Math.round(window.innerWidth * 0.2) - 20
}

// 窗口resize时重绘
let resizeHandler = null
onMounted(() => {
  resizeHandler = () => {
    if (props.visible && props.data.length > 0 && chartCanvas.value) {
      redraw()
    }
  }
  window.addEventListener('resize', resizeHandler)
})
onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
})

function redraw() {
  if (!chartCanvas.value || !props.data.length) return
  if (props.chartType === 'importance') {
    drawImportanceChart(chartCanvas.value, props.data)
  } else {
    drawBeeswarmChart(chartCanvas.value, props.data)
  }
}

// 颜色映射函数: 特征值 -> 颜色
function featureValueColor(value, min, max) {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  // 蓝(low) -> 浅黄(high)
  const r = Math.round(t * 255)
  const g = Math.round(t * 200 + (1 - t) * 100)
  const b = Math.round((1 - t) * 255)
  return `rgb(${r},${g},${b})`
}

// 绘制特征重要性条形图
function drawImportanceChart(canvas, data) {
  if (!data || data.length === 0) return

  const sorted = [...data].sort((a, b) => {
    const aKey = Object.keys(a).find(k => k.toLowerCase().includes('shap') || k.toLowerCase().includes('importance'))
    const bKey = Object.keys(b).find(k => k.toLowerCase().includes('shap') || k.toLowerCase().includes('importance'))
    return (a[aKey] || 0) - (b[aKey] || 0)
  })

  // 找到特征名列和值列的 key
  const featureKey = Object.keys(sorted[0]).find(k => k.toLowerCase().includes('feature')) || Object.keys(sorted[0])[0]
  const valueKey = Object.keys(sorted[0]).find(k => k.toLowerCase().includes('shap') || k.toLowerCase().includes('importance')) || Object.keys(sorted[0])[1]

  // features 取每行特征名的值，而非列名
  const features = sorted.map(d => d[featureKey])
  const values = sorted.map(d => Math.abs(d[valueKey] || 0))

  const maxVal = Math.max(...values)
  const chartWidth = getPanelWidth()
  const scale = chartWidth / 380

  // 计算最大特征名宽度，自适应左边距
  const ctx0 = canvas.getContext('2d')
  const featFont = `${Math.round(14 * scale)}px Microsoft YaHei, sans-serif`
  ctx0.font = featFont
  let maxFeatWidth = 0
  features.forEach(f => { maxFeatWidth = Math.max(maxFeatWidth, ctx0.measureText(f).width) })

  const barHeight = Math.round(24 * scale)
  const barGap = Math.round(8 * scale)
  const leftMargin = Math.round(maxFeatWidth + 20 * scale)
  const rightMargin = Math.round(65 * scale)
  const topMargin = Math.round(16 * scale)
  const xTickAreaHeight = Math.round(22 * scale)   // X轴刻度文字区
  const titleAreaHeight = Math.round(22 * scale)   // "Mean |SHAP Value|"标题区
  const bottomMargin = xTickAreaHeight + titleAreaHeight + Math.round(8 * scale)
  const chartHeight = features.length * (barHeight + barGap) + topMargin + bottomMargin

  canvas.width = chartWidth * 2
  canvas.height = chartHeight * 2
  canvas.style.width = chartWidth + 'px'
  canvas.style.height = chartHeight + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.clearRect(0, 0, chartWidth, chartHeight)

  // 绘制条形
  const maxBarWidth = chartWidth - leftMargin - rightMargin
  const barsBottom = topMargin + features.length * (barHeight + barGap)  // 条形区域底部Y坐标
  features.forEach((feat, i) => {
    const y = topMargin + i * (barHeight + barGap)
    const barWidth = maxVal > 0 ? (values[i] / maxVal) * maxBarWidth : 0

    // 颜色渐变: 从低(浅蓝)到高(深蓝)
    const t = maxVal > 0 ? values[i] / maxVal : 0
    const gradient = ctx.createLinearGradient(leftMargin, 0, leftMargin + barWidth, 0)
    gradient.addColorStop(0, `rgba(58, 123, 213, ${0.3 + t * 0.4})`)
    gradient.addColorStop(1, `rgba(0, 180, 255, ${0.5 + t * 0.5})`)

    // 条形
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(leftMargin, y, barWidth, barHeight, 4 * scale)
    ctx.fill()

    // 边框
    ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 + t * 0.4})`
    ctx.lineWidth = 0.5
    ctx.stroke()

    // 特征名称
    ctx.font = `${Math.round(14 * scale)}px Microsoft YaHei, sans-serif`
    ctx.fillStyle = '#C0D4EC'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(feat, leftMargin - Math.round(10 * scale), y + barHeight / 2)

    // 数值标签
    ctx.font = `${Math.round(12 * scale)}px Consolas, monospace`
    ctx.fillStyle = '#8BA4C0'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(values[i].toFixed(3), leftMargin + barWidth + Math.round(6 * scale), y + barHeight / 2)
  })

  // X轴基线
  ctx.strokeStyle = 'rgba(139, 164, 192, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(leftMargin, barsBottom)
  ctx.lineTo(leftMargin + maxBarWidth, barsBottom)
  ctx.stroke()

  // X轴刻度
  const tickCount = 4
  const xTickY = barsBottom + Math.round(14 * scale)   // 刻度文字Y
  const xTitleY = barsBottom + xTickAreaHeight + Math.round(14 * scale) // "Mean |SHAP Value|" Y

  ctx.font = `${Math.round(12 * scale)}px Consolas, monospace`
  ctx.fillStyle = '#8BA4C0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let i = 0; i <= tickCount; i++) {
    const val = (maxVal / tickCount) * i
    const x = leftMargin + (val / maxVal) * maxBarWidth
    ctx.fillText(val.toFixed(2), x, xTickY)
    // 刻度线
    ctx.strokeStyle = 'rgba(139, 164, 192, 0.15)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(x, barsBottom)
    ctx.lineTo(x, barsBottom + Math.round(4 * scale))
    ctx.stroke()
    // 网格线
    ctx.strokeStyle = 'rgba(139, 164, 192, 0.08)'
    ctx.beginPath()
    ctx.moveTo(x, topMargin)
    ctx.lineTo(x, barsBottom)
    ctx.stroke()
  }

  // 标题 "Mean |SHAP Value|"
  ctx.font = `${Math.round(14 * scale)}px Microsoft YaHei, sans-serif`
  ctx.fillStyle = '#E0E8F0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('Mean |SHAP Value|', chartWidth / 2, xTitleY)
}

// 绘制SHAP值蜂群图
function drawBeeswarmChart(canvas, data) {
  if (!data || data.length === 0) return

  const features = Object.keys(data[0])

  // 计算每个特征的范围
  const featureRanges = {}
  features.forEach(f => {
    const vals = data.map(d => d[f]).filter(v => !isNaN(v))
    featureRanges[f] = {
      min: Math.min(...vals),
      max: Math.max(...vals),
    }
  })

  // 按特征重要性排序
  const featureImportance = features.map(f => {
    const vals = data.map(d => d[f]).filter(v => !isNaN(v))
    const mean = vals.reduce((a, b) => a + Math.abs(b), 0) / vals.length
    return { feature: f, importance: mean }
  }).sort((a, b) => a.importance - b.importance)

  const sortedFeatures = featureImportance.map(f => f.feature)

  const chartWidth = getPanelWidth()
  const scale = chartWidth / 380
  const rowHeight = Math.round(28 * scale)
  const leftMargin = Math.round(100 * scale)
  const rightMargin = Math.round(40 * scale)
  const topMargin = Math.round(14 * scale)
  const bottomMargin = Math.round(42 * scale)
  const chartHeight = sortedFeatures.length * rowHeight + topMargin + bottomMargin

  canvas.width = chartWidth * 2
  canvas.height = chartHeight * 2
  canvas.style.width = chartWidth + 'px'
  canvas.style.height = chartHeight + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.clearRect(0, 0, chartWidth, chartHeight)

  const plotWidth = chartWidth - leftMargin - rightMargin
  const plotHeight = sortedFeatures.length * rowHeight

  // 找全局SHAP范围
  let globalMin = Infinity, globalMax = -Infinity
  features.forEach(f => {
    data.forEach(d => {
      if (!isNaN(d[f])) {
        globalMin = Math.min(globalMin, d[f])
        globalMax = Math.max(globalMax, d[f])
      }
    })
  })

  // 零线位置
  const zeroX = leftMargin + ((0 - globalMin) / (globalMax - globalMin)) * plotWidth

  // 绘制零线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(zeroX, topMargin)
  ctx.lineTo(zeroX, topMargin + plotHeight)
  ctx.stroke()
  ctx.setLineDash([])

  // 绘制每个特征的点
  sortedFeatures.forEach((feat, fi) => {
    const y = topMargin + fi * rowHeight + rowHeight / 2

    // 特征名称
    ctx.font = `${Math.round(13 * scale)}px Microsoft YaHei, sans-serif`
    ctx.fillStyle = '#C0D4EC'
    ctx.textAlign = 'right'
    ctx.fillText(feat, leftMargin - Math.round(8 * scale), y + Math.round(5 * scale))

    // 绘制散点
    const vals = data.map(d => d[feat]).filter(v => !isNaN(v))
    const fMin = Math.min(...vals)
    const fMax = Math.max(...vals)

    // 简单的jitter避免重叠
    const jitterSeed = fi * 1000
    data.forEach((d, si) => {
      const val = d[feat]
      if (isNaN(val)) return

      const x = leftMargin + ((val - globalMin) / (globalMax - globalMin)) * plotWidth
      const jitter = (Math.sin(jitterSeed + si * 127.1) * 0.5 + 0.5 - 0.5) * (rowHeight * 0.5)

      const color = featureValueColor(val, fMin, fMax)
      ctx.fillStyle = color
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.arc(x, y + jitter, 3 * scale, 0, 2 * Math.PI)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0
  })

  // X轴标签
  ctx.font = `${Math.round(14 * scale)}px Microsoft YaHei, sans-serif`
  ctx.fillStyle = '#C0D4EC'
  ctx.textAlign = 'center'
  ctx.fillText('SHAP value (impact on model output)', chartWidth / 2, chartHeight - Math.round(10 * scale))

  // X轴刻度
  const tickCount = 5
  ctx.font = `${Math.round(11 * scale)}px Consolas, monospace`
  ctx.fillStyle = '#8BA4C0'
  for (let i = 0; i <= tickCount; i++) {
    const val = globalMin + (globalMax - globalMin) * (i / tickCount)
    const x = leftMargin + (i / tickCount) * plotWidth
    ctx.fillText(val.toFixed(2), x, topMargin + plotHeight + Math.round(16 * scale))
  }
}

// 监听数据变化重绘
watch(
  () => [props.visible, props.chartType, props.data],
  () => {
    if (props.visible && props.data.length > 0) {
      nextTick(() => {
        redraw()
      })
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.shap-legend-overlay {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 40;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.shap-legend-panel {
  width: 20vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: rgba(5, 15, 30, 0.95);
  border-radius: 10px;
  border: 1px solid rgba(0, 212, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 180, 255, 0.15);
  overflow: hidden;
  position: relative;
}

.shap-legend-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
}

.legend-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #0A2E5C, #1A3A6B);
  border-bottom: 1px solid rgba(0, 212, 255, 0.3);
  gap: 10px;
  flex-shrink: 0;
}

.legend-title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 6px rgba(0, 212, 255, 0.4);
}

.legend-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: rgba(231, 76, 60, 0.15);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #E74C3C;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.legend-close:hover {
  background: rgba(231, 76, 60, 0.35);
  color: #fff;
}

.legend-body {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}

.legend-body::-webkit-scrollbar {
  width: 4px;
}

.legend-body::-webkit-scrollbar-track {
  background: transparent;
}

.legend-body::-webkit-scrollbar-thumb {
  background: rgba(0, 180, 255, 0.3);
  border-radius: 2px;
}

.chart-canvas {
  display: block;
  margin: 0 auto;
}

.legend-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 212, 255, 0.15);
  flex-shrink: 0;
}

.color-scale {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.scale-label {
  font-size: 13px;
  color: #8BA4C0;
  font-weight: 600;
}

.scale-bar {
  flex: 1;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgb(0, 100, 255), rgb(100, 150, 200), rgb(255, 200, 100));
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.data-source {
  font-size: 13px;
  color: #5d8aaa;
  text-align: center;
}
</style>
