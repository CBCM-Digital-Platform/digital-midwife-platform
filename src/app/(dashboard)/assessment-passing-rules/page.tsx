import React from "react";
import { getEnrichedAssessmentPassingRules } from "@/services/assessment-passing-rules.service";
import { PassingRulesTableClient } from "@/components/PassingRules/PassingRulesTableClient";

export const metadata = {
  title: "Assessment Passing Rules | CBCM Platform",
  description:
    "System administrator configuration of minimum theory exam, practical clinical OSCE, and criteria score thresholds.",
};

export default async function AssessmentPassingRulesPage() {
  const { rules, cycles, thematicAreas } = await getEnrichedAssessmentPassingRules();

  return (
    <PassingRulesTableClient
      initialRules={rules}
      cycles={cycles}
      thematicAreas={thematicAreas}
    />
  );
}
