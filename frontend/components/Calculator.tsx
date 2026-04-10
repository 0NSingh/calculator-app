"use client";

import React, { useState, useCallback, useMemo } from "react";

interface CalculatorProps {
  onCalculate?: (calculation: string, result: string) => void;
  initialDisplay?: string;
}

const Button = ({ label, color = "dark", wide = false, onClick }: { 
  label: string, 
  color?: "dark" | "light" | "orange", 
  wide?: boolean,
  onClick: () => void 
}) => {
  const bgColors = {
    dark: "bg-[#333333] hover:bg-[#4d4d4d]",
    light: "bg-[#a5a5a5] hover:bg-[#d4d4d4] text-black",
    orange: "bg-[#ff9f0a] hover:bg-[#ffb447]",
  };

  return (
    <button
      onClick={onClick}
      className={`${bgColors[color]} ${wide ? "col-span-2 aspect-[2/1] rounded-[30px] sm:rounded-[40px] md:rounded-[45px] px-4 sm:px-6 md:px-8 text-left" : "aspect-square rounded-full"} flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-medium transition-colors active:scale-95`}
    >
      {label}
    </button>
  );
};

const Calculator: React.FC<CalculatorProps> = ({ onCalculate, initialDisplay = "0" }) => {
  const [display, setDisplay] = useState(initialDisplay);
  const [expression, setExpression] = useState("");
  const [buffer, setBuffer] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetDisplay, setResetDisplay] = useState(false);

  const displayFontSize = useMemo(() => {
    const len = display.length;
    if (len <= 6) return { font: "text-6xl", lines: 1 };
    if (len <= 9) return { font: "text-5xl", lines: 1 };
    if (len <= 13) return { font: "text-4xl", lines: 1 };
    if (len <= 18) return { font: "text-3xl", lines: 2 };
    if (len <= 24) return { font: "text-2xl", lines: 2 };
    return { font: "text-xl", lines: 3 };
  }, [display]);

  const expressionFontSize = useMemo(() => {
    const len = expression.length;
    if (len <= 15) return "text-sm";
    if (len <= 25) return "text-xs";
    return "text-[10px]";
  }, [expression]);

  const calculate = useCallback((a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return a / b;
      default: return b;
    }
  }, []);

  const handleNumber = useCallback((num: string) => {
    if (resetDisplay) {
      setDisplay(num === "." ? "0." : num);
      setResetDisplay(false);
      return;
    }

    if (num === ".") {
      if (display.includes(".")) return;
      setDisplay(display + ".");
      return;
    }

    if (display === "0") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  }, [display, resetDisplay]);

  const handleOperation = useCallback((op: string) => {
    const current = parseFloat(display);
    if (buffer === null) {
      setBuffer(current);
      setExpression(`${current} ${op}`);
    } else if (operation) {
      const result = calculate(buffer, current, operation);
      if (onCalculate) {
        onCalculate(`${buffer} ${operation} ${current}`, result.toString());
      }
      setBuffer(result);
      setDisplay(result.toString());
      setExpression(`${result} ${op}`);
    }
    setOperation(op);
    setResetDisplay(true);
  }, [display, buffer, operation, calculate, onCalculate]);

  const handleEqual = useCallback(() => {
    const current = parseFloat(display);
    if (buffer !== null && operation) {
      const result = calculate(buffer, current, operation);
      if (onCalculate) {
        onCalculate(`${buffer} ${operation} ${current}`, result.toString());
      }
      setExpression(`${buffer} ${operation} ${current} =`);
      setDisplay(result.toString());
      setBuffer(null);
      setOperation(null);
      setResetDisplay(true);
    }
  }, [display, buffer, operation, calculate, onCalculate]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setBuffer(null);
    setOperation(null);
    setResetDisplay(false);
  }, []);

  const handleToggleSign = useCallback(() => {
    setDisplay((parseFloat(display) * -1).toString());
  }, [display]);

  const handlePercent = useCallback(() => {
    setDisplay((parseFloat(display) / 100).toString());
  }, [display]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key >= "0" && e.key <= "9") handleNumber(e.key);
      if (e.key === ".") handleNumber(".");
      if (e.key === "+") handleOperation("+");
      if (e.key === "-") handleOperation("-");
      if (e.key === "*") handleOperation("×");
      if (e.key === "/") {
        e.preventDefault();
        handleOperation("÷");
      }
      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEqual();
      }
      if (e.key === "Escape" || e.key.toLowerCase() === "c") handleClear();
      if (e.key === "Backspace") {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNumber, handleOperation, handleEqual, handleClear]);

  const displayHeightClass = displayFontSize.lines === 1 ? "h-24 md:h-32" : displayFontSize.lines === 2 ? "h-32 md:h-40" : "h-40 md:h-48";

  return (
    <div className="bg-black p-4 sm:p-6 md:p-8 rounded-3xl sm:rounded-[40px] md:rounded-[60px] w-[320px] sm:w-[360px] md:w-[420px] shadow-2xl border-2 sm:border-4 md:border-4 border-[#1c1c1c]">
      <div className={`${displayHeightClass} flex flex-col justify-end items-end pr-3 sm:pr-4 md:pr-6 pb-2 sm:pb-3 md:pb-4`}>
        <div className={`text-[#ff9f0a] ${expressionFontSize} font-medium mb-1 sm:mb-2 overflow-hidden text-ellipsis whitespace-nowrap w-full text-right`}>
          {expression}
        </div>
        <div className={`text-white ${displayFontSize.font} font-light tracking-tight w-full text-right break-all leading-tight`}>
          {display}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Button label={display === "0" && !expression ? "AC" : "C"} color="light" onClick={handleClear} />
        <Button label="+/-" color="light" onClick={handleToggleSign} />
        <Button label="%" color="light" onClick={handlePercent} />
        <Button label="÷" color="orange" onClick={() => handleOperation("÷")} />

        <Button label="7" onClick={() => handleNumber("7")} />
        <Button label="8" onClick={() => handleNumber("8")} />
        <Button label="9" onClick={() => handleNumber("9")} />
        <Button label="×" color="orange" onClick={() => handleOperation("×")} />

        <Button label="4" onClick={() => handleNumber("4")} />
        <Button label="5" onClick={() => handleNumber("5")} />
        <Button label="6" onClick={() => handleNumber("6")} />
        <Button label="-" color="orange" onClick={() => handleOperation("-")} />

        <Button label="1" onClick={() => handleNumber("1")} />
        <Button label="2" onClick={() => handleNumber("2")} />
        <Button label="3" onClick={() => handleNumber("3")} />
        <Button label="+" color="orange" onClick={() => handleOperation("+")} />

        <Button label="0" wide onClick={() => handleNumber("0")} />
        <Button label="." onClick={() => handleNumber(".")} />
        <Button label="=" color="orange" onClick={handleEqual} />
      </div>
    </div>
  );
};

export default Calculator;
