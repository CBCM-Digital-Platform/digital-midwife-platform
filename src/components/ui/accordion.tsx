"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

export function Accordion({
  children,
  className,
  defaultValue = "item-1",
  type = "single",
  ...props
}: AccordionProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    if (Array.isArray(defaultValue)) return new Set(defaultValue);
    if (defaultValue) return new Set([defaultValue]);
    return new Set<string>();
  });

  const toggleItem = React.useCallback(
    (value: string) => {
      setExpanded((prev) => {
        const next = new Set(type === "single" ? [] : prev);
        if (prev.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        return next;
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ expandedItems: expanded, toggleItem }}>
      <div className={cn("divide-y divide-gray-200 border-y border-gray-200", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean }>({
  value: "",
  isOpen: false,
});

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  const ctx = React.useContext(AccordionContext);
  const isOpen = ctx ? ctx.expandedItems.has(value) : false;

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div className={cn("py-1", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const accordionCtx = React.useContext(AccordionContext);
  const itemCtx = React.useContext(AccordionItemContext);

  const isOpen = itemCtx.isOpen;

  return (
    <button
      type="button"
      onClick={() => accordionCtx?.toggleItem(itemCtx.value)}
      className={cn(
        "flex w-full items-center justify-between py-3.5 px-4 text-left font-semibold text-gray-900 transition-all hover:bg-gray-50/80 rounded-lg cursor-pointer",
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      <span className="flex items-center gap-2 text-sm">{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180 text-[#194611]"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const itemCtx = React.useContext(AccordionItemContext);

  if (!itemCtx.isOpen) return null;

  return (
    <div
      className={cn(
        "px-4 pb-4 pt-1 text-sm text-gray-600 animate-in fade-in-50 duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
