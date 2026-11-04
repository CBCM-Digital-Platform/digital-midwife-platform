import React from "react";
import { LessonViewerClient } from "@/components/MenteeLearning/LessonViewerClient";

export const metadata = {
  title: "Lesson Viewer | Active Management of the Third Stage of Labor | CBCM Platform",
  description:
    "Interactive clinical LMS lesson viewer for midwives on Active Management of the Third Stage of Labor (AMTSL), procedural protocols, and competency assessments.",
};

export default function MenteeLessonPage() {
  return <LessonViewerClient />;
}
