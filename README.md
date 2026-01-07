# 声明

##### 1.重点

**核心文件**： `demo6.html`  直接运行它就是整个平台。
**主要读取类型**：`.tif .shp`

##### 2.我从学习到制作都是在这一个文件里完成的，所以会有一些.js文件我不知道删掉会不会有影响，就没删，如果你确定没影响的话就可以自行处理

##### 3.有一些 `jianzhucaijian.py`（建筑物）或 `ludingturang.py`（土壤类型）是裁剪函数，你可以自行用他们从一个大的文件比如全球范围的建筑物文件裁剪出一个单独的泸定地区的文件，当然你需要这个特定地区的SHP文件

##### 4.第一核心部分

**数据录入**：只实装了“区域范围”“高程”“土壤类型”“道路”。“在线数据”部分可以使用，自行处理。

**其中**
**区域范围**：与第三核心部分相关，后续解答

**高程**：典型的.tif文件读取代码，你可以后续使用这个代码在其他部分

**土壤类型**：内含分类属性的shp文件，我在土壤类型的内置代码中针对要读取的土壤类型文件进行了特定处理，只能读取特定类型文件（即学姐提供的土壤类型文件）。使用：点击后，在弹窗中选择所有shp系列文件。

**道路**：不含独特属性的shp文件。使用：将需要读取的shp系列文件打包为.zip压缩包，读取这个压缩包。（建议进行过程优化）

##### 5.第二核心部分

**模型集成**：只实装了“预处理”的“重分类”部分，模型里面的“卷积神经网络（cnn）”“人工神经网络（ann）”
**重分类**：是指把单纯把属性数据集成在一个属性表中的结果经过重分类运算划分为1-10的可计算结果
**CNN**：在VScode中先运行 cnn.py，然后在平台上点击“卷积神经网络”，依次读取，经过预处理后的属性表格，研究地区的shp系列文件，即可进行运算，注意时间可能比较长，运算完毕后会在平台可视化
**ANN**：在VScode中先运行 ann.py，只需读取ann文件里的重分类文件即可生成预测值文件，未实现可视化功能。

##### 6.第三核心部分

**决策评估**在VScode中先运行  zonghefenxi.py，在第一部分点击“区域范围”读取特定地区shp文件，再读取“预测数据”即第二部分得出的预测数据，接着读取“人口数据”即该特定地区的人口数据tif文件，在读取“泸定地区建筑物”（应改名建筑物数据），即该特定地区的建筑物shp文件，再点击“综合决策分析”即可进行处理并可视化。

##### 7.需注意本平台所有“眼睛”图标均未实装，即控制文件图层的可视化功能，可后续进行优化

##### 8.有许多数据是后端部分SRTP小组做的，你可以问师姐要

##### 9.随时找我

# 环境依赖 new

### **！！！需要python == 3.8.20**

```sh
py -0
# 例如输出
# -3.8.20
# -3.9
# -3.10
py -3.10 -m venv venv

# 如果没有，但是有conda
conda create -n py38 python=3.8.20
conda activate py38
python --version
# Python 3.8.20
python -m venv venv
```

然后安装node和python依赖和库

```sh
# 安装node包
npm install 

python -m venv venv

.\venv\Scripts\activate

python -m pip install --upgrade pip

pip install -r bs_requirements.txt
```

如果运行 fenxiaaa.py 报错`2026-01-07 16:51:42,770 - ERROR - 加载 Shapefile SU_30W_10W_LD.shp 出错: module 'fiona' has no attribute 'path'`

```sh
pip uninstall fiona
```

# 环境依赖 old

```sh
# 安装node包
npm install 

# 激活环境 
.\venv\Scripts\activate 

#.\venv\pyvenv.cfg 下 修改
home = pat-to-your\bs\.conda

# .\venv\Scripts\activate
VIRTUAL_ENV= path-to-your\bs\venv"

# .\venv\Scripts\activate.bat
set VIRTUAL_ENV=path-to-your\bs\venv

# 重新安装pip
python -m pip uninstall pip
python -m ensurepip --default-pip
python -m pip install --upgrade pip

# 检查是环境是否成功配置
where python
where pip
pip --Version
```

