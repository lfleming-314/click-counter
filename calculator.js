const calcExpression = document.getElementById("calcExpression");
const calcDisplay = document.getElementById("calcDisplay");
const calcKeys = document.getElementById("calcKeys");
const degBtn = document.getElementById("degBtn");
const radBtn = document.getElementById("radBtn");

let expression = "";
let angleMode = "deg";

function formatResult(value) {
  if (!Number.isFinite(value)) return "Error";
  if (Math.abs(value) >= 1e10 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(8).replace(/\.?0+e/, "e");
  }
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

function updateDisplay() {
  calcExpression.textContent = expression;
  calcDisplay.textContent = expression || "0";
  calcDisplay.classList.toggle("calc-result--error", calcDisplay.textContent === "Error");
}

function append(value) {
  expression += value;
  updateDisplay();
}

function clearAll() {
  expression = "";
  updateDisplay();
}

function deleteChar() {
  if (expression.endsWith("sqrt(")) {
    expression = expression.slice(0, -5);
  } else {
    expression = expression.slice(0, -1);
  }
  updateDisplay();
}

function toggleNegate() {
  if (!expression) return;

  const match = expression.match(/(\d+\.?\d*)$/);
  if (!match) return;

  const num = match[1];
  const start = expression.length - num.length;
  if (start > 0 && expression[start - 1] === "-") {
    expression = expression.slice(0, start - 1) + num;
  } else {
    expression = expression.slice(0, start) + "-" + num;
  }
  updateDisplay();
}

function setAngleMode(mode) {
  angleMode = mode;
  degBtn.classList.toggle("active", mode === "deg");
  radBtn.classList.toggle("active", mode === "rad");
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error("Invalid factorial");
  if (n > 170) throw new Error("Overflow");
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (/[\d.]/.test(ch)) {
      let num = ch;
      i += 1;
      while (i < input.length && /[\d.]/.test(input[i])) {
        num += input[i];
        i += 1;
      }
      tokens.push({ type: "number", value: parseFloat(num) });
      continue;
    }

    if (/[a-zπ]/.test(ch)) {
      let name = ch;
      i += 1;
      while (i < input.length && /[a-z0-9.]/.test(input[i])) {
        name += input[i];
        i += 1;
      }
      tokens.push({ type: "name", value: name });
      continue;
    }

    if ("+-×÷/^!(),".includes(ch)) {
      tokens.push({ type: "op", value: ch === "/" ? "÷" : ch });
      i += 1;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

function toRadians(value) {
  return angleMode === "deg" ? (value * Math.PI) / 180 : value;
}

function evaluateTokens(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume() {
    return tokens[pos++];
  }

  function parseExpression() {
    let left = parseTerm();

    while (peek()?.type === "op" && (peek().value === "+" || peek().value === "-")) {
      const op = consume().value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }

    return left;
  }

  function parseTerm() {
    let left = parsePower();

    while (peek()?.type === "op" && (peek().value === "×" || peek().value === "÷")) {
      const op = consume().value;
      const right = parsePower();
      if (op === "÷" && right === 0) throw new Error("Division by zero");
      left = op === "×" ? left * right : left / right;
    }

    return left;
  }

  function parsePower() {
    let base = parseUnary();

    while (peek()?.type === "op" && peek().value === "^") {
      consume();
      const exp = parseUnary();
      base = Math.pow(base, exp);
    }

    return base;
  }

  function parseUnary() {
    if (peek()?.type === "op" && peek().value === "-") {
      consume();
      return -parseUnary();
    }

    if (peek()?.type === "op" && peek().value === "+") {
      consume();
      return parseUnary();
    }

    return parsePostfix();
  }

  function parsePostfix() {
    let value = parsePrimary();

    while (peek()?.type === "op" && peek().value === "!") {
      consume();
      value = factorial(value);
    }

    return value;
  }

  function parsePrimary() {
    const token = peek();

    if (!token) throw new Error("Unexpected end");

    if (token.type === "number") {
      consume();
      return token.value;
    }

    if (token.type === "name") {
      const name = consume().value;

      if (name === "π") return Math.PI;
      if (name === "e") return Math.E;

      const fnNames = ["sin", "cos", "tan", "log", "ln", "sqrt"];
      if (fnNames.includes(name)) {
        if (peek()?.type !== "op" || peek().value !== "(") {
          throw new Error(`Expected ( after ${name}`);
        }
        consume();
        const arg = parseExpression();
        if (peek()?.type !== "op" || peek().value !== ")") {
          throw new Error("Expected )");
        }
        consume();

        switch (name) {
          case "sin":
            return Math.sin(toRadians(arg));
          case "cos":
            return Math.cos(toRadians(arg));
          case "tan":
            return Math.tan(toRadians(arg));
          case "log":
            if (arg <= 0) throw new Error("Invalid log");
            return Math.log10(arg);
          case "ln":
            if (arg <= 0) throw new Error("Invalid ln");
            return Math.log(arg);
          case "sqrt":
            if (arg < 0) throw new Error("Invalid sqrt");
            return Math.sqrt(arg);
          default:
            throw new Error(`Unknown function: ${name}`);
        }
      }

      throw new Error(`Unknown name: ${name}`);
    }

    if (token.type === "op" && token.value === "(") {
      consume();
      const value = parseExpression();
      if (peek()?.type !== "op" || peek().value !== ")") {
        throw new Error("Expected )");
      }
      consume();
      return value;
    }

    throw new Error("Invalid expression");
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error("Unexpected token");
  return result;
}

function evaluateExpression(expr) {
  const tokens = tokenize(expr);
  return evaluateTokens(tokens);
}

function calculate() {
  if (!expression) return;

  try {
    const result = evaluateExpression(expression);
    const formatted = formatResult(result);
    calcExpression.textContent = expression + " =";
    calcDisplay.textContent = formatted;
    calcDisplay.classList.remove("calc-result--error");
    expression = formatted === "Error" ? "" : formatted;
  } catch {
    calcExpression.textContent = expression;
    calcDisplay.textContent = "Error";
    calcDisplay.classList.add("calc-result--error");
  }
}

calcKeys.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;

  const insert = btn.dataset.insert;
  const action = btn.dataset.action;

  if (insert !== undefined) {
    append(insert);
    return;
  }

  if (action === "clear") clearAll();
  else if (action === "delete") deleteChar();
  else if (action === "negate") toggleNegate();
  else if (action === "equals") calculate();
});

degBtn.addEventListener("click", () => setAngleMode("deg"));
radBtn.addEventListener("click", () => setAngleMode("rad"));

document.addEventListener("keydown", (event) => {
  if (event.key >= "0" && event.key <= "9") append(event.key);
  else if (event.key === ".") append(".");
  else if (event.key === "+") append("+");
  else if (event.key === "-") append("-");
  else if (event.key === "*") append("×");
  else if (event.key === "/") {
    event.preventDefault();
    append("÷");
  } else if (event.key === "^") append("^");
  else if (event.key === "(") append("(");
  else if (event.key === ")") append(")");
  else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculate();
  } else if (event.key === "Escape") clearAll();
  else if (event.key === "Backspace") {
    event.preventDefault();
    deleteChar();
  }
});

updateDisplay();
