"use client";

import React from "react";
import {
  ChevronDown,
  Download,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

interface UsersTableToolbarProps {
  role: "mentor" | "mentee";
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  selectedThematicArea: string;
  onThematicAreaChange: (value: string) => void;
  thematicList: string[];
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedMentor: string;
  onMentorChange: (value: string) => void;
  mentorsList: string[];
  onResetFilters: () => void;
  onExportCsv: () => void;
  showingCount: number;
  totalDisplayCount: number;
  cohortLabel: string;
}

export function UsersTableToolbar({
  role,
  globalFilter,
  onGlobalFilterChange,
  selectedThematicArea,
  onThematicAreaChange,
  thematicList,
  selectedStatus,
  onStatusChange,
  selectedMentor,
  onMentorChange,
  mentorsList,
  onResetFilters,
  onExportCsv,
  showingCount,
  totalDisplayCount,
  cohortLabel,
}: UsersTableToolbarProps) {
  return (
    <>
      {/* 1. TOP SEARCH & EXPORT TOOLBAR */}
      <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:flex-1 sm:max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            placeholder={`Search by ${role} name, clinical ID, or keyword...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
          />
        </div>

        {/* Export CSV Button */}
        <button
          onClick={onExportCsv}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-semibold transition shadow-sm cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Download className="h-3.5 w-3.5 text-gray-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 2. SECOND FILTER ROW */}
      <div className="px-3.5 sm:px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter by:</span>
        </div>

        {/* Thematic Areas Filter */}
        <div className="relative">
          <select
            value={selectedThematicArea}
            onChange={(e) => onThematicAreaChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="all">All Thematic Areas</option>
            {thematicList.map((t, idx) => (
              <option key={`thematic-${t}-${idx}`} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Statuses Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Mentors Filter (When role === "mentee") */}
        {role === "mentee" && (
          <div className="relative">
            <select
              value={selectedMentor}
              onChange={(e) => onMentorChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="all">All Mentors</option>
              {mentorsList.map((m, idx) => (
                <option key={`mentor-${m}-${idx}`} value={m}>
                  {m}
                </option>
              ))}
              <option value="pending_review">Pending Review</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Reset Filters */}
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 transition cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* 3. COHORT SUMMARY HEADER BANNER */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-slate-50/70 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-800">
            Showing {showingCount} of {totalDisplayCount} {role}s
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 font-medium">{cohortLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-1 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-gray-700 shadow-xs cursor-pointer"
            title="Table View Options"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