# 快速开始指南

## ✅ 已完成的集成工作

1. ✅ 安装了所有必要的依赖包（MapLibre、D3、Neo4j Driver等）
2. ✅ 创建了MapLibre图谱可视化组件 (`src/components/MapLibreViewer.vue`)
3. ✅ 实现了Cesium和MapLibre视图切换功能
4. ✅ 添加了优雅的视图切换按钮
5. ✅ 创建了数据文件夹结构 (`public/sun/`, `public/svg/`)
6. ✅ 添加了错误处理和容错机制

## 🚀 立即体验

### 1. 启动项目（已启动）
项目已在 **http://localhost:5175/** 运行

### 2. 查看效果
- 默认显示：Cesium三维视图（原有功能）
- 点击右上角渐变紫色按钮："📊 图谱模式"
- 即可切换到MapLibre图谱可视化界面

## 📝 下一步操作

### 准备数据文件（重要）

1. **准备滑坡点位GeoJSON数据**
   - 文件位置：`public/sun/output1.geojson`
   - 当前为空文件，需要添加实际数据
   - 格式参考 `GRAPH_INTEGRATION.md`

2. **准备地图标记图标（可选）**
   - 文件位置：`public/svg/LOC.png`
   - 用于自定义滑坡点位标记样式

3. **启动Neo4j数据库（可选）**
   - 如果需要图谱功能，确保Neo4j运行在 `bolt://localhost:7687`
   - 用户名：neo4j，密码：21151211
   - 如果未启动，地图功能仍可正常使用

## 🎯 功能演示

### Cesium三维模式（默认）
- 原有的三维地球视图
- 数据加载功能
- CNN/ANN模型预测
- 自动摄像头对准

### MapLibre图谱模式（新增）
- 2D世界地图（双地图联动）
- 滑坡点位展示
- 点击滑坡点查询知识图谱
- 图谱可视化（力导向布局）
- 过滤搜索功能
- 属性信息窗口

## ⚙️ 自定义配置

### 修改Neo4j连接
编辑 `src/components/MapLibreViewer.vue` 第82行：
```javascript
const driver = neo4j.driver('bolt://localhost:7687', 
  neo4j.auth.basic('neo4j', '你的密码'))
```

### 修改MapTiler API密钥
编辑 `src/components/MapLibreViewer.vue` 第17行：
```javascript
const maptilerKey = '你的API密钥'
```

## 📚 详细文档

- **完整功能说明**：查看 `GRAPH_INTEGRATION.md`
- **数据配置说明**：查看 `src/config/dataConfig.js`

## ⚠️ 常见问题

**Q: 切换到图谱模式后地图是空的？**
A: 需要在 `public/sun/output1.geojson` 添加滑坡点位数据

**Q: 点击滑坡点后没有图谱显示？**
A: 检查Neo4j数据库是否运行，或查看浏览器控制台错误信息

**Q: 图谱模式下过滤器不工作？**
A: 确保GeoJSON中的 `LOC` 属性与过滤关键词匹配

## 💡 技术亮点

- **无缝切换**：在两种视图间平滑切换，无需刷新页面
- **容错设计**：即使数据库未连接，地图功能仍可正常使用
- **响应式**：自适应不同屏幕尺寸
- **性能优化**：按需加载组件，避免资源浪费

## 🎉 开始使用

现在就打开浏览器访问 **http://localhost:5175/** 体验全新的图谱可视化功能吧！

# 图谱可视化功能集成说明

## 功能概述

本项目已成功集成MapLibre图谱查询和地图可视化功能，支持在Cesium三维视图和MapLibre图谱视图之间切换。

## 主要功能

### 1. 视图切换
- 右上角有一个渐变紫色按钮，用于切换视图模式
- **三维模式**: 原有的Cesium 3D地图和模型预测功能
- **图谱模式**: MapLibre 2D地图 + Neo4j知识图谱可视化

