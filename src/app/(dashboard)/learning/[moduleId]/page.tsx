import React from "react";
import { LessonViewerClient } from "@/components/MenteeLearning/LessonViewerClient";

export const metadata = {
  title: "Clinical Lesson Viewer | CBCM Platform",
  description:
    "Interactive clinical LMS lesson viewer for midwives on procedural protocols and competency assessments.",
};

export default function DashboardModuleLessonPage() {
  return <LessonViewerClient />;
}
