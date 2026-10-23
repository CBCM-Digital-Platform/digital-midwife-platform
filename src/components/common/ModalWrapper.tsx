"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ModalWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export function ModalWrapper({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = "sm:max-w-[540px]",
}: ModalWrapperProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto p-0 bg-white border border-gray-100 shadow-2xl rounded-2xl",
          maxWidth,
          className
        )}
      >
        <DialogHeader className="p-5 sm:p-6 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-xs">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-gray-500 mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="p-5 sm:p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
