import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  length: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  inputGroupClassName?: string;
  separator?: React.ReactNode;
  autoFocus?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const CodeInput = ({
  length = 6,
  onComplete,
  disabled = false,
  className,
  inputClassName,
  inputGroupClassName,
  separator = "-",
  autoFocus = false,
  value = "",
  onChange,
}: CodeInputProps) => {
  const [code, setCode] = useState<string[]>(
    value ? value.split("").slice(0, length) : Array(length).fill("")
  );
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize the refs array
  useEffect(() => {
    inputs.current = inputs.current.slice(0, length);
  }, [length]);

  // Update the internal state when the value prop changes
  useEffect(() => {
    if (value) {
      const valueArray = value.split("").slice(0, length);
      setCode(valueArray.concat(Array(length - valueArray.length).fill("")));
    }
  }, [value, length]);

  // Format the code to include separator at position 3
  const formatDisplayCode = (code: string[]): string => {
    if (code.length <= 3) return code.join("");
    return code.slice(0, 3).join("") + "-" + code.slice(3).join("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only process the last character if multiple characters are entered
    const lastChar = value.slice(-1);
    
    // Accept only digits
    if (lastChar && !/^\d+$/.test(lastChar)) return;
    
    const newCode = [...code];
    newCode[index] = lastChar;
    setCode(newCode);
    
    // Call the onChange prop if it exists
    if (onChange) {
      onChange(formatDisplayCode(newCode));
    }
    
    // Auto-focus next input if we have a value
    if (lastChar && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
    
    // Check if all digits are filled
    if (!newCode.includes("")) {
      onComplete(formatDisplayCode(newCode));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Navigate left on backspace if current input is empty
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      
      // Clear the previous input
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      
      if (onChange) {
        onChange(formatDisplayCode(newCode));
      }
      
      e.preventDefault();
    }
    
    // Navigate with arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
      e.preventDefault();
    }
    
    if (e.key === "ArrowRight" && index < length - 1) {
      inputs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    
    // Filter out non-digits
    const digits = pastedData.replace(/\D/g, "");
    
    if (digits) {
      const newCode = Array(length).fill("");
      
      // Fill the code array with pasted digits
      for (let i = 0; i < Math.min(digits.length, length); i++) {
        newCode[i] = digits[i];
      }
      
      setCode(newCode);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newCode.findIndex(digit => !digit);
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputs.current[focusIndex]?.focus();
      
      if (onChange) {
        onChange(formatDisplayCode(newCode));
      }
      
      // Check if all digits are filled
      if (!newCode.includes("")) {
        onComplete(formatDisplayCode(newCode));
      }
    }
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <div className={cn("flex items-center", inputGroupClassName)}>
        {Array.from({ length }, (_, index) => (
          <React.Fragment key={index}>
            <Input
              ref={el => inputs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              autoFocus={autoFocus && index === 0}
              disabled={disabled}
              className={cn(
                "w-12 h-14 text-center text-xl",
                inputClassName
              )}
            />
            {index === 2 && separator && (
              <div className="mx-2 text-xl text-gray-500">{separator}</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export { CodeInput };
