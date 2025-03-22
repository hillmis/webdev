class Preview {
    constructor() {
        this.previewFrame = document.getElementById('preview-frame');
        this.deviceSelector = document.querySelector('.device-selector');
        this.previewContainer = document.querySelector('.preview-container');
        this.isLandscape = false;

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
            });
        } else {
            this.initializeEventListeners();
            this.setupContainerStyles();
        }
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

                // 处理脚本和资源
                this.processHtmlForPreview(htmlDoc);

                // 使用document.write写入处理后的内容
                const newDoc = previewFrame.contentDocument;
                newDoc.open();
                newDoc.write(htmlDoc.documentElement.outerHTML);
                newDoc.close();

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
        const previewContainer = this.previewContainer;
        if (!document.fullscreenElement) {
            previewContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }


}


// 初始化预览
window.preview = new Preview();