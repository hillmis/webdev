class Editor {
    constructor() {
        this.editorContainer = document.getElementById('monaco-editor');
        this.editorTabs = document.querySelector('.editor-tabs');
        this.languageSelector = document.querySelector('.language-selector');
        this.previewFrame = document.getElementById('preview-frame');
        this.openFiles = new Map();
        this.currentFile = null;
        this.autoPreviewEnabled = true;
        // 等待DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeMonaco();
                this.initializeEventListeners();

            });
        } else {
            this.initializeMonaco();
            this.initializeEventListeners();
        }
    }

    async initializeMonaco() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs' } });

        await new Promise(resolve => {
            require(['vs/editor/editor.main'], () => {
                // 创建默认模型
                this.defaultModel = monaco.editor.createModel('', 'plaintext');
                this.editor = monaco.editor.create(this.editorContainer, {
                    value: '',
                    language: 'html',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 4,
                    insertSpaces: true,
                    colorDecorators: true, // 启用颜色装饰器
                    // 添加颜色预览配置
                    colorDecoratorsLimit: 1000, // 设置颜色预览的最大数量限制  
                    colorDecoratorsActivatedOn: 'hover', // 设置何时激活颜色预览
                });
                // 初始设置为默认模型
                this.editor.setModel(this.defaultModel);
                resolve();
            });
        });
        //

        // 处理编辑器内容变化
        this.editor.onDidChangeModelContent(() => {
            if (this.currentFile) {
                const content = this.editor.getValue();
                window.fileManager.files.set(this.currentFile, content);

                // 当文件内容变化时保存到indexedDB
                if (window.fileManager && typeof window.fileManager.saveToIndexedDB === 'function') {
                    window.fileManager.saveToIndexedDB();
                }

                this.updatePreview();
            }
        });
    }

    initializeEventListeners() {
        // 监听文件打开事件
        window.addEventListener('file-open', (event) => {
            const { path, content } = event.detail;
            this.openFile(path, content);
        });

        // 监听文件重命名事件
        window.addEventListener('file-renamed', (event) => {
            const { oldPath, newPath } = event.detail;
            this.handleFileRename(oldPath, newPath);
        });

        // 语言选择器变化
        if (this.languageSelector) {
            this.languageSelector.addEventListener('change', () => {
                if (this.currentFile && this.editor) {
                    const language = this.languageSelector.value;
                    monaco.editor.setModelLanguage(this.editor.getModel(), language);
                }
            });
        }

        // 标签点击委托
        if (this.editorTabs) {
            Utils.delegate(this.editorTabs, 'click', '.editor-tab', (event) => {
                const closeBtn = event.target.closest('.close-tab');
                const tab = event.target.closest('.editor-tab');

                if (closeBtn) {
                    this.closeFile(tab.dataset.path);
                } else {
                    this.switchToFile(tab.dataset.path);
                }
            });
        }

        // 查找和替换按钮
        const findBtn = document.querySelector('[title="查找和替换"]');
        if (findBtn) {
            findBtn.addEventListener('click', () => {
                this.toggleFindWidget();
            });
        }

        // 颜色选择器按钮
        const colorPickerBtn = document.querySelector('[title="颜色选择器"]');
        if (colorPickerBtn) {
            colorPickerBtn.addEventListener('click', () => {
                this.openColorPicker();
            });
        }
    }

    createTab(path) {
        const fileName = path === 'untitled' ? 'Untitled' : path.split('/').pop();
        const extension = path === 'untitled' ? 'txt' : path.split('.').pop();

        const tab = Utils.createElement('div', {
            className: 'editor-tab',
            'data-path': path
        }, [
            Utils.createElement('i', { className: this.getFileIcon(extension) }),
            document.createTextNode(fileName),
            Utils.createElement('span', { className: 'close-tab' }, [
                Utils.createElement('i', { className: 'fas fa-times' })
            ])
        ]);

        this.editorTabs.appendChild(tab);
        return tab;
    }

    getFileIcon(extension) {
        const iconMap = {
            js: 'fab fa-js',
            html: 'fab fa-html5',
            css: 'fab fa-css3',
            json: 'fas fa-code',
            md: 'fas fa-file-alt'
        };
        return iconMap[extension] || 'fas fa-file-code';
    }

    getLanguageFromExtension(extension) {
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'markdown': 'markdown',
            'py': 'python',
            'python': 'python',
            'rb': 'ruby',
            'ruby': 'ruby',
            'php': 'php',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'cpp',
            'cs': 'csharp',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'rust': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'kotlin': 'kotlin',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sh': 'shell',
            'bash': 'shell',
            'sql': 'sql'
        };

        return languageMap[extension.toLowerCase()] || 'plaintext';
    }

    openFile(path, content) {
        // 检查文件是否已打开
        if (this.openFiles.has(path)) {
            this.switchToFile(path);
            return;
        }

        // 创建新模型
        const extension = path.split('.').pop();
        const language = this.getLanguageFromExtension(extension);
        const model = monaco.editor.createModel(content, language);

        // 存储模型
        this.openFiles.set(path, model);

        // 创建新标签
        this.createTab(path);

        // 切换到新文件
        this.switchToFile(path);

        // 更新预览
        this.updatePreview();

        // 高亮文件在文件管理器中
        if (window.fileManager) {
            window.fileManager.highlightSelectedFile(path);
            window.fileManager.updateCurrentPathDisplay(path);
        }
    }
    closeAllActiveWidgets() {
        // 关闭查找小部件
        const findWidget = this.editor.getContribution('editor.contrib.findController');
        if (findWidget) {
            findWidget.closeFindWidget();
        }

        // 关闭颜色选择器（如果有）
        if (this.colorPickerWidget) {
            this.colorPickerWidget.close();
            this.colorPickerWidget = null;
        }
        if (this.mediaPlayer) {
            this.mediaPlayer.pause();
            this.mediaPlayer = null;
        }
    }
    switchToFile(path) {
        if (!this.openFiles.has(path)) return;
        // 关闭当前文件的所有活动
        this.closeAllActiveWidgets();
        // 获取该文件的模型
        const model = this.openFiles.get(path);

        // 将模型设置为编辑器的当前模型
        this.editor.setModel(model);

        // 更新当前文件引用
        this.currentFile = path;

        // 更新活动标签
        const tabs = this.editorTabs.querySelectorAll('.editor-tab');
        tabs.forEach(tab => {
            if (tab.dataset.path === path) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 更新语言选择器
        if (this.languageSelector) {
            const extension = path.split('.').pop();
            const language = this.getLanguageFromExtension(extension);

            // 检查语言是否在选择器选项中
            const option = Array.from(this.languageSelector.options).find(opt => opt.value === language);

            if (option) {
                this.languageSelector.value = language;
            }
        }

        // 在文件资源管理器中高亮文件
        if (window.fileManager) {
            window.fileManager.highlightSelectedFile(path);
        }

        // 如果需要，更新预览
        this.updatePreview();
    }
    closeFile(path) {
        if (!this.openFiles.has(path)) return;

        // 获取标签元素
        const tab = this.editorTabs.querySelector(`.editor-tab[data-path="${path}"]`);
        if (!tab) return;

        // 获取模型
        const model = this.openFiles.get(path);

        // 移除标签
        tab.remove();

        // 释放模型
        model.dispose();

        // 从打开的文件中移除
        this.openFiles.delete(path);

        // 如果这是当前文件，切换到另一个文件
        if (this.currentFile === path) {
            // 关闭当前文件的所有活动
            this.closeAllActiveWidgets();
            // 找到另一个文件进行切换
            const nextFile = this.openFiles.keys().next().value;
            if (nextFile) {
                this.switchToFile(nextFile);
            } else {
                // 没有文件打开，清空编辑器
                this.currentFile = null;
                this.editor.setModel(null);

                // 清除预览内容
                if (this.previewFrame) {
                    this.previewFrame.srcdoc = ''; // 清除 iframe 的内容
                }

                // 发送事件通知清除预览
                window.dispatchEvent(new CustomEvent('clear-preview'));
            }
        }

        // 处理最后一个文件关闭的情况
        if (this.currentFile === path) {
            const nextFile = this.openFiles.keys().next().value;
            if (nextFile) {
                this.switchToFile(nextFile);
            } else {
                // 切换到默认模型并创建虚拟标签
                this.currentFile = 'untitled';
                this.editor.setModel(this.defaultModel);
                this.createTab('untitled');

                // 清除预览内容
                if (this.previewFrame) {
                    this.previewFrame.srcdoc = ''; // 清除 iframe 的内容
                }

                // 发送事件通知清除预览
                window.dispatchEvent(new CustomEvent('clear-preview'));
            }
        }
    }
    updatePreview() {
        if (!this.currentFile) return;

        const extension = this.currentFile.split('.').pop().toLowerCase();
        const content = this.editor.getValue();

        // 对于HTML文件，直接更新预览
        if (extension === 'html') {
            window.dispatchEvent(new CustomEvent('content-change', {
                detail: { content: content }
            }));
        }
        // 对于CSS或JS文件，查找相关的HTML文件并更新预览
        else if ((extension === 'css' || extension === 'js') && this.previewFrame) {
            // 存储当前文件内容
            window.fileManager.files.set(this.currentFile, content);

            // 查找第一个打开的HTML文件或项目中的任何HTML文件
            const htmlFiles = Array.from(this.openFiles.keys()).filter(file => file.endsWith('.html'));
            if (htmlFiles.length === 0) {
                // 查找项目中的任何HTML文件
                htmlFiles.push(...Array.from(window.fileManager.files.keys()).filter(file => file.endsWith('.html')));
            }

            if (htmlFiles.length > 0) {
                const htmlContent = window.fileManager.files.get(htmlFiles[0]);
                if (htmlContent) {
                    window.dispatchEvent(new CustomEvent('content-change', {
                        detail: { content: htmlContent }
                    }));
                }
            }
        }
    }

    toggleFindWidget() {
        // Monaco Editor 有内置的查找小部件
        this.editor.getAction('actions.find').run();
    }

    handleFileRename(oldPath, newPath) {
        // 更新打开的文件映射
        if (this.openFiles.has(oldPath)) {
            const model = this.openFiles.get(oldPath);
            this.openFiles.delete(oldPath);
            this.openFiles.set(newPath, model);

            // 更新当前文件引用
            if (this.currentFile === oldPath) {
                this.currentFile = newPath;
            }

            // 更新标签
            const tab = this.editorTabs.querySelector(`[data-path="${oldPath}"]`);
            if (tab) {
                tab.dataset.path = newPath;
                const fileName = newPath.split('/').pop();
                const tabName = tab.querySelector('.tab-name');
                if (tabName) {
                    tabName.textContent = fileName;
                    tabName.title = newPath;
                }
            }
        }
    }
}

// 初始化编辑器
window.editor = new Editor();