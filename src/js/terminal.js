class Terminal {
    constructor() {
        this.output = document.querySelector('.terminal-output');
        this.input = document.querySelector('.terminal-input');
        this.history = [];
        this.historyIndex = -1;

        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
                this.showWelcomeMessage();
            });
        } else {
            this.initializeEventListeners();
            this.showWelcomeMessage();
        }
    }

    initializeEventListeners() {
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.executeCommand();
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.navigateHistory(-1);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.navigateHistory(1);
            }
        });
    }

    showWelcomeMessage() {
        const messages = [
            'Welcome to Web Dev Terminal',
            '输入 "help" 查看可以使用的命令',
            ''
        ];
        messages.forEach(msg => this.appendOutput(msg));
    }

    executeCommand() {
        const command = this.input.value.trim();
        if (!command) return;

        // Add command to history
        this.history.push(command);
        this.historyIndex = this.history.length;

        // Display command
        this.appendOutput(`$ ${command}`);

        // Process command
        this.processCommand(command);

        // Clear input
        this.input.value = '';
    }

    processCommand(command) {
        const [cmd, ...args] = command.split(' ');

        switch (cmd.toLowerCase()) {
            case 'clear':
                this.clearOutput();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'ls':
                this.listFiles();
                break;
            case 'pwd':
                this.showCurrentDirectory();
                break;
            case 'echo':
                this.appendOutput(args.join(' '));
                break;
            case 'date':
                this.showDate();
                break;
            case 'mkdir':
                if (args.length > 0) {
                    this.createDirectory(args[0]);
                } else {
                    this.appendOutput('Error: mkdir requires a directory name');
                }
                break;
            case 'touch':
                if (args.length > 0) {
                    this.createFile(args[0]);
                } else {
                    this.appendOutput('Error: touch requires a file name');
                }
                break;
            default:
                this.appendOutput(`Command not found: ${cmd}`);
        }
    }

    appendOutput(text) {
        const line = document.createElement('div');
        line.textContent = text;
        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    }

    clearOutput() {
        this.output.innerHTML = '';
    }

    showHelp() {
        const helpText = [
            'Available commands:',
            '  clear  - Clear terminal output',
            '  help   - Show this help message',
            '  ls     - List files in current directory',
            '  pwd    - Show current working directory',
            '  echo   - Display a message',
            '  date   - Show current date and time',
            '  mkdir  - Create a new directory',
            '  touch  - Create a new file'
        ];
        helpText.forEach(line => this.appendOutput(line));
    }

    listFiles() {
        const files = Array.from(window.fileManager.files.keys());
        if (files.length === 0) {
            this.appendOutput('No files in workspace');
        } else {
            files.forEach(file => this.appendOutput(file));
        }
    }

    showCurrentDirectory() {
        this.appendOutput(window.fileManager.currentPath || '/');
    }

    showDate() {
        this.appendOutput(new Date().toString());
    }

    createDirectory(name) {
        const path = window.fileManager.currentPath ?
            `${window.fileManager.currentPath}/${name}` : name;

        try {
            window.fileManager.createFolderElement(path);
            this.appendOutput(`Directory created: ${name}`);
        } catch (error) {
            this.appendOutput(`Error creating directory: ${error.message}`);
        }
    }

    createFile(name) {
        const path = window.fileManager.currentPath ?
            `${window.fileManager.currentPath}/${name}` : name;

        try {
            window.fileManager.files.set(path, '');
            window.fileManager.createFileElement(path);
            this.appendOutput(`File created: ${name}`);
        } catch (error) {
            this.appendOutput(`Error creating file: ${error.message}`);
        }
    }

    navigateHistory(direction) {
        if (this.history.length === 0) return;

        this.historyIndex += direction;

        if (this.historyIndex >= this.history.length) {
            this.historyIndex = this.history.length;
            this.input.value = '';
        } else if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else {
            this.input.value = this.history[this.historyIndex];
        }
    }
}

// Initialize Terminal
window.terminal = new Terminal();
