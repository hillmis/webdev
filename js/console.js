class Console {
    constructor() {
        this.output = document.querySelector('.console-output');
        this.clearButton = document.querySelector('[title="清除控制台"]');

        // 等待 DOM 完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
                this.interceptConsole();
            });
        } else {
            this.initializeEventListeners();
            this.interceptConsole();
        }
    }

    initializeEventListeners() {
        this.clearButton.addEventListener('click', () => {
            this.clearOutput();
        });
    }

    interceptConsole() {
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        // 拦截 console 方法
        console.log = (...args) => {
            this.log('log', ...args);
            originalConsole.log.apply(console, args);
        };

        console.info = (...args) => {
            this.log('info', ...args);
            originalConsole.info.apply(console, args);
        };

        console.warn = (...args) => {
            this.log('warn', ...args);
            originalConsole.warn.apply(console, args);
        };

        console.error = (...args) => {
            this.log('error', ...args);
            originalConsole.error.apply(console, args);
        };

        // 拦截未捕获的错误
        window.addEventListener('error', (event) => {
            this.log('error', event.error.stack || event.error.message);
        });

        // 拦截未处理的 promise 拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.log('error', '未处理的 Promise 拒绝:', event.reason);
        });

        // 拦截预览框架的 console
        window.addEventListener('content-change', () => {
            setTimeout(() => {
                try {
                    const previewFrame = document.getElementById('preview-frame');
                    if (previewFrame && previewFrame.contentWindow) {
                        this.interceptPreviewConsole(previewFrame.contentWindow);
                    }
                } catch (e) {
                    // 忽略跨域错误
                }
            }, 500);
        });
    }

    interceptPreviewConsole(previewWindow) {
        if (!previewWindow.console || previewWindow._consoleIntercepted) return;

        const originalConsole = {
            log: previewWindow.console.log,
            info: previewWindow.console.info,
            warn: previewWindow.console.warn,
            error: previewWindow.console.error
        };

        previewWindow.console.log = (...args) => {
            this.log('log', '[预览]', ...args);
            originalConsole.log.apply(previewWindow.console, args);
        };

        previewWindow.console.info = (...args) => {
            this.log('info', '[预览]', ...args);
            originalConsole.info.apply(previewWindow.console, args);
        };

        previewWindow.console.warn = (...args) => {
            this.log('warn', '[预览]', ...args);
            originalConsole.warn.apply(previewWindow.console, args);
        };

        previewWindow.console.error = (...args) => {
            this.log('error', '[预览]', ...args);
            originalConsole.error.apply(previewWindow.console, args);
        };

        previewWindow._consoleIntercepted = true;
    }

    log(type, ...args) {
        const line = document.createElement('div');
        line.className = `console-line console-${type}`;

        const timestamp = document.createElement('span');
        timestamp.className = 'console-timestamp';
        timestamp.textContent = this.getTimestamp();
        line.appendChild(timestamp);

        const typeIndicator = document.createElement('span');
        typeIndicator.className = `console-type console-type-${type}`;
        typeIndicator.textContent = type.toUpperCase();
        line.appendChild(typeIndicator);

        const content = document.createElement('span');
        content.className = 'console-content';
        content.appendChild(this.formatContent(args));
        line.appendChild(content);

        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    }

    formatContent(args) {
        const container = document.createElement('span');

        args.forEach((arg, index) => {
            if (index > 0) {
                container.appendChild(document.createTextNode(' '));
            }

            if (arg === null) {
                const span = document.createElement('span');
                span.className = 'console-null';
                span.textContent = 'null';
                container.appendChild(span);
            } else if (arg === undefined) {
                const span = document.createElement('span');
                span.className = 'console-undefined';
                span.textContent = 'undefined';
                container.appendChild(span);
            } else if (typeof arg === 'object') {
                const span = document.createElement('span');
                span.className = 'console-object';
                try {
                    span.textContent = JSON.stringify(arg, null, 2);
                } catch (e) {
                    span.textContent = String(arg);
                }
                container.appendChild(span);
            } else {
                container.appendChild(document.createTextNode(String(arg)));
            }
        });

        return container;
    }

    getTimestamp() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    clearOutput() {
        this.output.innerHTML = '';
    }
}

// 初始化控制台
window.consoleManager = new Console();