### 2. 图谱模式功能
- 双地图联动（主地图 + 小地图）
- 滑坡点位可视化
- 点击滑坡点自动查询和展示知识图谱
- 三个过滤器（研究区域、关键因素、方法类别）
- 图谱显示/隐藏控制按钮
- 属性信息窗口

## 数据准备

### 1. GeoJSON数据文件
需要在 `public/sun/output1.geojson` 放置滑坡点位数据：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [经度, 纬度]
      },
      "properties": {
        "LOC": "地点名称",
        "其他属性": "值"
      }
    }
  ]
}
```

### 2. 地图标记图标（可选）
在 `public/svg/LOC.png` 放置自定义标记图标

### 3. Neo4j数据库配置
- **URL**: bolt://localhost:7687
- **用户名**: neo4j
- **密码**: 21151211

如需修改，编辑 `src/components/MapLibreViewer.vue` 中的 `getCypherResult` 函数

## 文件结构

```
landslide-vis/
├── src/
│   ├── components/
│   │   ├── CesiumViewer.vue      # Cesium三维视图
│   │   ├── MapLibreViewer.vue    # MapLibre图谱视图（新增）
│   │   ├── LeftMenu.vue
│   │   ├── DataPanel.vue
│   │   └── model/
│   │       └── ModelPanel.vue
│   ├── config/
│   │   └── dataConfig.js         # 数据配置说明（新增）
│   └── App.vue                   # 主应用（已修改）
├── public/
│   ├── sun/
│   │   └── output1.geojson       # 滑坡点位数据（需要准备）
│   └── svg/
│       └── LOC.png               # 地图标记图标（可选）
└── package.json                  # 已添加新依赖
```

## 新增依赖包

已安装以下npm包：
- `maplibre-gl`: MapLibre地图库
- `d3`: 数据可视化和力导向图布局
- `d3-dsv`: CSV/TSV解析
- `d3-force-3d`: 3D力导向图
- `force-graph`: 2D力导向图组件
- `neo4j-driver`: Neo4j数据库驱动
- `three`: 3D图形库

## 使用说明

### 启动项目
```bash
npm run dev
```

### 切换视图
1. 项目启动后默认显示Cesium三维模式
2. 点击右上角的"📊 图谱模式"按钮切换到图谱视图
3. 在图谱模式下，点击"🌍 三维模式"按钮返回Cesium视图

### 图谱模式操作
1. **查看滑坡点位**: 地图上显示所有滑坡点（红色圆点）
2. **点击滑坡点**: 
   - 地图自动飞行到该点并放大
   - 自动查询Neo4j数据库获取相关图谱
   - 显示知识图谱（如果连接成功）
   - 显示属性信息窗口
3. **控制图谱显示**: 点击右侧的"G"按钮显示/隐藏图谱
4. **过滤滑坡点**: 使用顶部的三个过滤输入框
5. **操作图谱**: 右键点击节点可以聚焦查看

## 错误处理

如果遇到以下情况，系统会优雅降级：
- Neo4j数据库未连接：图谱功能不可用，但地图仍可正常使用
- GeoJSON文件缺失：控制台会提示，不影响其他功能
- 数据文件为空：控制台会给出提示信息

## 注意事项

1. **MapTiler API Key**: 当前使用的是示例key，生产环境建议更换为自己的key
2. **Neo4j连接**: 确保Neo4j数据库正在运行，否则图谱功能不可用
3. **数据文件**: 首次使用需要准备GeoJSON数据文件
4. **性能**: 大量节点时图谱渲染可能较慢，建议限制查询数量

## 技术特点

- Vue 3 Composition API
- 响应式视图切换
- 错误容错机制
- 地图联动同步
- 力导向图布局
- 实时数据库查询

## 后续扩展建议

1. 添加图谱节点详情面板
2. 实现更多过滤器功能
3. 添加数据导出功能
4. 优化大规模图谱渲染性能
5. 添加图谱搜索功能


# 版本内容更新

###### v1.0.0

    左恒灿毕业设计初版

###### v2.0.0

    重构集成版本：集成了毕设以及图谱功能