# 迈从 (MCHOSE) K980 三模机械键盘 WebHID 网页驱动

![WebHID API](https://img.shields.io/badge/WebHID-API-blue?style=flat-square)
![Vue 3](https://img.shields.io/badge/Vue-3.x-emerald?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square)
![SinoWealth BYK916](https://img.shields.io/badge/MCU-BYK916-purple?style=flat-square)
![License MIT](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

这是一个专为**迈从 (MCHOSE) K980 (三模) 98键机械键盘**打造的现代 WebHID 纯网页端驱动与配置工具。无需安装官方老旧驱动客户端，直接在 Chrome / Edge 浏览器中即开即用！

🌐 **在线使用地址 (GitHub Pages)**: [https://relife-1.github.io/k980-webhid-driver/](https://relife-1.github.io/k980-webhid-driver/)

---

## 💡 开发背景

官方的 K980 驱动基于较老的 MFC 架构，在现代高分屏下界面显示模糊，且官方固件资源分散不易下载，甚至常与 Newmen GM980 等相近型号驱动混淆而无法识别。

本项目通过反编译官方驱动与逆向中颖（SinoWealth）BYK916 芯片通信协议，采用浏览器原生 **WebHID API** 重构了全部核心配置流程，提供丝滑流畅的暗黑赛博风格交互。

---

## ✨ 核心特性

- **🎨 22 种官方动态 RGB 灯效 1:1 精确对齐**
  - 常亮模式、呼吸模式、梦幻彩虹、一触即发、雨中漫步、彩虹轮盘、涟漪扩散、繁星点点、踏雪无痕、川流不息、随波逐流、如影随形、正弦光波、左右扫描、旋转风车、七彩瀑布、花开富贵、旋转风暴、来回碰撞、十全十美、游戏模式、关闭灯光。
  - 支持 **5 档亮度** (0~4) 与 **5 档速度** (0~4) 微调。
  - 8 种预设纯色与彩虹轮换：针对 BYK916 PCB 固件通道进行了专门校准，修复了绿蓝反转问题（绿色 0x02、蓝色 0x01）。
  - 支持「实时发送」滑动即下发，或点击手动下发。

- **🔧 按键自定义重映射 (Remap) & 批量多选**
  - 支持**单选选中**与**点击再次取消选中**。
  - 支持**多选模式**：开启多选开关，或按住 `Ctrl` / `Shift` 键点击多个按键进行批量选择。
  - 提供常用**快速选区**：F区、字母区、数字小键盘、方向键、全选、清除选择。
  - 快速映射为常用功能：音量控制（增/减/静音）、媒体播放（上一曲/下一曲/播放暂停）、系统快捷键（我的电脑/计算器/默认浏览器/锁屏等）、鼠标按键（左键/右键/中键/滚轮）。

- **⌨️ 98键 1:1 真实几何模型与按键测试**
  - 严格提取官方 `Cfg.ini` 坐标数据，按键间距、大键位比例与物理真机完全一致。
  - 集成按键实时击键检测（支持普通按键测试与高亮标记已测试键位）。
  - 内置 Web Audio 击键音效合成与击键计数器。

- **📊 硬件报文与通信日志监视器**
  - 实时打印 WebHID 报文数据流（Feature Report 0x05 参数查询、0x06 完整参数配置下发）。
  - 清晰呈现 16 进制状态码，便于协议分析与开发者二次开发。

---

## 🛠️ 硬件与协议规范

| 属性 | 参数值 | 说明 |
| :--- | :--- | :--- |
| **厂商 ID (VID)** | `0x258A` | SinoWealth 中颖微电子标准外设 VID |
| **产品 ID (PID)** | `0x0049` | 迈从 (MCHOSE) K980 专属三模键盘 PID |
| **主控芯片 MCU** | SinoWealth BYK916 | 8051 架构三模键盘协议主控 |
| **通信接口** | USB HID Feature Report | Report ID `0x06` (1032 字节下发), Report ID `0x05` (查询) |
| **灯光色码定义** | 红: `0`, 绿: `2`, 蓝: `1`, 黄: `4`, 紫: `3`, 青: `5`, 白: `6`, 幻彩: `7` | 适配此 PCB 固件通道映射 |

> [!IMPORTANT]
> **使用注意**：请确保键盘处于 **USB 有线连接模式**（三模开关拨至有线挡，并使用 Type-C 数据线直连电脑），并在 **Google Chrome** 或 **Microsoft Edge** 等支持 WebHID 的现代浏览器中打开。

---

## 🚀 使用方法

### 方式 1：免安装在线使用（推荐）
直接使用 Chrome 或 Edge 访问：
👉 **[https://relife-1.github.io/k980-webhid-driver/](https://relife-1.github.io/k980-webhid-driver/)**
点击右上角「连接键盘」，在浏览器弹出的 HID 设备选择框中选中并授权 `K980 Keyboard` 即可。

### 方式 2：本地离线运行
1. 克隆或下载本仓库代码到本地：
   ```bash
   git clone https://github.com/ReLIFE-1/k980-webhid-driver.git
   cd k980-webhid-driver
   ```
2. 双击运行 `启动网页驱动.bat`（或在终端运行 `python server.py`）。
3. 浏览器会自动弹出并打开 `http://localhost:8080`，无须联网即可使用。

---

## 📂 项目结构

```text
k980-webhid-driver/
├── index.html              # 纯客户端 WebHID 驱动主页面 (Vue 3 + Tailwind CSS)
├── keys.js                 # 98键物理坐标布局与键位映射库 (提取自官方 Cfg.ini)
├── server.py               # 本地轻量级 HTTP 服务端 (离线模式使用)
├── 启动网页驱动.bat         # Windows 一键启动脚本
├── generate_keys.py        # 从 Cfg.ini 提取解析键位坐标与扫描码的生成脚本
├── keys.json               # 提取的 JSON 格式按键元数据
└── README.md               # 项目技术说明与使用文档
```

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源发布。
任何涉及按键协议与参数仅用于个人设备配置与开源学习交流。
