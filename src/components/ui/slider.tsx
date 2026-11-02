"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (val: number) => void;
  className?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
  disabled = false,
}: SliderProps) {
  const isControlled = value !== undefined;
  const [internalVal, setInternalVal] = React.useState(defaultValue);
  const currentVal = isControlled ? value : internalVal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    if (!isControlled) {
      setInternalVal(num);
    }
    onValueChange?.(num);
  };

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentVal}
        disabled={disabled}
        onChange={handleChange}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#194611] focus:outline-none focus:ring-2 focus:ring-[#194611] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
