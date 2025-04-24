class FileManager {
    constructor() {
        this.fileTree = document.querySelector('.file-tree');
        this.currentPath = '';
        this.files = new Map();
        this.selectedFile = null;
        this.draggedItem = null;
        this.clipboard = null;
        this.projectName = 'Untitled Project';
        this.projectNameElement = document.querySelector('.project-name');
        this.currentPathElement = document.querySelector('.current-path');
        // 初始化 IndexedDB
        this.db = null;
        this.initIndexedDB();

        // 等待 DOM 完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();

            });
        } else {
            this.initializeEventListeners();


        }
    }

    // 初始化 IndexedDB
    initIndexedDB() {
        const request = indexedDB.open('editorProjectDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('projects')) {
                const store = db.createObjectStore('projects', { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: true });
            }
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadFromIndexedDB();
        };

        request.onerror = (event) => {
            console.error('IndexedDB 错误:', event.target.error);
        };

    }

    // 保存项目到 IndexedDB
    saveToIndexedDB() {
        if (!this.db) return;

        const transaction = this.db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');

        const projectData = {
            id: 1, // 假设我们只保存一个项目
            name: this.projectName,
            currentPath: this.currentPath,
            files: Object.fromEntries(this.files)
        };

        store.put(projectData);

        transaction.oncomplete = () => {
            console.log('项目已保存到 IndexedDB');
        };

        transaction.onerror = (event) => {
            console.error('保存到 IndexedDB 时出错:', event.target.error);
        };
    }

    // 从 IndexedDB 加载项目
    loadFromIndexedDB() {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.get(1);

            request.onsuccess = (event) => {
                const projectData = event.target.result;
                if (projectData) {
                    this.projectName = projectData.name;
                    if (this.projectNameElement) {
                        this.projectNameElement.textContent = this.projectName;
                        this.projectNameElement.title = this.projectName;
                    }

                    this.currentPath = projectData.currentPath || '';
                    this.files = new Map(Object.entries(projectData.files || {}));

                    console.log('项目已从 IndexedDB 加载');

                    this.refreshFileExplorer(); // 数据加载完成后刷新文件树
                    resolve();
                } else {
                    console.log('IndexedDB 中没有项目数据');

                    this.refreshFileExplorer(); // 数据加载完成后刷新文件树
                    resolve();
                }
            };

            request.onerror = (event) => {
                console.error('从 IndexedDB 加载时出错:', event.target.error);
                reject(event.target.error);
            };
        });


    }

    initializeEventListeners() {
        // 文件树点击事件
        if (this.fileTree) {
            Utils.delegate(this.fileTree, 'click', '.file-tree-item', (event) => {
                const item = event.target.closest('.file-tree-item');
                const path = item.dataset.path;

                if (item.querySelector('.folder-icon')) {
                    this.toggleFolder(item);
                } else {
                    this.openFile(path);
                }
            });

            // 拖放事件
            Utils.delegate(this.fileTree, 'dragstart', '.file-tree-item', (event) => {
                this.handleDragStart(event);
            });

            Utils.delegate(this.fileTree, 'dragover', '.file-tree-item, .folder-content', (event) => {
                this.handleDragOver(event);
            });

            Utils.delegate(this.fileTree, 'dragleave', '.file-tree-item, .folder-content', (event) => {
                this.handleDragLeave(event);
            });

            Utils.delegate(this.fileTree, 'drop', '.file-tree-item, .folder-content', (event) => {
                this.handleDrop(event);
            });

            Utils.delegate(this.fileTree, 'dragend', '.file-tree-item', (event) => {
                this.handleDragEnd(event);
            });
            // 双击重命名功能
            this.fileTree.addEventListener('dblclick', (event) => {
                const item = event.target.closest('.file-tree-item');
                if (item) {
                    // 防止事件冒泡到父元素
                    event.stopPropagation();

                    // 如果是文件夹，确保它是关闭状态
                    const isFolder = item.querySelector('.folder-icon');
                    if (isFolder) {
                        const content = item.nextElementSibling;
                        if (content.style.display === 'block') {
                            this.toggleFolder(item);
                        }
                    }

                    this.startInlineRename(item);
                }
            });

        }

        // 右键菜单事件
        document.addEventListener('contextmenu', (event) => {
            const item = event.target.closest('.file-tree-item');
            if (item && this.fileTree.contains(item)) {
                event.preventDefault();
                this.showContextMenu(event, item);
            }
        });

        // 右键菜单点击处理
        document.querySelector('.context-menu').addEventListener('click', (event) => {
            const menuItem = event.target.closest('li');
            if (!menuItem) return;

            const action = menuItem.dataset.action;
            const targetPath = document.querySelector('.context-menu').dataset.targetPath;

            switch (action) {
                case 'delete':
                    this.deleteItem(targetPath);
                    break;
                case 'copy':
                    this.copyItem(targetPath);
                    break;
                case 'paste':
                    this.pasteItem(targetPath);
                    break;
                case 'copy-path':
                    this.copyPathToClipboard(targetPath);
                    break;
            }
        });
        // 阻止默认右键菜单
        document.addEventListener('contextmenu', (event) => {
            if (event.target.closest('.file-tree-item')) {
                event.preventDefault();
            }
        });

        // 刷新按钮
        const refreshBtn = document.querySelector('[title="刷新"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshFileExplorer());
        }


        const undoBtn = document.querySelector('.editor-toolbar [title="撤销"]');
        const redoBtn = document.querySelector('.editor-toolbar [title="重做"]');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (window.editor && window.editor.editor) {
                    window.editor.editor.trigger('source', 'undo');
                }
            });
        }

        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                if (window.editor && window.editor.editor) {
                    window.editor.editor.trigger('source', 'redo');
                }
            });
        }
        // 点击文件树外部确认重命名
        document.addEventListener('click', (event) => {
            const renameInput = this.fileTree.querySelector('.rename-input');
            if (renameInput && !renameInput.contains(event.target)) {
                this.finishInlineRename(renameInput);
            }
        });

        // 按下 Enter 键确认重命名
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const renameInput = this.fileTree.querySelector('.rename-input');
                if (renameInput) {
                    this.finishInlineRename(renameInput);
                    event.preventDefault();
                }
            }
            // 按下 Escape 键取消重命名
            if (event.key === 'Escape') {
                const renameInput = this.fileTree.querySelector('.rename-input');
                if (renameInput) {
                    this.cancelInlineRename(renameInput);
                    event.preventDefault();
                }
            }
        });

        // 点击其他区域关闭右键菜单
        document.addEventListener('click', () => {
            const contextMenu = document.querySelector('.context-menu');
            if (contextMenu) {
                contextMenu.style.display = 'none';
            }
        });

        const importFileBtn = document.querySelector('[title="导入文件"]');
        const importFolderBtn = document.querySelector('[title="导入文件夹"]');
        const newFileBtn = document.querySelector('[title="新建文件"]');
        const newFolderBtn = document.querySelector('[title="新建文件夹"]');

        if (importFileBtn) {
            importFileBtn.addEventListener('click', () => this.triggerFileImport(false));
        }
        if (importFolderBtn) {
            importFolderBtn.addEventListener('click', () => this.triggerFileImport(true));
        }
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => this.createNew('file'));
        }
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.createNew('folder'));
        }

        // 初始化拖放事件
        this.initDragAndDrop();
    }
    initDragAndDrop() {
        // 文件树拖放事件
        this.fileTree.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fileTree.classList.add('dragover');
        });

        this.fileTree.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fileTree.classList.remove('dragover');
        });

        this.fileTree.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fileTree.classList.remove('dragover');

            const items = e.dataTransfer.items;
            const files = [];
            const folders = [];
            const zipFiles = [];

            // 处理每个拖放项
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file.name.endsWith('.zip')) {
                        zipFiles.push(file);
                    } else if (item.webkitGetAsEntry()?.isDirectory) {
                        folders.push(item.webkitGetAsEntry());
                    } else {
                        files.push(file);
                    }
                }
            }

            // 分别处理不同类型
            if (folders.length > 0) {
                for (const folder of folders) {
                    await this.processFolderEntry(folder);
                }
            }

            if (files.length > 0) {
                await this.handleRegularFiles(files);
            }

            if (zipFiles.length > 0) {
                for (const zipFile of zipFiles) {
                    await this.handleZipFile(zipFile);
                }
            }


            this.saveToIndexedDB();
        });
    }
    async processFolderEntry(entry, path = '') {
        if (entry.isDirectory) {
            const dirReader = entry.createReader();
            const entries = await new Promise(resolve => dirReader.readEntries(resolve));
            for (const e of entries) {
                await this.processFolderEntry(e, `${path}${entry.name}/`);
            }
        } else {
            const file = await new Promise(resolve => entry.file(resolve));
            file._relativePath = `${path}${file.name}`;
            await this.processFileEntry(file, file._relativePath);
        }
    }
    triggerFileImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true; // 允许选择多个文件
        input.accept = '*/*'; // 接受所有文件类型，但优先显示ZIP文件

        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            await this.handleMixedFiles(files); // 处理选中的文件
            this.refreshFileExplorer(); // 刷新文件管理器
            this.saveToIndexedDB(); // 保存到IndexedDB
        });

        input.click();
    }

    // 处理文件夹导入
    async handleFolderImport(files) {
        this.showProgressBar(`正在导入文件夹: ${files[0].name}`);

        // 通过webkitRelativePath获取目录结构
        const rootPath = files[0].webkitRelativePath.split('/')[0];

        for (const file of files) {
            const relativePath = file.webkitRelativePath.replace(`${rootPath}/`, '');
            await this.processFileEntry(file, relativePath);
        }
    }

    // 处理混合文件（普通文件+ZIP）
    async handleMixedFiles(files) {
        const zipFiles = files.filter(f => f.name.endsWith('.zip'));
        const otherFiles = files.filter(f => !f.name.endsWith('.zip'));

        // 先处理普通文件
        if (otherFiles.length > 0) {
            await this.handleRegularFiles(otherFiles);
        }

        // 后处理ZIP文件
        for (const file of zipFiles) {
            await this.handleZipFile(file);
        }
    }

    // 增强的ZIP处理逻辑
    async handleZipFile(zipFile) {
        this.showProgressBar(`正在导入ZIP文件: ${zipFile.name}`);

        try {
            const zip = new JSZip();
            const data = await zipFile.arrayBuffer();
            const loadedZip = await zip.loadAsync(data);

            // 先创建所有目录
            const dirs = new Set();
            loadedZip.forEach((relativePath, entry) => {
                if (entry.dir) {
                    const cleanPath = this.normalizePath(relativePath);
                    dirs.add(cleanPath);
                }
            });

            // 按路径深度排序确保父目录先创建
            const sortedDirs = Array.from(dirs).sort((a, b) =>
                a.split('/').length - b.split('/').length
            );

            for (const dirPath of sortedDirs) {
                this.createFolderElement(dirPath);
            }

            // 处理文件
            const fileEntries = [];
            loadedZip.forEach((relativePath, entry) => {
                if (!entry.dir) {
                    fileEntries.push({
                        path: this.normalizePath(relativePath),
                        entry
                    });
                }
            });

            for (const { path, entry } of fileEntries) {
                const content = await entry.async('text');
                const pathParts = path.split('/');
                const fileName = pathParts.pop();
                const folderPath = pathParts.join('/');

                if (folderPath) {
                    this.ensureParentFoldersExist(folderPath);
                }

                this.files.set(path, content);
                this.createFileElement(path);
            }
        } catch (error) {
            console.error('ZIP处理失败:', error);
            alert(`ZIP文件解析错误: ${error.message}`);
        }
    }

    // 处理常规文件（带路径结构）
    async handleRegularFiles(files) {
        this.showProgressBar(`正在导入${files.length}个文件`);

        for (const file of files) {
            const relativePath = file.webkitRelativePath || file.name;
            await this.processFileEntry(file, relativePath);
        }
    }

    // 统一处理单个文件条目
    async processFileEntry(file, relativePath) {
        const normalizedPath = this.normalizePath(relativePath);
        const pathParts = normalizedPath.split('/');
        const fileName = pathParts.pop();
        const folderPath = pathParts.join('/');

        // 确保父目录存在
        if (folderPath) {
            this.ensureParentFoldersExist(folderPath);
        }

        // 读取文件内容
        const content = await this.readFileContent(file);
        this.files.set(normalizedPath, content);
        this.createFileElement(normalizedPath);
    }

    // 路径标准化处理
    normalizePath(path) {
        return path.replace(/\\/g, '/')        // 转换Windows路径分隔符
            .replace(/\/+/g, '/')      // 去除多余斜杠
            .replace(/\/$/, '');        // 去除末尾斜杠
    }



    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    toggleFolder(folderElement) {
        const content = folderElement.nextElementSibling;
        const icon = folderElement.querySelector('i');
        const path = folderElement.dataset.path;

        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.replace('fa-folder', 'fa-folder-open');

            // 打开文件夹时设置当前路径
            this.currentPath = path;
        } else {
            content.style.display = 'none';
            icon.classList.replace('fa-folder-open', 'fa-folder');

            // 关闭文件夹时重置当前路径
            // 如果这是当前路径，重置为父文件夹或空
            if (this.currentPath === path) {
                const pathParts = path.split('/');
                pathParts.pop();
                this.currentPath = pathParts.join('/');
            }
        }
    }

    createNew(type) {
        // 在当前路径或根目录中创建
        this.createNewInFolder(this.currentPath, type);
    }

    createNewInFolder(folderPath, type) {
        // 为新文件/文件夹创建内联输入
        const folderElement = folderPath ?
            this.fileTree.querySelector(`[data-path="${folderPath}"]`) : null;

        // 如果文件夹存在，确保它是打开的
        if (folderElement && folderElement.closest('.folder')) {
            const content = folderElement.nextElementSibling;
            const icon = folderElement.querySelector('i');

            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.classList.replace('fa-folder', 'fa-folder-open');
            }

            // 在文件夹内容中创建新项目输入
            this.createInlineInput(content, type, folderPath);
        } else {
            // 在根级别创建
            this.createInlineInput(this.fileTree, type, '');
        }
    }
    createInlineInput(container, type, parentPath) {
        // 移除任何现有的内联输入
        const existingInput = this.fileTree.querySelector('.new-item-input');
        if (existingInput) {
            existingInput.remove();
        }

        const icon = type === 'file' ? 'fa-file' : 'fa-folder';
        const inputContainer = Utils.createElement('div', {
            className: 'file-tree-item new-item-input'
        }, [
            Utils.createElement('i', { className: `fas ${icon}` }),
            Utils.createElement('input', {
                type: 'text',
                placeholder: `New ${type} name...`,
                className: 'inline-input'
            })
        ]);

        container.appendChild(inputContainer);

        const input = inputContainer.querySelector('input');
        input.focus();

        // 处理回车键确认
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const name = input.value.trim();
                if (name) {
                    const path = parentPath ? `${parentPath}/${name}` : name;

                    // 检查文件/文件夹是否已存在
                    const existingItem = this.fileTree.querySelector(`[data-path="${path}"]`);
                    if (existingItem) {
                        alert(`A ${type} with this name already exists.`);
                        input.select();
                        return;
                    }

                    if (type === 'file') {
                        this.files.set(path, '');
                        this.createFileElement(path, container);
                        this.saveToIndexedDB();
                    } else {
                        this.createFolderElement(path, container);
                        this.saveToIndexedDB();
                    }
                }
                inputContainer.remove();
                event.preventDefault();
            }
            // 处理 ESC 键取消
            if (event.key === 'Escape') {
                inputContainer.remove();
                event.preventDefault();
            }
        });

        // 处理失去焦点时确认
        input.addEventListener('blur', () => {
            const name = input.value.trim();
            if (name) {
                const path = parentPath ? `${parentPath}/${name}` : name;

                // 检查文件/文件夹是否已存在
                const existingItem = this.fileTree.querySelector(`[data-path="${path}"]`);
                if (existingItem) {
                    inputContainer.remove();
                    return;
                }

                if (type === 'file') {
                    this.files.set(path, '');
                    this.createFileElement(path, container);
                    this.saveToIndexedDB();
                } else {
                    this.createFolderElement(path, container);
                    this.saveToIndexedDB();
                }
            }
            inputContainer.remove();
        });
    }

    // 开始内联重命名
    startInlineRename(item) {
        if (!item) return;

        const path = item.dataset.path;
        const name = path.split('/').pop();
        const label = item.querySelector('.item-name');

        if (!label) return;

        // 创建输入元素
        const input = Utils.createElement('input', {
            type: 'text',
            className: 'rename-input',
            value: name,
            'data-original-path': path
        });

        // 替换标签为输入框
        label.replaceWith(input);

        // 聚焦并选择所有文本
        input.focus();
        input.select();

        // 处理回车键确认
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.finishInlineRename(input);
                event.preventDefault();
            }
            // 处理 ESC 键取消
            if (event.key === 'Escape') {
                this.cancelInlineRename(input);
                event.preventDefault();
            }
        });

        // 处理失去焦点时确认
        input.addEventListener('blur', () => {
            this.finishInlineRename(input);
        });
    }

    // 完成内联重命名
    finishInlineRename(input) {
        if (!input) return;

        const newName = input.value.trim();
        const originalPath = input.dataset.originalPath;

        if (newName && originalPath && newName !== originalPath.split('/').pop()) {
            const pathParts = originalPath.split('/');
            const parentPath = pathParts.slice(0, -1).join('/');
            const newPath = parentPath ? `${parentPath}/${newName}` : newName;

            // 更新路径属性
            const item = input.closest('.file-tree-item');
            if (item) {
                item.dataset.path = newPath;
            }

            // 如果是文件，更新文件内容引用
            if (this.files.has(originalPath)) {
                const content = this.files.get(originalPath);
                this.files.delete(originalPath);
                this.files.set(newPath, content);
            }

            // 替换输入框为标签
            const label = Utils.createElement('span', { className: 'item-name' }, [newName]);
            input.replaceWith(label);

            // 将更改保存到 IndexedDB
            this.saveToIndexedDB();
        } else {
            this.cancelInlineRename(input);
        }
    }

    // 取消内联重命名
    cancelInlineRename(input) {
        if (!input) return;

        const originalPath = input.dataset.originalPath;
        const name = originalPath.split('/').pop();

        // 创建包含原始名称的文本节点
        const label = Utils.createElement('span', { className: 'item-name' }, [name]);

        // 替换输入框为标签
        input.replaceWith(label);
    }

    createFileElement(path, container = null) {
        const fileName = path.split('/').pop();
        const fileExtension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';

        // 检查文件是否已在 UI 中存在
        const existingFile = this.fileTree.querySelector(`[data-path="${path}"]`);
        if (existingFile) {
            return existingFile;
        }

        // 根据扩展名确定文件图标
        let iconClass = 'fas fa-file';

        // 映射文件扩展名到适当的图标
        const iconMap = {
            // Web 文件
            'html': 'fa-html5',
            'htm': 'fa-html5',
            'css': 'fa-css3-alt',
            'js': 'fa-js',
            'jsx': 'fa-react',
            'ts': 'fa-code',
            'tsx': 'fa-react',

            // 图片
            'jpg': 'fa-image',
            'jpeg': 'fa-image',
            'png': 'fa-image',
            'gif': 'fa-image',
            'svg': 'fa-image',
            'webp': 'fa-image',

            // 文档
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'txt': 'fa-file-alt',
            'md': 'fa-markdown',

            // 代码文件
            'json': 'fa-code',
            'xml': 'fa-code',
            'py': 'fa-python',
            'java': 'fa-java',
            'c': 'fa-code',
            'cpp': 'fa-code',
            'cs': 'fa-code',
            'php': 'fa-php',
            'rb': 'fa-gem',
            'go': 'fa-code',
            'rs': 'fa-code',

            // 配置文件
            'gitignore': 'fa-git',
            'yml': 'fa-file-code',
            'yaml': 'fa-file-code',
            'toml': 'fa-file-code',
            'ini': 'fa-file-code',
            'env': 'fa-file-code',

            // 压缩文件
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            'tar': 'fa-file-archive',
            'gz': 'fa-file-archive',
            '7z': 'fa-file-archive',
        };

        if (iconMap[fileExtension]) {
            iconClass = `fab ${iconMap[fileExtension]}`;
            // 某些图标在 fa- 前缀下而不是 fab
            if (iconMap[fileExtension].startsWith('fa-file')) {
                iconClass = `fas ${iconMap[fileExtension]}`;
            }
        }

        const fileItem = Utils.createElement('div', {
            className: 'file-tree-item',
            'data-path': path,
            draggable: 'true'
        }, [
            Utils.createElement('i', { className: iconClass + ' file-icon' }),
            Utils.createElement('span', { className: 'item-name' }, [fileName])
        ]);

        // 将文件添加到文件树的正确位置
        if (container) {
            container.appendChild(fileItem);
            return fileItem;
        }

        // 如果路径包含斜杠，将文件添加到父文件夹中
        if (path.includes('/')) {
            const pathParts = path.split('/');
            const fileName = pathParts.pop();
            const parentPath = pathParts.join('/');

            // 递归查找或创建父文件夹
            this.ensureParentFoldersExist(parentPath);

            const parentFolder = this.fileTree.querySelector(`[data-path="${parentPath}"]`);
            if (parentFolder) {
                const folderContent = parentFolder.nextElementSibling;
                if (folderContent) {
                    folderContent.appendChild(fileItem);
                    return fileItem;
                }
            }
        }

        // 默认添加到根目录
        this.fileTree.appendChild(fileItem);

        // 创建文件后保存到 IndexedDB
        this.saveToIndexedDB();

        return fileItem;
    }

    createFolderElement(path, container = null) {
        const folderName = path.split('/').pop();

        // 检查文件夹是否已在 UI 中存在
        const existingFolder = this.fileTree.querySelector(`[data-path="${path}"]`);
        if (existingFolder) {
            return existingFolder.closest('.folder');
        }

        const folderContainer = Utils.createElement('div', { className: 'folder' }, [
            Utils.createElement('div', {
                className: 'file-tree-item',
                'data-path': path,
                draggable: 'true'
            }, [
                Utils.createElement('i', { className: 'fas fa-folder folder-icon' }),
                Utils.createElement('span', { className: 'item-name' }, [folderName])
            ]),
            Utils.createElement('div', {
                className: 'folder-content',
                style: 'display: none;',
                'data-parent': path
            })
        ]);

        // 将文件夹添加到文件树的正确位置
        if (container) {
            container.appendChild(folderContainer);
            return folderContainer;
        }

        // 如果路径包含斜杠，将文件夹添加到父文件夹中
        if (path.includes('/')) {
            const pathParts = path.split('/');
            const folderName = pathParts.pop();
            const parentPath = pathParts.join('/');

            // 递归查找或创建父文件夹
            this.ensureParentFoldersExist(parentPath);

            const parentFolder = this.fileTree.querySelector(`[data-path="${parentPath}"]`);
            if (parentFolder) {
                const folderContent = parentFolder.nextElementSibling;
                if (folderContent) {
                    folderContent.appendChild(folderContainer);
                    return folderContainer;
                }
            }
        }

        // 默认添加到根目录
        this.fileTree.appendChild(folderContainer);

        // 创建文件夹后保存到 IndexedDB
        this.saveToIndexedDB();

        return folderContainer;
    }

    // 辅助方法，确保所有父文件夹都存在
    ensureParentFoldersExist(path) {
        if (!path || path === '') return;

        const pathParts = path.split('/');
        let currentPath = '';

        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            // 检查文件夹是否已存在
            const existingFolder = this.fileTree.querySelector(`[data-path="${currentPath}"]`);
            if (!existingFolder) {
                // 如果不存在，创建它
                if (i === 0) {
                    // 根目录级别文件夹
                    this.createFolderElement(currentPath, this.fileTree);
                } else {
                    // 嵌套文件夹
                    const parentPath = pathParts.slice(0, i).join('/');
                    const parentFolder = this.fileTree.querySelector(`[data-path="${parentPath}"]`);
                    if (parentFolder) {
                        const folderContent = parentFolder.nextElementSibling;
                        this.createFolderElement(currentPath, folderContent);
                    }
                }
            }
        }
    }

    openFile(path) {
        if (!this.files.has(path)) {
            console.error(`文件未找到: ${path}`);
            return;
        }

        const content = this.files.get(path);
        window.editor.openFile(path, content);

        // 更新当前路径显示
        this.updateCurrentPathDisplay(path);

        // 高亮显示文件树中选中的文件
        this.highlightSelectedFile(path);

        this.updateCurrentPathDisplay(path);
        this.highlightSelectedFile(path);
        this.selectedFile = path;

    }

    updateCurrentPathDisplay(path) {
        if (path && this.currentPathElement) {
            this.currentPathElement.textContent = path;
            this.currentPathElement.title = path;
        } else if (this.currentPathElement) {
            this.currentPathElement.textContent = '';
            this.currentPathElement.title = '';
        }
    }

    setProjectName(name) {
        if (name) {
            this.projectName = name;
            if (this.projectNameElement) {
                this.projectNameElement.textContent = name;
                this.projectNameElement.title = name;
            }
        }
    }

    showContextMenu(event, item) {
        const contextMenu = document.querySelector('.context-menu');
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.display = 'block';

        const path = item.dataset.path;
        contextMenu.dataset.targetPath = path;

        // 如果是文件夹，设置为当前路径
        const isFolder = item.closest('.folder');
        if (isFolder) {
            this.currentPath = path;
        } else {
            // 如果是文件，设置父文件夹为当前路径
            const pathParts = path.split('/');
            pathParts.pop();
            this.currentPath = pathParts.join('/');
        }

        // 点击外部隐藏菜单
        const hideMenu = () => {
            contextMenu.style.display = 'none';
            document.removeEventListener('click', hideMenu);
        };
        setTimeout(() => document.addEventListener('click', hideMenu), 0);
    }

    /**
     * 显示进度条
     * @param {string} message - 进度条消息
     * @returns {Object} - 进度条控制对象
     */
    showProgressBar(message) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.textContent = message;
        document.body.appendChild(progressBar);

        // 模拟进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => progressBar.remove(), 500);
            }
        }, 100);
    }


    pasteItem(clipboard, targetPath, isSourceFolder) {
        if (!clipboard || !clipboard.path) return;

        const sourcePath = clipboard.path;
        const sourceItem = this.fileTree.querySelector(`[data-path="${sourcePath}"]`);
        if (!sourceItem) return;

        const sourceName = sourcePath.split('/').pop();

        // 确定目标容器
        let targetContainer;
        const targetItem = targetPath ? this.fileTree.querySelector(`[data-path="${targetPath}"]`) : null;

        if (targetItem && targetItem.closest('.folder')) {
            // 目标是文件夹，粘贴到其中
            targetContainer = targetItem.nextElementSibling;

            // 确保文件夹已打开
            if (targetContainer.style.display === 'none') {
                this.toggleFolder(targetItem);
            }
        } else if (targetItem) {
            // 目标是文件，粘贴到其父文件夹
            const pathParts = targetPath.split('/');
            pathParts.pop();
            const parentPath = pathParts.join('/');
            targetContainer = parentPath ? this.fileTree.querySelector(`[data-path="${parentPath}"]`) : this.fileTree;
        } else {
            // 目标为空或根目录
            targetContainer = this.fileTree;
        }

        // 创建新路径
        let newPath;
        if (targetItem && targetItem.closest('.folder')) {
            newPath = `${targetPath}/${sourceName}`;
        } else if (targetPath) {
            const pathParts = targetPath.split('/');
            pathParts.pop();
            const parentPath = pathParts.join('/');
            newPath = parentPath ? `${parentPath}/${sourceName}` : sourceName;
        } else {
            newPath = sourceName;
        }

        // 检查名称冲突并生成唯一名称
        let uniqueName = sourceName;
        let uniquePath = newPath;
        let counter = 1;

        // 只有在复制操作或移动路径不同时检查冲突
        if (clipboard.action === 'copy' || (clipboard.action === 'cut' && sourcePath !== newPath)) {
            while (this.fileTree.querySelector(`[data-path="${uniquePath}"]`)) {
                const nameParts = sourceName.split('.');
                if (nameParts.length > 1) {
                    // 文件有扩展名
                    uniqueName = `${nameParts.slice(0, -1).join('.')}_${counter}.${nameParts.slice(-1)}`;
                } else {
                    // 文件夹或无扩展名文件
                    uniqueName = `${sourceName}_${counter}`;
                }

                if (targetItem && targetItem.closest('.folder')) {
                    uniquePath = `${targetPath}/${uniqueName}`;
                } else if (targetPath) {
                    const pathParts = targetPath.split('/');
                    pathParts.pop();
                    const parentPath = pathParts.join('/');
                    uniquePath = parentPath ? `${parentPath}/${uniqueName}` : uniqueName;
                } else {
                    uniquePath = uniqueName;
                }

                counter++;
            }
        }

        // 如果这是移动操作且路径相同，不做任何操作
        if (clipboard.action === 'cut' && sourcePath === newPath) {
            return;
        }

        // 根据源项目类型创建新项目
        if (isSourceFolder) {
            this.createFolderElement(uniquePath, targetContainer);

            // 移动所有文件夹内容
            const folderPrefix = sourcePath + '/';
            const filesToMove = Array.from(this.files.keys())
                .filter(filePath => filePath.startsWith(folderPrefix));

            filesToMove.forEach(filePath => {
                const relativePath = filePath.substring(folderPrefix.length);
                const newFilePath = `${uniquePath}/${relativePath}`;
                this.files.set(newFilePath, this.files.get(filePath));

                // 如果这是当前选中的文件，更新引用
                if (this.selectedFile === filePath) {
                    this.selectedFile = newFilePath;
                    this.highlightSelectedFile(newFilePath);

                    // 更新打开的标签页
                    const event = new CustomEvent('file-renamed', {
                        detail: { oldPath: filePath, newPath: newFilePath }
                    });
                    window.dispatchEvent(event);
                }

                // 删除原始文件
                this.files.delete(filePath);
            });

            // 从 UI 中移除原始文件夹
            const originalFolder = this.fileTree.querySelector(`[data-path="${sourcePath}"]`);
            if (originalFolder) {
                const folderContent = originalFolder.nextElementSibling;
                if (folderContent && folderContent.classList.contains('folder-content')) {
                    folderContent.remove();
                }
                originalFolder.remove();
            }
        } else {
            // 移动文件内容
            const content = this.files.get(sourcePath) || '';
            this.files.set(uniquePath, content);
            this.createFileElement(uniquePath, targetContainer);

            // 如果这是当前选中的文件，更新引用
            if (this.selectedFile === sourcePath) {
                this.selectedFile = uniquePath;
                this.highlightSelectedFile(uniquePath);

                // 更新打开的标签页
                const event = new CustomEvent('file-renamed', {
                    detail: { oldPath: sourcePath, newPath: uniquePath }
                });
                window.dispatchEvent(event);
            }

            // 删除原始文件
            this.files.delete(sourcePath);
        }

        // 将更改保存到 IndexedDB
        this.saveToIndexedDB();

        // 重新渲染文件树以确保所有内容正确显示
        this.refreshFileExplorer();
    }
    handleDragStart(event) {
        const item = event.target.closest('.file-tree-item');
        if (!item) return;

        this.draggedItem = item;
        event.dataTransfer.setData('text/plain', item.dataset.path);
        event.dataTransfer.effectAllowed = 'move';

        // 添加拖动样式
        item.classList.add('dragging');
    }

    handleDragOver(event) {
        event.preventDefault();

        const target = event.target.closest('.file-tree-item') || event.target.closest('.folder-content');
        if (!target || target === this.draggedItem) return;

        // 不允许将文件拖放到自身或其子元素
        if (this.draggedItem && target.contains(this.draggedItem)) {
            return;
        }

        event.dataTransfer.dropEffect = 'move';

        // 添加放置目标指示器
        if (target.classList.contains('file-tree-item') && target !== this.draggedItem) {
            // 只有文件夹可以作为放置目标
            const isFolder = target.querySelector('.folder-icon');
            if (isFolder) {
                target.classList.add('drop-target');
            }
        } else if (target.classList.contains('folder-content')) {
            target.classList.add('drop-target-container');
        }
    }

    handleDragLeave(event) {
        const target = event.target.closest('.file-tree-item') || event.target.closest('.folder-content');
        if (!target) return;

        // 移除放置目标指示器
        target.classList.remove('drop-target');
        target.classList.remove('drop-target-container');
    }

    handleDrop(event) {
        event.preventDefault();

        const target = event.target.closest('.file-tree-item') || event.target.closest('.folder-content');
        if (!target || !this.draggedItem) return;

        // 移除放置目标指示器
        target.classList.remove('drop-target');
        target.classList.remove('drop-target-container');

        const sourcePath = this.draggedItem.dataset.path;
        let targetPath;

        if (target.classList.contains('file-tree-item')) {
            const isFolder = target.querySelector('.folder-icon');
            targetPath = isFolder ? target.dataset.path : target.parentElement.dataset.parent || '';
        } else {
            targetPath = target.dataset.parent || '';
        }

        // 检查拖动的项目是文件还是文件夹
        const isSourceFolder = this.draggedItem.querySelector('.folder-icon') !== null;

        if (sourcePath && targetPath) {
            const clipboard = { action: 'cut', path: sourcePath };
            this.pasteItem(clipboard, targetPath, isSourceFolder);
        }
    }

    handleDragEnd(event) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
        }

        // 移除任何剩余的放置目标指示器
        document.querySelectorAll('.drop-target, .drop-target-container').forEach(el => {
            el.classList.remove('drop-target');
            el.classList.remove('drop-target-container');
        });
    }

    refreshFileExplorer() {
        // 记住当前选中的文件
        const selectedFile = this.selectedFile;

        this.fileTree.innerHTML = '';

        // 按路径排序文件
        const sortedFiles = Array.from(this.files.keys()).sort();

        // 按文件夹分组
        const folderStructure = {};

        sortedFiles.forEach(path => {
            const pathParts = path.split('/');
            let currentLevel = folderStructure;

            // 创建文件夹结构
            for (let i = 0; i < pathParts.length - 1; i++) {
                const folderName = pathParts[i];
                if (!currentLevel[folderName]) {
                    currentLevel[folderName] = {};
                }
                currentLevel = currentLevel[folderName];
            }

            // 将文件添加到结构中
            const fileName = pathParts[pathParts.length - 1];
            currentLevel[fileName] = null; // null 表示它是一个文件
        });

        // 渲染文件树
        this.renderFileTree(folderStructure, '');

        // 展开之前展开的文件夹
        const expandedFolders = document.querySelectorAll('.folder-content[style="display: block;"]');
        expandedFolders.forEach(folder => {
            const parentPath = folder.dataset.parent;
            if (parentPath) {
                const folderItem = this.fileTree.querySelector(`[data-path="${parentPath}"]`);
                if (folderItem) {
                    this.toggleFolder(folderItem);
                }
            }
        });

        // 恢复当前选中的文件高亮显示
        if (selectedFile) {
            this.highlightSelectedFile(selectedFile);
        }

        // 显示通知
        if (window.app) {
            window.app.showNotification('文件管理器已初始化');
        }
    }

    renderFileTree(structure, parentPath) {
        // 对条目进行排序：文件夹在前，文件在后，两者都按名称排序
        const entries = Object.entries(structure);
        entries.sort((a, b) => {
            const aIsFolder = a[1] !== null;
            const bIsFolder = b[1] !== null;

            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a[0].localeCompare(b[0]);
        });

        entries.forEach(([name, children]) => {
            const path = parentPath ? `${parentPath}/${name}` : name;

            if (children === null) {
                // 它是一个文件
                this.createFileElement(path);
            } else {
                // 它是一个文件夹
                const folderElement = this.createFolderElement(path);
                const folderContent = folderElement.querySelector('.folder-content') ||
                    folderElement.nextElementSibling;

                if (folderContent) {
                    // 递归渲染子元素
                    this.renderFileTree(children, path);
                }
            }
        });
    }

    // 高亮显示文件树中选中的文件
    highlightSelectedFile(path) {
        // 移除之前选中文件的高亮显示
        const selectedItems = this.fileTree.querySelectorAll('.file-tree-item.selected');
        selectedItems.forEach(item => {
            item.classList.remove('selected');
        });

        // 为新选中文件添加高亮显示
        const fileItem = this.fileTree.querySelector(`[data-path="${path}"]`);
        if (fileItem) {
            fileItem.classList.add('selected');

            // 确保父文件夹已展开
            this.expandParentFolders(path);
        }
    }

    // 展开文件的父文件夹
    expandParentFolders(path) {
        if (!path.includes('/')) return;

        const pathParts = path.split('/');
        pathParts.pop(); // 移除文件名

        let currentPath = '';
        for (const part of pathParts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const folderItem = this.fileTree.querySelector(`[data-path="${currentPath}"]`);

            if (folderItem) {
                const folderContent = folderItem.nextElementSibling;
                if (folderContent && folderContent.style.display === 'none') {
                    this.toggleFolder(folderItem);
                }
            }
        }
    }
    async getUniquePath(originalPath) {
        let newPath = originalPath;
        let counter = 1;

        while (this.files.has(newPath) ||
            this.fileTree.querySelector(`[data-path="${newPath}"]`)) {
            const pathParts = originalPath.split('/');
            const nameParts = pathParts.pop().split('.');

            // 处理带扩展名的文件
            if (nameParts.length > 1 && !this.clipboard.isFolder) {
                const ext = nameParts.pop();
                newPath = [
                    ...pathParts,
                    `${nameParts.join('.')} (${counter++}).${ext}`
                ].join('/');
            } else {
                newPath = [
                    ...pathParts,
                    `${nameParts.join('.')} (${counter++})`
                ].join('/');
            }
        }
        return newPath;
    }

    copyPathToClipboard(path) {
        navigator.clipboard.writeText(path)
            .then(() => {
                console.log('路径已复制:', path);
                if (window.app) {
                    window.app.showNotification(`已复制路径: ${path}`);
                }
            })
            .catch(err => {
                console.error('复制路径失败:', err);
                prompt('请手动复制路径:', path);
            });
    }

    deleteItem(path) {
        if (confirm(`确定要删除 ${path} 吗？`)) {
            // 删除文件
            if (this.files.has(path)) {
                this.files.delete(path);
            }
            // 删除文件夹
            else {
                Array.from(this.files.keys())
                    .filter(p => p.startsWith(path + '/'))
                    .forEach(p => this.files.delete(p));
            }

            // 从DOM移除
            const element = this.fileTree.querySelector(`[data-path="${path}"]`);
            if (element) {
                if (element.closest('.folder')) {
                    element.parentElement.remove();
                } else {
                    element.remove();
                }
            }

            this.saveToIndexedDB();
            this.refreshFileExplorer();
        }
    }

    isFolder(path) {
        const element = this.fileTree.querySelector(`[data-path="${path}"]`);
        return element && !!element.querySelector('.folder-icon');
    }
}

// 初始化 FileManager
window.fileManager = new FileManager();
