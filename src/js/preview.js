class Preview {
    constructor() {
        this.previewFrame = document.getElementById('preview-frame');
        this.deviceSelector = document.querySelector('.device-selector');
        this.previewContainer = document.querySelector('.preview-container');
        this.previewPathInput = document.querySelector('.preview-path');
        this.previewPanle = document.querySelector('.preview-panel');
        this.custom404Path = '/404.html'; // 根据实际路径调整
        this.isLandscape = false;
        this.currentFilePath = null; // 当前文件路径跟踪
        this.currentExternalUrl = null; // 保存当前外部URL
        this.isExternalUrl = false;     // 标识当前是否为外部URL


        // 更新为真实设备尺寸（单位：像素）
        this.deviceDimensions = {
            mobile: { width: 375, height: 812 },   // iPhone 13 Pro
            tablet: { width: 768, height: 1024 },   // iPad 9.7"
            desktop: { width: 1440, height: 900 }  // 典型桌面分辨率
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
                this.setupContainerStyles();
                this.initDefaultPreview();
            });
        } else {
            this.initializeEventListeners();
            this.setupContainerStyles();
            this.initDefaultPreview();
        }

    }
    initDefaultPreview() {
        // 设置默认 URL
        const defaultUrl = 'https://home.liu13.fun/';
        this.previewPathInput.value = defaultUrl;
        this.handleUrlInput();
    }

    setupContainerStyles() {
        // 确保容器始终居中
        this.previewContainer.style.display = 'flex';
        this.previewContainer.style.justifyContent = 'center';
        this.previewContainer.style.alignItems = 'center';
        this.previewContainer.style.overflow = 'auto';
        this.previewContainer.style.width = '100%';
        this.previewContainer.style.height = '100%';
    }

    initializeEventListeners() {
        // 监听内容变化
        window.addEventListener('content-change', (event) => {
            this.updatePreview(event.detail.content);
        });

        // 设备选择器变化
        this.deviceSelector.addEventListener('change', () => {
            this.updateDeviceView();
        });

        // 刷新按钮点击
        document.querySelector('[title="刷新预览"]').addEventListener('click', () => {
            this.updatePreview();
        });
        // 监听文件选择事件（假设文件管理器触发这个事件）
        document.addEventListener('file-selected', (event) => {
            this.handleFileSelection(event.detail);
        });
        // 处理窗口大小调整以适应响应式模式
        window.addEventListener('resize', () => {
            if (this.deviceSelector.value === 'responsive') {
                this.updateDeviceView();
            }
        });
        document.querySelector('[title="切换横竖屏"]').addEventListener('click', () => {
            this.toggleOrientation();
        });

        document.querySelector('[title="全屏预览"]').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        // 地址栏输入事件
        this.previewPathInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleUrlInput();
                // 防止换行符被添加到输入框中
                e.preventDefault();
            }
        });

        // 监听输入框失去焦点事件（用户关闭键盘时触发）
        this.previewPathInput.addEventListener('blur', () => {
            this.handleUrlInput();
        });

        // 地址栏聚焦/失焦事件
        this.previewPathInput.addEventListener('focus', () => {
            this.previewPathInput.select();
        });
    }
    async handleFileSelection(fileInfo) {
        // 更新路径显示
        this.previewPathInput.value = fileInfo.path;
        this.currentFilePath = fileInfo.path;

        // 根据文件类型处理
        if (this.isPreviewableFile(fileInfo.path)) {
            // 标记为本地内容

            // 如果文件已打开在编辑器获取内容
            if (fileInfo.content) {
                this.updatePreview(fileInfo.content);
            }
            // 如果未打开则读取文件
            else {
                try {
                    const content = await this.readLocalFile(fileInfo.path);
                    this.updatePreview(content);
                } catch (error) {
                    console.error('文件读取失败:', error);
                    this.showUrlError('无法读取本地文件');
                }
            }
        }
    }

    // 判断是否可预览文件（扩展名判断）
    isPreviewableFile(path) {
        const ext = path.split('.').pop().toLowerCase();
        return ['html', 'htm', 'xhtml', 'svg'].includes(ext);
    }
    validateUrl(url) {
        const protocolRegex = /^(https?|ftp):\/\//i;
        const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/;
        const localPathRegex = /^(?:[a-z]:\\|\\\\)/i;
        const unixPathRegex = /^\//;

        return protocolRegex.test(url) ||
            domainRegex.test(url) ||
            ipRegex.test(url) ||
            localPathRegex.test(url) ||
            unixPathRegex.test(url);
    }

    normalizeUrl(url) {
        // 处理Windows路径
        if (url.match(/^[a-z]:\\/i)) {
            return 'file:///' + url.replace(/\\/g, '/');
        }
        // 处理Unix路径
        if (url.startsWith('/')) {
            return 'file://' + url;
        }
        // 补全协议
        if (!url.match(/^(https?|ftp):\/\//i)) {
            if (domainRegex.test(url) || ipRegex.test(url)) {
                return 'http://' + url;
            }
        }
        return url;
    }

    handleUrlInput() {
        const url = this.previewPathInput.value.trim();
        if (!this.validateUrl(url)) {
            this.showUrlError('无效的URL格式');
            return;
        }

        try {
            const normalizedUrl = this.normalizeUrl(url);

            // 重置相关状态
            this.isExternalUrl = true;
            this.currentContent = null;

            // 强制刷新机制
            const timestamp = Date.now();
            const finalUrl = normalizedUrl + (normalizedUrl.includes('?') ? `&t=${timestamp}` : `?t=${timestamp}`);

            this.previewFrame.src = finalUrl;
            this.previewPathInput.value = finalUrl;
            this.startLoadingIndicator();
        } catch (error) {
            this.showUrlError('无法加载该网址');
        }
    }

    startLoadingIndicator() {
        this.previewPathInput.classList.add('loading');

        this.previewFrame.onload = () => {
            this.previewPathInput.classList.remove('loading');
            // 添加成功状态指示
            this.previewPathInput.classList.add('success', 'flash');
            setTimeout(() => {
                this.previewPathInput.classList.remove('success', 'flash');
            }, 1000);
        };

        this.previewFrame.onerror = async () => {
            this.previewPathInput.classList.remove('loading');
            try {
                // 加载本地404页面
                const response = await fetch(this.custom404Path);
                const content = await response.text();

                // 保留原始URL供参考
                const errorUrl = this.previewFrame.src;

                // 使用document.write写入404内容
                const iframeDoc = this.previewFrame.contentDocument;
                iframeDoc.open();
                iframeDoc.write(content);
                iframeDoc.close();

                // 在404页面显示错误信息
                const errorElement = iframeDoc.getElementById('error-message');
                if (errorElement) {
                    errorElement.textContent = `无法加载: ${errorUrl}`;
                }
            } catch (error) {
                // 如果连404页面都加载失败
                this.showUrlError('加载失败且无法显示错误页');
            }
        };
    }

    showUrlError(message) {
        this.previewPathInput.placeholder = message;
        this.previewPathInput.value = '';
        this.previewPathInput.classList.add('error');
        setTimeout(() => {
            this.previewPathInput.classList.remove('error');
            this.previewPathInput.placeholder = "输入网址或本地路径";
        }, 2000);
    }
    updatePreview(content) {
        if (content) {
            this.currentContent = content;
        } else {
            content = this.currentContent;
            if (!content) return;
        }

        const previewFrame = this.previewFrame;
        const previewDoc = previewFrame.contentDocument;

        // 先暂停所有媒体元素
        this.stopAllMedia(previewDoc);
        this.updateDeviceView();
        // 彻底重置iframe内容
        previewFrame.srcdoc = ''; // 清空内容
        previewFrame.contentWindow.location.reload(); // 强制重新加载

        setTimeout(() => { // 等待iframe重置完成
            try {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(content, 'text/html');

                // 添加base标签修复相对路径
                this.addBaseTag(htmlDoc);
                // 注入Eruda调试工具
                this.injectEruda(htmlDoc);
                // 处理脚本和资源
                this.processHtmlForPreview(htmlDoc);

                // 使用document.write写入处理后的内容
                const newDoc = previewFrame.contentDocument;
                newDoc.open();
                newDoc.write(htmlDoc.documentElement.outerHTML);
                newDoc.close();
                // 更新路径显示
                const pathInput = document.querySelector('.preview-path');
                if (pathInput) {
                    pathInput.value = previewFrame.contentWindow.location.href || 'about:blank';
                }
                // 重新执行脚本
                this.reloadScripts(newDoc);

                // 处理后续操作
                previewFrame.onload = () => {
                    this.bindDynamicEvents(previewFrame.contentWindow);
                };
            } catch (error) {
                console.error('Error updating preview:', error);
                previewDoc.open();
                previewDoc.write(content);
                previewDoc.close();
            }
        }, 100);
    }

    stopAllMedia(doc) {
        try {
            const medias = doc.querySelectorAll('video, audio');
            medias.forEach(media => {
                media.pause();
                media.currentTime = 0;
            });
        } catch (e) {
            console.log('Error stopping media:', e);
        }
    }

    addBaseTag(htmlDoc) {
        const base = htmlDoc.createElement('base');
        base.href = window.location.origin + window.location.pathname;
        if (!htmlDoc.head) {
            const head = htmlDoc.createElement('head');
            htmlDoc.documentElement.insertBefore(head, htmlDoc.body);
        }
        htmlDoc.head.prepend(base);
    }

    reloadScripts(newDoc) {
        const scripts = newDoc.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = newDoc.createElement('script');
            // 复制所有属性
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            // 处理外部脚本
            if (oldScript.src) {
                newScript.src = oldScript.src + '?t=' + Date.now(); // 防止缓存
            } else {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    bindDynamicEvents(iframeWindow) {
        // 绑定通用事件
        iframeWindow.document.addEventListener('click', this.handleIframeClick);
        // 添加其他需要的事件监听...
    }

    handleIframeClick(e) {
        // 示例：处理iframe内的点击事件
        console.log('Preview element clicked:', e.target);
    }

    processHtmlForPreview(htmlDoc) {
        // 修复相对路径为绝对路径
        const elements = htmlDoc.querySelectorAll('[src],[href]');
        elements.forEach(el => {
            ['src', 'href'].forEach(attr => {
                if (el.hasAttribute(attr)) {
                    const value = el.getAttribute(attr);
                    if (!value.startsWith('http') && !value.startsWith('data:')) {
                        el.setAttribute(attr, new URL(value, window.location.href).href);
                    }
                }
            });
        });

        // 确保脚本可执行
        const scripts = htmlDoc.querySelectorAll('script');
        scripts.forEach(script => {
            if (!script.type) script.type = 'text/javascript';
            // 移除async/defer确保立即执行
            script.removeAttribute('async');
            script.removeAttribute('defer');
        });
    }


    updateDeviceView() {
        const device = this.deviceSelector.value;
        this.previewContainer.className = `preview-container ${device}`;

        // 清除之前的尺寸限制
        this.previewFrame.style.maxWidth = 'none';
        this.previewFrame.style.maxHeight = 'none';

        if (device === 'responsive') {
            this.previewFrame.style.width = '100%';
            this.previewFrame.style.height = '100%';
        } else {
            const dimensions = this.deviceDimensions[device];
            if (dimensions) {
                const [width, height] = this.isLandscape ?
                    [dimensions.height, dimensions.width] :
                    [dimensions.width, dimensions.height];

                // 获取容器的可用尺寸
                const containerRect = this.previewContainer.getBoundingClientRect();
                const containerWidth = containerRect.width;
                const containerHeight = containerRect.height;

                // 计算缩放比例，确保设备的最大边不超过容器的尺寸
                const scaleWidth = containerWidth / width;
                const scaleHeight = containerHeight / height;
                const scale = Math.min(scaleWidth, scaleHeight, 1); // 确保不超过100%

                // 应用缩放后的尺寸
                const scaledWidth = width * scale;
                const scaledHeight = height * scale;

                // 设置设备尺寸
                this.previewFrame.style.width = `${scaledWidth}px`;
                this.previewFrame.style.height = `${scaledHeight}px`;

                // 添加设备边框效果
                this.previewFrame.style.borderRadius = device === 'mobile' ? '30px' : '4px';
                this.previewFrame.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)';
            }
        }

        // 强制重绘
        setTimeout(() => {
            this.centerPreviewFrame();
            this.previewFrame.contentWindow?.dispatchEvent(new Event('resize'));
        }, 50);
    }
    centerPreviewFrame() {
        // 确保在容器内始终居中
        const containerRect = this.previewContainer.getBoundingClientRect();
        const frameRect = this.previewFrame.getBoundingClientRect();

        if (frameRect.width > containerRect.width) {
            this.previewContainer.style.justifyContent = 'flex-start';
        } else {
            this.previewContainer.style.justifyContent = 'center';
        }
    }

    toggleOrientation() {
        this.isLandscape = !this.isLandscape;
        this.updateDeviceView();
    }

    toggleFullscreen() {
        const previewContainer = this.previewPanle;
        if (!document.fullscreenElement) {
            previewContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    // 添加到 Preview 类中的方法
    injectEruda(htmlDoc) {
        // 检查是否已经注入了Eruda
        if (htmlDoc.querySelector('script[src*="eruda.js"]')) return;

        // 创建Eruda脚本标签
        const erudaScript = htmlDoc.createElement('script');
        erudaScript.src = '//cdn.bootcdn.net/ajax/libs/eruda/3.4.1/eruda.js';

        // 创建初始化脚本
        const initScript = htmlDoc.createElement('script');
        initScript.textContent = `
            eruda.init({
                useShadowDom: false,  // 设置为false以便我们可以自定义样式
                autoScale: true,
                defaults: {
                    displaySize: 50,
                    transparency: 0.9,
                    showPanel: true,
                }
            });
            
            // 确保Eruda面板位于最上层
            const erudaContainer = document.querySelector('.eruda-container');
            if (erudaContainer) {
                erudaContainer.style.zIndex = '999999';
                erudaContainer.style.position = 'fixed';
            }
            
            // 监听面板创建事件，确保新创建的面板也能获得最高层级
            eruda.on('create', function() {
                const panels = document.querySelectorAll('.eruda-container');
                panels.forEach(panel => {
                    panel.style.zIndex = '999999';
                    panel.style.position = 'fixed';
                });
            });
        `;

        // 添加到head中
        if (!htmlDoc.head) {
            const head = htmlDoc.createElement('head');
            htmlDoc.documentElement.insertBefore(head, htmlDoc.body);
        }
        htmlDoc.head.appendChild(erudaScript);
        htmlDoc.head.appendChild(initScript);
    }

}


// 初始化预览
window.preview = new Preview();