# WebDev 网页开发工具

WebDev 是一个基于浏览器的网页开发工具，旨在为开发者提供一个轻量级、功能丰富的开发环境。它集成了代码编辑器、文件管理器、实时预览、终端和 AI 聊天助手等功能，帮助开发者更高效地进行网页开发。

## 功能特性

- **代码编辑器**：基于 Monaco Editor，支持多种编程语言（如 HTML、CSS、JavaScript 等），提供语法高亮、代码补全、错误检查等功能。
- **文件管理器**：支持文件的新建、删除、重命名、拖放操作，支持文件夹的创建和管理，支持从 ZIP 文件导入项目。
- **实时预览**：支持实时预览 HTML、CSS 和 JavaScript 文件，提供多种设备视图（如手机、平板、桌面等），支持横竖屏切换和全屏预览。
- **终端**：内置终端，支持基本的命令行操作（如 `ls`、`mkdir`、`touch` 等），方便开发者进行文件操作和项目管理。
- **AI 聊天助手**：集成 AI 聊天助手，帮助开发者解决编程问题，提供代码示例和调试建议。
- **项目管理**：支持项目的创建、导入、导出，支持文件的保存和版本管理。

## 项目结构

```
webdev/
├── css/                # 样式文件
│   └── style.css       # 主样式文件
├── js/                 # JavaScript 文件
│   ├── app.js          # 主应用逻辑
│   ├── editor.js       # 代码编辑器逻辑
│   ├── file-manager.js # 文件管理器逻辑
│   ├── preview.js      # 实时预览逻辑
│   ├── terminal.js     # 终端逻辑
│   ├── console.js      # 控制台逻辑
│   ├── ai-chat.js      # AI 聊天助手逻辑
│   └── utils.js        # 工具函数
├── index.html          # 主页面
├── start.html          # 起始页
└── readme.md           # 项目文档
```

## 快速开始

1. **克隆项目**：
   ```bash
   git clone https://github.com/hillmis/webdev.git
   cd webdev
   ```

2. **打开项目**：
   - 打开 `index.html` 文件即可启动 WebDev 工具。

3. **使用说明**：
   - **新建项目**：点击工具栏中的“新建项目”按钮，输入项目名称即可创建一个新项目。
   - **导入项目**：支持从文件夹或 ZIP 文件导入现有项目。
   - **编辑文件**：在文件管理器中双击文件即可在编辑器中打开并进行编辑。
   - **实时预览**：编辑 HTML、CSS 或 JavaScript 文件时，预览面板会自动更新。
   - **使用终端**：在底部面板中切换到终端选项卡，输入命令即可进行操作。
   - **AI 聊天助手**：在底部面板中切换到 AI 聊天选项卡，输入问题即可获取帮助。

## 技术栈

- **前端**：HTML、CSS、JavaScript
- **编辑器**：Monaco Editor
- **文件管理**：IndexedDB
- **终端**：自定义终端实现
- **AI 聊天**：基于简单的模式匹配和响应生成

## 依赖

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)：代码编辑器
- [JSZip](https://stuk.github.io/jszip/)：处理 ZIP 文件
- [Font Awesome](https://fontawesome.com/)：图标库

## 贡献

欢迎贡献代码和提出建议！请遵循以下步骤：

1. Fork 项目
2. 创建新的分支 (`git checkout -b feature/YourFeature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/YourFeature`)
5. 创建 Pull Request

## 许可证

本项目基于 MIT 许可证开源。

## 联系

如有任何问题或建议，请联系 [Hillmis](mailto:hillmis@qq.com)。

---

感谢使用 WebDev 网页开发工具！希望它能帮助你更高效地进行网页开发。
