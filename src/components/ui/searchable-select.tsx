"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableSelectProps {
  id?: string;
  name?: string;
  options: readonly (SearchableSelectOption | string)[] | (SearchableSelectOption | string)[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: boolean | string;
  clearable?: boolean;
  className?: string;
  containerClassName?: string;
  dropdownClassName?: string;
  size?: "sm" | "default" | "lg";
  "aria-label"?: string;
}

export function SearchableSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found",
  disabled = false,
  error = false,
  clearable = false,
  className,
  containerClassName,
  dropdownClassName,
  size = "default",
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Normalize options into { value, label, description? }
  const normalizedOptions = useMemo<SearchableSelectOption[]>(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt
    );
  }, [options]);

  // Current selected option object
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value) || null;
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus search input when opened and determine flip direction
  useEffect(() => {
    if (isOpen) {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 250 && rect.top > 250) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }

      // Find initial highlighted index (selected item or first item)
      const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);

      // Focus search input on next frame
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } else {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [isOpen, filteredOptions, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const isInvalid = Boolean(error);

  // Size configurations
  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs",
    default: "h-9 px-3 text-sm",
    lg: "h-10 px-3.5 text-sm",
  }[size];

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full text-left", containerClassName)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submission integration */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ""}
          disabled={disabled}
        />
      )}

      {/* Dropdown Trigger */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border bg-white text-left transition-colors duration-150 outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-[#194611]/30 focus-visible:border-[#194611]",
          sizeClasses,
          isInvalid
            ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200"
            : isOpen
            ? "border-[#194611] ring-2 ring-[#194611]/20"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50",
          className
        )}
      >
        <span
          className={cn(
            "truncate block pr-2",
            selectedOption ? "text-gray-900 font-normal" : "text-gray-400"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              aria-label="Clear selection"
              className="p-0.5 rounded hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "transform rotate-180 text-gray-600"
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 left-0 right-0 rounded-lg border border-gray-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-100",
            openUpward ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top",
            dropdownClassName
          )}
        >
          {/* Search Box Header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 rounded-t-lg">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-md outline-none text-gray-800 placeholder:text-gray-400 focus:border-[#194611] focus:ring-1 focus:ring-[#194611]"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-56 overflow-y-auto p-1 text-xs divide-y-0"
            aria-label={placeholder}
          >
            {filteredOptions.length === 0 ? (
              <li className="py-4 px-3 text-center text-xs text-gray-500">
                {searchQuery ? `No options matching "${searchQuery}"` : emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors duration-100",
                      isSelected
                        ? "bg-green-50 text-[#194611] font-medium"
                        : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex flex-col pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#194611] shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
