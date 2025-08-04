// State management for calculator
const state = {
    currentInput: '',
    expression: [],
    history: [],
    isResultDisplayed: false
};

// Formats result to scientific notation for long or extreme numbers
function formatResult(number) {
    const numStr = number.toString();
    const absNum = Math.abs(number);
    // Use scientific notation for numbers with >10 digits or very large/small numbers
    if (numStr.replace('.', '').length > 10 || (absNum > 1e7 || (absNum < 1e-7 && absNum !== 0))) {
        return number.toExponential(4);
    }
    return numStr;
}

// Appends a digit or decimal point to the current input
function appendNumber(digit) {
    if (state.isResultDisplayed) {
        state.currentInput = '';
        state.expression = [];
        state.isResultDisplayed = false;
        document.getElementById('display').classList.remove('result');
    }
    if (digit === '.' && state.currentInput.includes('.')) return;
    state.currentInput += digit;
    updateDisplay();
}

// Appends an operator to the expression
function appendOperator(op) {
    if (state.isResultDisplayed) {
        state.expression = [state.currentInput];
        state.currentInput = '';
        state.isResultDisplayed = false;
        document.getElementById('display').classList.remove('result');
    }
    if (state.currentInput === '' && op !== ' - ') return;
    if (state.currentInput) {
        state.expression.push(state.currentInput);
        state.currentInput = '';
    }
    state.expression.push(op.trim());
    updateDisplay();
}

// Removes the last character from the current input or expression
function backspace() {
    if (state.isResultDisplayed) {
        state.currentInput = '';
        state.expression = [];
        state.isResultDisplayed = false;
        document.getElementById('display').classList.remove('result');
    }
    if (state.currentInput) {
        state.currentInput = state.currentInput.slice(0, -1);
    } else if (state.expression.length > 0) {
        state.expression.pop();
        state.currentInput = state.expression.pop() || '';
    }
    updateDisplay();
}

// Resets the current input and expression
function clearDisplay() {
    state.currentInput = '';
    state.expression = [];
    state.isResultDisplayed = false;
    document.getElementById('display').classList.remove('result');
    updateDisplay();
}

// Resets all state including history
function clearAll() {
    state.currentInput = '';
    state.expression = [];
    state.history = [];
    state.isResultDisplayed = false;
    document.getElementById('display').classList.remove('result');
    updateDisplay();
}

// Updates the main display with the current expression or result
function updateDisplay() {
    const display = document.getElementById('display');
    const fullExpression = state.isResultDisplayed ? state.currentInput || '0' : (state.expression.join('') + state.currentInput) || '0';
    display.innerText = fullExpression;
    display.scrollLeft = display.scrollWidth; // Auto-scroll to the right for long inputs
    updateHistory();
}

// Updates the history box with past calculations
function updateHistory() {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = state.history.map(h => `<div>${h.expression} = ${h.result}</div>`).join('');
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Evaluates the current expression and displays the result
function calculate() {
    if (state.isResultDisplayed) return;
    if (state.currentInput) {
        state.expression.push(state.currentInput);
    }
    if (state.expression.length < 1 || (state.expression.length === 1 && !parseFloat(state.expression[0]))) return; // Allow single number input

    try {
        const result = evaluateExpression(state.expression);
        const expressionStr = state.expression.join('');
        const formattedResult = formatResult(result); // Format to scientific notation if needed
        state.history.push({ expression: expressionStr, result: formattedResult });
        if (state.history.length > 10) state.history.shift(); // Limit history to 10 entries
        state.currentInput = formattedResult;
        state.expression = [];
        state.isResultDisplayed = true;
        document.getElementById('display').classList.add('result');
        updateDisplay();
    } catch (error) {
        state.currentInput = error.message;
        state.expression = [];
        state.isResultDisplayed = true;
        document.getElementById('display').classList.add('result');
        updateDisplay();
    }
}

// Evaluates the expression with operator precedence
function evaluateExpression(expr) {
    const tokens = [...expr];
    const operators = [];
    const numbers = [];

    // Parse tokens into numbers and operators
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (['+', '-', '*', '/'].includes(token)) {
            operators.push(token);
        } else {
            const num = parseFloat(token);
            if (isNaN(num)) throw new Error('Invalid number');
            numbers.push(num);
        }
    }

    // Handle single number case
    if (numbers.length === 1 && operators.length === 0) {
        return numbers[0];
    }

    // Validate expression
    if (numbers.length <= operators.length) throw new Error('Invalid expression');

    // Define operator precedence and operations
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const applyOperator = (op, a, b) => {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/':
                if (b === 0) throw new Error('Cannot divide by zero');
                return a / b;
            default: throw new Error('Invalid operation');
        }
    };

    // Process high-precedence operators (*, /) first
    let i = 0;
    while (i < operators.length) {
        if (precedence[operators[i]] === 2) {
            numbers[i] = applyOperator(operators[i], numbers[i], numbers[i + 1]);
            numbers.splice(i + 1, 1);
            operators.splice(i, 1);
        } else {
            i++;
        }
    }

    // Process remaining operators (+, -)
    let result = numbers[0];
    for (let i = 0; i < operators.length; i++) {
        result = applyOperator(operators[i], result, numbers[i + 1]);
    }

    return result;
}

// Toggles between dark and light themes
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.innerText = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    const h1 = document.querySelector('h1');
    h1.style.color = document.body.classList.contains('dark-mode') ? '#e2e8f0' : '#2d3748';
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    event.preventDefault(); // Prevent default browser behavior for calculator keys
    const key = event.key;
    if (/[0-9]/.test(key)) {
        appendNumber(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendOperator(` ${key} `);
    } else if (key === '.') {
        appendNumber('.');
    } else if (key === 'Enter') {
        calculate();
    } else if (key === 'Backspace') {
        backspace();
    } else if (key === 'Escape') {
        if (event.shiftKey) {
            clearAll(); // Shift+Escape for CA
        } else {
            clearDisplay(); // Escape for C
        }
    }
});

// Ensure calculator is focusable for keyboard input
document.getElementById('calculator').focus();