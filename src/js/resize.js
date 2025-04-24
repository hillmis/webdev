document.addEventListener('DOMContentLoaded', () => {
    function createResizer(resizerElement, type) {
        let isResizing = false;
        let lastPosition = 0;
        let panelA, panelB;
        let container;
        let animationFrame;
        let iframe;

        // 初始化配置
        const config = {
            horizontal: {
                minSize: 200,
                getContainer: () => document.querySelector('.main-content'),
                styleProp: 'width',
                cursor: 'ew-resize'
            },
            vertical: {
                minSize: 50,
                maxSize: () => window.innerHeight * 0.8,
                styleProp: 'height',
                cursor: 'row-resize'
            }
        };

        // 初始化面板和参数
        if (resizerElement.id === 'file-editor-resizer') {
            panelA = document.querySelector('.file-manager-panel');
            panelB = document.querySelector('.editor-panel');
            container = config.horizontal.getContainer();
            type = 'horizontal';
        } else if (resizerElement.id === 'editor-preview-resizer') {
            panelA = document.querySelector('.editor-panel');
            panelB = document.querySelector('.preview-panel');
            container = config.horizontal.getContainer();
            type = 'horizontal';
            iframe = document.getElementById('preview-frame');
        } else if (resizerElement.classList.contains('top')) {
            panelA = document.querySelector('.bottom-panel');
            type = 'vertical';
        }

        // 通用事件处理器
        const startResizing = (e) => {
            isResizing = true;
            lastPosition = type === 'horizontal' ? e.clientX : e.clientY;
            document.body.style.cursor = config[type].cursor;
            document.body.style.userSelect = 'none';

            // 初始化尺寸记录
            panelA.initialSize = type === 'horizontal'
                ? panelA.offsetWidth
                : panelA.offsetHeight;

            if (type === 'horizontal') {
                panelB.initialSize = panelB.offsetWidth;
                // 禁用iframe交互
                if (iframe) {
                    iframe.style.pointerEvents = 'none';
                    iframe.classList.add('resizing');
                }
            }

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', stopResizing);
        };

        const handleMove = (e) => {
            if (!isResizing) return;

            // 使用requestAnimationFrame优化性能
            if (animationFrame) cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(() => {
                const currentPosition = type === 'horizontal'
                    ? e.clientX
                    : e.clientY;
                const delta = currentPosition - lastPosition;

                if (type === 'horizontal') {
                    const newSizeA = panelA.initialSize + delta;
                    const newSizeB = panelB.initialSize - delta;

                    // 边界检查
                    if (newSizeA >= config.horizontal.minSize &&
                        newSizeB >= config.horizontal.minSize) {
                        panelA.style.width = `${newSizeA}px`;
                        panelB.style.width = `${newSizeB}px`;
                    }
                } else {
                    const newSize = panelA.initialSize +
                        (type === 'horizontal' ? delta : -delta);

                    panelA.style.height = `${Math.min(
                        Math.max(newSize, config.vertical.minSize),
                        config.vertical.maxSize()
                    )}px`;
                }
            });
        };

        const stopResizing = () => {
            isResizing = false;
            cancelAnimationFrame(animationFrame);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // 恢复iframe交互
            if (iframe) {
                iframe.style.pointerEvents = 'auto';
                iframe.classList.remove('resizing');
                // 延迟触发确保尺寸更新
                setTimeout(() => {
                    iframe.contentWindow.postMessage({
                        type: 'resize',
                        width: panelB.offsetWidth,
                        height: panelB.offsetHeight
                    }, '*');
                }, 50);
            }

            window.dispatchEvent(new Event('resize'));
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', stopResizing);
        };

        resizerElement.addEventListener('mousedown', startResizing);
    }

    // 初始化所有调整轴
    document.querySelectorAll('.resizer').forEach(resizer => {
        const type = resizer.classList.contains('top')
            ? 'vertical'
            : 'horizontal';
        createResizer(resizer, type);
    });
});

// 在iframe内部页面中添加
window.addEventListener('message', (e) => {
    if (e.data.type === 'resize') {
        // 使用requestAnimationFrame防止布局抖动
        requestAnimationFrame(() => {
            document.body.style.width = `${e.data.width}px`;
            document.body.style.height = `${e.data.height}px`;
            // 触发自定义resize事件
            window.dispatchEvent(new CustomEvent('iframe-resize'));
        });
    }
});