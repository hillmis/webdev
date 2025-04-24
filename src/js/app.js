class App {
    constructor() {
        // 等待 DOM 完全加载后再进行初始化
        document.addEventListener('DOMContentLoaded', () => {
            this.initializePanelToggles();
            this.initializeTabSwitching();
            this.initializeToolbarButtons();
            console.log('web dev 已初始化');
        });
    }



    initializePanelToggles() {
        const body = document.body;

        // 切换文件管理器
        const fileManagerToggle = document.getElementById('toggle-file-manager');
        if (fileManagerToggle) {
            fileManagerToggle.addEventListener('click', () => {
                const panel = document.querySelector('.file-manager-panel');
                const mask = document.querySelector('.panel-mask');
                if (panel) {
                    this.togglePanel(panel, mask);
                    // 关闭其他面板
                    document.querySelector('.preview-panel')?.classList.remove('active');
                }
            });
        }

        // 切换预览面板
        const previewToggle = document.getElementById('toggle-preview');
        if (previewToggle) {
            previewToggle.addEventListener('click', () => {
                const panel = document.querySelector('.preview-panel');
                const mask = document.querySelector('.panel-mask');
                if (panel) {
                    this.togglePanel(panel, mask);
                    // 关闭其他面板
                    document.querySelector('.file-manager-panel')?.classList.remove('active');
                }
            });
        }

        // 点击遮罩关闭面板
        const mask = document.querySelector('.panel-mask');
        if (mask) {
            mask.addEventListener('click', () => {
                document.querySelectorAll('.file-manager-panel, .preview-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                mask.style.display = 'none';
            });
        }
        //底部窗口切换
        const terminalToggle = document.getElementById('toggle-terminal');
        if (terminalToggle) {
            terminalToggle.addEventListener('click', () => {
                const panel = document.querySelector('.bottom-panel');
                if (panel) {
                    this.togglePanel(panel);
                    // 同时调整底部工具栏的位置
                    const editorToolbar = document.querySelector('.editor-toolbar');
                    if (editorToolbar) {
                        if (panel.classList.contains('active')) {
                            editorToolbar.style.marginBottom = panel.offsetHeight + 'px';
                        } else {
                            editorToolbar.style.marginBottom = '0';
                        }
                    }
                }
            });
        }

        // 设置按钮
        const settingsBtn = document.querySelector('.toolbar-right [title="切换设置"]');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }
    }


    togglePanel(panel, mask) {
        if (window.innerWidth <= 768) {
            // 移动端保持原有抽屉逻辑
            panel.classList.toggle('active');
            if (mask) mask.style.display = panel.classList.contains('active') ? 'block' : 'none';
        } else {
            // 桌面端直接切换显示/隐藏
            const wasVisible = panel.style.display !== 'none';
            panel.style.display = wasVisible ? 'none' : 'flex';
            // 自动调整编辑器布局
            if (window.editor && window.editor.editor) {
                setTimeout(() => window.editor.editor.layout(), 100);
            }
        }
    }

    initializeTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (!tabButtons || tabButtons.length === 0) return;

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.activateTab(button);
            });
        });
    }

    activateTab(tabButton) {
        if (!tabButton) return;

        // 取消所有标签的激活状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // 激活选中的标签
        tabButton.classList.add('active');
        const targetId = tabButton.dataset.target;
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
            targetPane.classList.add('active');
        }
    }
    async handleZipImport(file) {
        try {
            const zipFileName = file.name.replace(/\.zip$/, '');
            const zip = await JSZip.loadAsync(file);

            // 清空现有文件
            window.fileManager.files.clear();
            document.querySelector('.file-tree').innerHTML = '';

            // 处理ZIP内容
            zip.forEach(async (relativePath, entry) => {
                if (!entry.dir) {
                    const cleanPath = relativePath.replace(/\\/g, '/').replace(/\/+/g, '/');
                    const content = await entry.async('text');
                    window.fileManager.files.set(cleanPath, content);
                }
            });

            // 更新UI和项目名称
            window.fileManager.setProjectName(zipFileName);
            window.fileManager.refreshFileExplorer();

            alert('导入成功！');
        } catch (error) {
            console.error('导入 ZIP 时出错:', error);
            alert('导入失败: ' + error.message);
        }

    }

    initializeToolbarButtons() {
        // 新建项目按钮
        const newProjectBtn = document.querySelector('.toolbar-left [title="新建项目"]');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.createNewProject();
            });
        }

        // 打开文件夹按钮
        const openFolderBtn = document.querySelector('.toolbar-left [title="从文件夹导入项目"]');
        if (openFolderBtn) {
            openFolderBtn.addEventListener('click', () => {
                this.openFolder();
            });
        }

        // 保存按钮
        const saveBtn = document.querySelector('.editor-toolbar [title="保存"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCurrentFile();
            });
        }

        // 导入zip项目按钮
        const importZipBtn = document.querySelector('.toolbar-left [title="从ZIP导入项目"]');
        if (importZipBtn) {
            importZipBtn.addEventListener('click', async () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.zip';
                fileInput.onchange = async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        await this.handleZipImport(file);
                    }
                };
                fileInput.click();
            });
        }
        const exportZipBtn = document.querySelector('.toolbar-left [title="导出项目到ZIP"]');
        if (exportZipBtn) {
            exportZipBtn.addEventListener('click', async () => {
                const zipBlob = await Utils.createZipFile(window.fileManager.files);
                Utils.downloadFile(zipBlob, 'project.zip');
            });
        }

    }

    createNewProject() {
        if (confirm('新建一个项目？当前的项目文件将被清除。')) {
            // 提示输入项目名称
            const projectName = prompt('输入项目名:', '未命名项目');
            if (!projectName) return; // 用户取消

            // 清空文件树
            const fileTree = document.querySelector('.file-tree');
            if (fileTree) {
                fileTree.innerHTML = '';
            }

            // 清空编辑器标签
            const editorTabs = document.querySelector('.editor-tabs');
            if (editorTabs) {
                editorTabs.innerHTML = '';
            }

            // 重置编辑器内容
            if (window.editor && window.editor.editor) {
                window.editor.editor.setValue('');
                window.editor.currentFile = null;
                window.editor.openFiles.clear();
            }

            // 重置文件管理器
            if (window.fileManager) {
                window.fileManager.files.clear();
                window.fileManager.currentPath = '';
                window.fileManager.setProjectName(projectName);
            }

            // 清空预览
            if (window.preview) {
                window.preview.updatePreview('');
            }

            console.log('已创建新项目');
        }
    }

    async openFolder() {
        try {
            // 打开文件夹选择器
            const dirHandle = await window.showDirectoryPicker();

            // 清空现有文件
            document.querySelector('.file-tree').innerHTML = '';
            if (window.fileManager) {
                window.fileManager.files.clear();
            }

            // 根据文件夹名称设置项目名称
            if (window.fileManager) {
                window.fileManager.setProjectName(dirHandle.name);
            }

            // 处理目录
            await this.processDirectory(dirHandle, '');

            console.log('文件夹已成功打开');
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('文件夹选择已取消');
            } else {
                console.error('打开文件夹时出错:', error);
                alert('打开文件夹时出错: ' + error.message);
            }
        }
    }

    async processDirectory(dirHandle, path) {
        if (!window.fileManager) return;

        for await (const entry of dirHandle.values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
                try {
                    const file = await entry.getFile();
                    const content = await file.text();
                    window.fileManager.files.set(entryPath, content);
                    window.fileManager.createFileElement(entryPath);
                } catch (error) {
                    console.error(`读取文件 ${entryPath} 时出错:`, error);
                }
            } else if (entry.kind === 'directory') {
                const folderContainer = window.fileManager.createFolderElement(entryPath);
                await this.processDirectory(entry, entryPath);
            }
        }
    }

    saveCurrentFile() {
        if (!window.editor || !window.editor.currentFile || !window.editor.editor) {
            alert('当前没有打开的文件');
            return;
        }

        const path = window.editor.currentFile;
        const content = window.editor.editor.getValue();

        if (window.fileManager) {
            window.fileManager.files.set(path, content);
        }

        // 显示保存通知
        this.showNotification(`文件 "${path}" 已保存`);
    }

    openSettings() {
        // 创建设置模态对话框
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = `
  <div class="settings-content">
    <div class="settings-header">
        <h2>设置</h2>
        <button class="close-settings">&times;</button>
    </div>
    <div class="settings-body">
        <div class="settings-section">
            <h3>编辑器</h3>
            <div class="setting-item">
                <label for="editor-theme">主题:</label>
                <select id="editor-theme">
                    <option value="vs-dark">深色</option>
                    <option value="vs">浅色</option>
                    <option value="hc-black">高对比度</option>
                </select>
            </div>
            <div class="setting-item">
                <label for="editor-font-size">字体大小:</label>
                <input type="number" id="editor-font-size" min="10" max="30" value="14">
            </div>
             <div class="setting-item">
                <label>版本:</label>
                <a href="https://cdn.jsdelivr.net/npm/monaco-editor@0.40.0/min/vs/" target="_blank" style="display: flex; align-items: center; color: var(--text-color);text-decoration: none;">
                monaco-editor-0.40.0
                </a>
            </div>
        </div>
        <div class="settings-section">
            <h3>应用</h3>
            <div class="setting-item">
                <label for="language-select">语言:</label>
                <select id="language-select">
                    <option value="en">英文</option>
                    <option value="zh">中文</option>
                </select>
            </div>
            <div class="setting-item">
                <label>GitHub 仓库:</label>
                <a href="https://github.com/hillmis/webdev" target="_blank" style="display: flex; align-items: center; color: var(--text-color);text-decoration: none;">
                    <i class="fab fa-github" style="font-size: 1.2em; margin-right: 8px;"></i>
                   
                </a>
            </div>
            <div class="setting-item">
                <label>作者:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="flex: 1;">
                        <p style="margin: 0; font-size: 0.9em;"><a href="https://iu13.fun" target="_blank" style="color: var(--text-color);text-decoration: none;">hillmis</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="settings-footer">
        <button class="save-settings">保存</button>
        <button class="cancel-settings">取消</button>
    </div>
</div>
        `;

        document.body.appendChild(modal);

        // 关闭按钮事件
        modal.querySelector('.close-settings').addEventListener('click', () => {
            modal.remove();
        });

        // 取消按钮事件
        modal.querySelector('.cancel-settings').addEventListener('click', () => {
            modal.remove();
        });

        // 保存按钮事件
        modal.querySelector('.save-settings').addEventListener('click', () => {
            const theme = modal.querySelector('#editor-theme').value;
            const fontSize = parseInt(modal.querySelector('#editor-font-size').value);

            // 应用设置
            if (window.editor && window.editor.editor) {
                monaco.editor.setTheme(theme);
                window.editor.editor.updateOptions({ fontSize });
            }

            modal.remove();
            this.showNotification('设置已保存');
        });
    }

    showNotification(message, duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        document.body.appendChild(notification);

        // 执行淡入动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 持续时间后移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    initializePanels() {

        // 确保面板默认可见
        const fileManagerPanel = document.querySelector('.file-manager-panel');
        const previewPanel = document.querySelector('.preview-panel');

        if (fileManagerPanel) {
            fileManagerPanel.style.display = 'flex';
        }

        if (previewPanel) {
            previewPanel.style.display = 'flex';
        }
    }
}

// 初始化应用
window.app = new App();
// 禁用右键菜单
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});