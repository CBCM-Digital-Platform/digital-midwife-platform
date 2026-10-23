"use client";

import React from "react";

interface UsersTablePaginationProps {
  pageSize: number;
  pageIndex: number;
  filteredCount: number;
  totalDisplayCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPageSizeChange: (size: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function UsersTablePagination({
  pageSize,
  pageIndex,
  filteredCount,
  totalDisplayCount,
  canPreviousPage,
  canNextPage,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: UsersTablePaginationProps) {
  return (
    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 bg-white">
      <div>
        Showing <span className="font-bold text-gray-900">{filteredCount > 0 ? 1 : 0}</span> to{" "}
        <span className="font-bold text-gray-900">
          {Math.min(pageSize, filteredCount)}
        </span>{" "}
        of <span className="font-bold text-gray-900">{totalDisplayCount}</span> results
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-gray-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none bg-white cursor-pointer"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 font-semibold">
          <button
            onClick={onPreviousPage}
            disabled={!canPreviousPage}
            className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-xs text-gray-700 cursor-pointer"
          >
            &lt; Previous
          </button>
          <span className="px-2.5 py-1 rounded bg-[#194611] text-white text-xs font-bold">
            {pageIndex + 1}
          </span>
          <button
            onClick={onNextPage}
            disabled={!canNextPage}
            className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-xs text-gray-700 cursor-pointer"
          >
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
