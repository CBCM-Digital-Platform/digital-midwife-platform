import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onChange, onCheckedChange, ...props }, ref) => {
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked));
    const isChecked = isControlled ? Boolean(checked) : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded border border-gray-300 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611] focus-visible:ring-offset-2 peer-checked:bg-[#194611] peer-checked:border-[#194611] flex items-center justify-center text-white",
            className
          )}
        >
          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
