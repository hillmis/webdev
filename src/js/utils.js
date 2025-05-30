const Utils = {
    // 生成唯一 ID
    generateId: () => {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    // 创建具有属性的 DOM 元素
    createElement: (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        return element;
    },

    // 事件委托助手
    delegate: (element, eventName, selector, handler) => {
        element.addEventListener(eventName, (event) => {
            const target = event.target.closest(selector);
            if (target && element.contains(target)) {
                handler.call(target, event);
            }
        });
    },

    // 显示/隐藏元素
    toggleVisibility: (element, show) => {
        element.style.display = show ? 'block' : 'none';
    },

    // 格式化文件大小
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 从当前项目创建 ZIP 文件
    createZipFile: async (files) => {
        // 如果尚未加载 JSZip 库，则动态加载
        if (typeof JSZip === 'undefined') {
            await Utils.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }

        const zip = new JSZip();

        // 将所有文件添加到 ZIP 中
        for (const [path, content] of files.entries()) {
            zip.file(path, content);
        }

        // 生成 ZIP 文件
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        return zipBlob;
    },

    // 从 ZIP 文件中提取文件
    extractZipFile: async (zipFile) => {
        // 如果尚未加载 JSZip 库，则动态加载
        if (typeof JSZip === 'undefined') {
            await Utils.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }

        const zip = new JSZip();
        const files = new Map();

        try {
            // 加载 ZIP 文件
            const zipContent = await zip.loadAsync(zipFile);

            // 提取所有文件
            const extractPromises = [];

            zipContent.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    const promise = zipEntry.async('string').then(content => {
                        files.set(relativePath, content);
                    });
                    extractPromises.push(promise);
                }
            });

            await Promise.all(extractPromises);
            return files;
        } catch (error) {
            console.error('Error extracting ZIP file:', error);
            throw error;
        }
    },

    // 动态加载脚本
    loadScript: (url) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // 下载文件
    downloadFile: (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }


};

// 导出 Utils 对象
window.Utils = Utils;