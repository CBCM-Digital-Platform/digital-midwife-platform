"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value?: string | number;
  onChange?: (val: any) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (val: any) => void;
  name?: string;
}

export function RadioGroup({
  className,
  value,
  defaultValue,
  onValueChange,
  name,
  children,
  ...props
}: RadioGroupProps) {
  const [internalVal, setInternalVal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const currentVal = isControlled ? value : internalVal;

  const handleChange = React.useCallback(
    (newVal: any) => {
      if (!isControlled) {
        setInternalVal(newVal);
      }
      onValueChange?.(newVal);
    },
    [isControlled, onValueChange]
  );

  return (
    <RadioGroupContext.Provider value={{ value: currentVal, onChange: handleChange, name }}>
      <div role="radiogroup" className={cn("grid gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string | number;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext);
    const checked = ctx ? String(ctx.value) === String(value) : false;

    return (
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          ref={ref}
          type="radio"
          name={ctx?.name}
          checked={checked}
          onChange={() => ctx?.onChange?.(value)}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-gray-300 text-[#194611] transition-all flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[#194611] peer-focus-visible:ring-offset-2 peer-checked:border-[#194611]",
            className
          )}
        >
          {checked && <div className="h-2 w-2 rounded-full bg-[#194611]" />}
        </div>
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";
