class AIChat {
    constructor() {
        this.messages = document.querySelector('.chat-messages');
        this.input = document.querySelector('.chat-input');
        this.sendButton = document.querySelector('.chat-send-btn');

        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
                this.addWelcomeMessage();
            });
        } else {
            this.initializeEventListeners();
            this.addWelcomeMessage();
        }
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = this.input.scrollHeight + 'px';
        });
    }

    addWelcomeMessage() {
        this.addMessage('ai', 'Hello! I\'m your AI coding assistant. How can I help you today?');
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage('user', message);

        // Clear input
        this.input.value = '';
        this.input.style.height = 'auto';

        // Simulate AI response (replace with actual AI integration)
        this.simulateAIResponse(message);
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' ?
            '<i class="fas fa-user"></i>' :
            '<i class="fas fa-robot"></i>';
        messageDiv.appendChild(avatar);

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';

        // Convert markdown-like code blocks to HTML
        const formattedContent = this.formatMessageContent(content);
        textDiv.innerHTML = formattedContent;

        messageDiv.appendChild(textDiv);

        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    formatMessageContent(content) {
        // Replace code blocks with formatted HTML
        let formatted = content.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, (match, language, code) => {
            return `<pre class="code-block ${language}"><code>${this.escapeHTML(code)}</code></pre>`;
        });

        // Replace inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Replace newlines with <br>
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    simulateAIResponse(userMessage) {
        // Add typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai-message typing';
        typingDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-text">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.messages.appendChild(typingDiv);
        this.messages.scrollTop = this.messages.scrollHeight;

        // Simulate AI thinking time
        setTimeout(() => {
            // Remove typing indicator
            typingDiv.remove();

            // Generate response based on user message
            let response = this.generateResponse(userMessage);
            this.addMessage('ai', response);
        }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    }

    generateResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // Simple pattern matching for responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! How can I help you with your coding today?";
        } else if (lowerMessage.includes('help')) {
            return "I'm here to help! I can assist you with:\n\n- Writing code\n- Debugging issues\n- Explaining concepts\n- Suggesting improvements\n\nWhat would you like help with?";
        } else if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
            return "JavaScript is a versatile programming language. Here's a simple example:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));\n```\n\nWhat specific aspect of JavaScript are you interested in?";
        } else if (lowerMessage.includes('html')) {
            return "HTML is used for structuring web content. Here's a basic example:\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>This is a paragraph.</p>\n</body>\n</html>\n```";
        } else if (lowerMessage.includes('css')) {
            return "CSS is used for styling web pages. Here's a simple example:\n\n```css\nbody {\n  font-family: Arial, sans-serif;\n  background-color: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n  text-align: center;\n}\n```";
        } else if (lowerMessage.includes('thank')) {
            return "You're welcome! Feel free to ask if you need any more help.";
        } else {
            return "I understand you're working on something. Could you provide more details about what you'd like help with? I can assist with code examples, debugging, or explaining concepts.";
        }
    }
}

// Initialize AI Chat
window.aiChat = new AIChat();
