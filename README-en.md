# WebDev Web Development Tool

**[简体中文](README.md)** | **[English](README-en.md)**

## Introduction

WebDev is an integrated web development environment designed for developers. It combines code editing, file management, real - time preview, and terminal simulation to enhance web development efficiency.

## Features

- **Multi - language code editing**: Supports HTML, CSS, JavaScript, etc., with syntax highlighting and auto - completion.
- **Intuitive file management**: Manages project files via a file tree structure, supporting common file operations and drag - and - drop.
- **Real - time preview**: Has a built - in browser preview function and supports responsive design preview for multiple devices.
- **Integrated terminal**: Emulates a terminal environment to execute common commands like `ls`, `mkdir`, `touch`, etc.
- **AI assistant**: Provides code suggestions, answers questions, and assists with debugging.
- **Project import and export**: Imports projects from folders or ZIP files and exports projects as ZIP files.
- **Customizable settings**: Customizes editor themes, font sizes, etc., to suit personal development habits.

## Tech Stack

- **Front - end technologies**: Built with HTML, CSS, and JavaScript without additional framework dependencies.
- **Code editor**: Uses Monaco Editor, the core of VS Code.
- **File storage**: Uses IndexedDB for local file storage and supports drag - and - drop operations.
- **Compression and decompression**: Uses JSZip library for ZIP file import and export.
- **Debugging tools**: Integrates Eruda for mobile debugging.
- **Responsive layout**: Adapts to desktop and mobile devices.

## Quick Start

### 1. Runtime Requirements

- Modern browsers (e.g., Chrome, Firefox, Edge).
- Support for HTML5 and ES6 + features.

### 2. Installation

```bash
git clone https://github.com/hillmis/webdev.git
cd webdev
```

### 3. Usage

Open the `index.html`file directly in a browser to launch the WebDev tool.

## Project Structure

```
webdev/
├── assets/
│   ├── css/
│   │   └── style.css                 # Main style file
│   └── js/
│       ├── aiChat.js                 # AI chat feature
│       ├── app.js                    # Application main logic
│       ├── devtool.js                # Developer tool initialization
│       ├── editor.js                 # Code editor feature
│       ├── fileManager.js            # File management feature
│       ├── preview.js                # Preview feature
│       ├── resize.js                 # Interface resizing feature
│       ├── terminal.js               # Terminal simulation feature
│       └── utils.js                  # Collection of utility functions
├── 404.html                          # 404 page
├── index.html                        # Main page
├── start.html                        # Startup guide page
└── logo.png                          # Project logo
```

## Function Module Details

### 1. Code Editor

- Supports syntax highlighting for multiple languages.
- Provides auto - completion, bracket matching, etc.
- Supports multi - file tabbed editing.
- Supports undo and redo operations.

### 2. File Manager

- Displays project files in an intuitive file tree structure.
- Supports creating, deleting, and renaming files and folders.
- Supports dragging and dropping files to move or copy them.
- Supports importing projects from the local file system or exporting projects as ZIP files.

### 3. Live Preview

- Built - in browser preview function supports responsive design preview for multiple devices.
- Supports switching between portrait and landscape modes and full - screen preview.
- Supports loading external web pages via URL for testing.
- Supports customizing the user agent to simulate different devices.

### 4. Terminal Emulator

- Supports common commands like `ls`, `mkdir`, `touch`, `echo`, etc.
- Command history function for quick command reuse.
- Supports screen clearing operation.

### 5. AI Programming Assistant (Under Development)

- Provides code problem answers and debugging suggestions.
- Supports code snippet generation and example sharing.
- Supports displaying code blocks in Markdown syntax.

## User Guide

### 1. Creating a New Project

Click the "New Project" button on the toolbar, enter a project name, and confirm to create a new project.

### 2. Importing an Existing Project

- Importing from a folder: Click "Import Project from Folder" and select a local folder.
- Importing from a ZIP file: Click "Import Project from ZIP" and select a ZIP file.

### 3. Exporting a Project

Click "Export Project to ZIP" to package the current project as a ZIP file and download it.

### 4. Using Live Preview

After opening an HTML file in the editor, the preview panel will automatically load and reflect code changes in real - time.

### 5. Using the Terminal Emulator

Click the "Toggle Terminal" button on the toolbar to open the terminal panel and enter commands.

## Custom Settings

### 1. Editor Settings

Click the "Toggle Settings" button on the toolbar to adjust the following settings:

- Editor themes (dark, light, high - contrast).
- Font sizes (10px to 30px).

### 2. Language Settings (Not Implemented)

Supports switching the interface language between Chinese and English.

## Keyboard Shortcuts

- **Ctrl + S**: Save the current file.
- **Ctrl + Z**: Undo.
- **Ctrl + Y**: Redo.
- **Ctrl + F**: Find and replace.
- **Ctrl + N**: Create a new file.
- **Ctrl + O**: Open a file.
- **Ctrl + P**: Quickly open a file.
- **Ctrl + W**: Close the current tab.

## Contact the Author

- Author: Hillmis
- Email: hillmis@qq.com
- Website:[https://iu13.fun](https://iu13.fun)

## License

This project is under the MIT License. For details, see the [LICENSE](LICENSE) file.
