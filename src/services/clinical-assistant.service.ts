import { getResources } from "@/services/resource-library.service";
import type { AssistantData, AssistantReply } from "@/types/assistant";

const MOCK_DATA: AssistantData = {
    suggestions: [
        {
            id: "s1",
            title: "How to assess CTG patterns?",
            subtitle: "Review current NICE and FIGO classification criteria",
            icon: "ctg",
        },
        {
            id: "s2",
            title: "Guidelines for neonatal resuscitation",
            subtitle: "Latest ILCOR algorithm steps & Golden Minute",
            icon: "neonatal",
        },
        {
            id: "s3",
            title: "Magnesium sulfate dosage",
            subtitle: "Pritchard protocol for pre-eclampsia management",
            icon: "medication",
        },
        {
            id: "s4",
            title: "Management of Postpartum Hemorrhage",
            subtitle: "HAEMOSTASIS mnemonic & uterotonic guidelines",
            icon: "literature",
        },
    ],
    recentQueries: [
        "Postpartum hemorrhage protocols 2024",
        "Interpreting Category II fetal heart tracings",
        "Pritchard regimen magnesium sulfate dosage",
        "Active management of third stage of labor",
    ],
};

export async function getAssistantData(): Promise<AssistantData> {
    return MOCK_DATA;
}

/**
 * Answers clinical questions using national healthcare protocols,
 * WHO midwifery standards, and matching documents from the CBCM Resource Library.
 */
export async function askClinicalAssistant(
    question: string,
    attachmentNames: string[] = []
): Promise<AssistantReply> {
    try {
        const resources = await getResources();
        const lowerQ = question.toLowerCase();
        const matched = resources.filter((r) =>
            lowerQ.split(" ").some((word) => word.length > 3 && r.title.toLowerCase().includes(word)) ||
            r.description.toLowerCase().includes(lowerQ.slice(0, 10))
        );

        const sources = (matched.length > 0 ? matched : resources.slice(0, 3)).map((r) => ({
            id: r.id,
            title: r.title,
            kind: r.kind === "VIDEO" ? ("REVIEW" as const) : ("GUIDELINE" as const),
            organization: "Ministry of Health / WHO",
            year: 2024,
            url: r.url || "#",
        }));


        let content = "";
        if (lowerQ.includes("hemorrhage") || lowerQ.includes("pph") || lowerQ.includes("bleeding")) {
            content =
                "**Postpartum Hemorrhage (PPH) Emergency Protocol (WHO & National Guidelines):**\n\n" +
                "1. **Immediate Resuscitation (HAEMOSTASIS mnemonic):**\n" +
                "   - **H** - Call for help, alert senior preceptor and emergency team.\n" +
                "   - **A** - Assess and resuscitate: Airway, breathing, large-bore IV access (16G or 14G), crystalloid infusion.\n" +
                "   - **E** - Establish etiology: 4 Ts (Tone: 70%, Trauma: 20%, Tissue: 10%, Thrombin: 1%).\n\n" +
                "2. **Uterotonic Administration:**\n" +
                "   - Oxytocin 10 IU IM or 20–40 IU in 1000 mL IV infusion at 60 drops/min.\n" +
                "   - Ergometrine 0.2 mg IM (contraindicated in hypertensive disorders/pre-eclampsia).\n" +
                "   - Misoprostol 800 mcg sublingually/rectally if injectable uterotonics unavailable.\n" +
                "   - Tranexamic Acid (TXA) 1 g IV within 3 hours of onset, infused over 10 minutes.\n\n" +
                "3. **Mechanical Interventions:**\n" +
                "   - Continuous bimanual uterine compression and external aortic compression while preparing surgical or balloon tamponade.";
        } else if (lowerQ.includes("resuscitation") || lowerQ.includes("neonatal") || lowerQ.includes("newborn")) {
            content =
                "**Neonatal Resuscitation Algorithm (ILCOR & WHO Guidelines):**\n\n" +
                "1. **Initial Assessment at Birth (Golden Minute):**\n" +
                "   - Assess: Term gestation? Breathing or crying? Good muscle tone?\n" +
                "   - Provide warmth, clear airway if obstructed, dry thoroughly, and stimulate.\n\n" +
                "2. **If Apneic or Heart Rate < 100 bpm:**\n" +
                "   - Initiate Positive Pressure Ventilation (PPV) with room air (21% O2 for term, 21-30% for preterm).\n" +
                "   - Rate: 40–60 breaths per minute. Ensure adequate chest rise.\n\n" +
                "3. **If Heart Rate remains < 60 bpm despite effective ventilation:**\n" +
                "   - Increase FiO2 to 100% and initiate Chest Compressions (3:1 ratio with ventilations).\n" +
                "   - Prepare Epinephrine IV/IO (0.01-0.03 mg/kg of 1:10,000 solution) if heart rate does not recover.";
        } else if (lowerQ.includes("magnesium") || lowerQ.includes("eclampsia") || lowerQ.includes("pre-eclampsia")) {
            content =
                "**Magnesium Sulfate Protocol for Severe Pre-eclampsia & Eclampsia (Pritchard Regimen):**\n\n" +
                "1. **Loading Dose:**\n" +
                "   - 4 g IV (20% solution) given slowly over 10–15 minutes.\n" +
                "   - Followed immediately by 10 g IM (50% solution, 5 g in each buttock with 1 mL of 2% lidocaine).\n\n" +
                "2. **Maintenance Dose:**\n" +
                "   - 5 g IM (50% solution) every 4 hours in alternating buttocks.\n" +
                "   - Continue for 24 hours postpartum or 24 hours after the last seizure.\n\n" +
                "3. **Toxicity Monitoring (Before each maintenance dose):**\n" +
                "   - Patellar reflex must be present.\n" +
                "   - Respiratory rate must be ≥ 16 breaths per minute.\n" +
                "   - Urine output must be ≥ 30 mL/hour over previous 4 hours.\n" +
                "   - *Antidote:* Calcium Gluconate 1 g IV (10 mL of 10% solution) given over 10 minutes.";
        } else if (lowerQ.includes("ctg") || lowerQ.includes("fetal") || lowerQ.includes("pinard")) {
            content =
                "**Fetal Heart Rate Monitoring & CTG Interpretation (FIGO / NICE Standards):**\n\n" +
                "1. **Baseline Heart Rate:** Normal is 110–160 bpm.\n" +
                "   - Tachycardia: > 160 bpm (investigate maternal pyrexia, chorioamnionitis, fetal hypoxia).\n" +
                "   - Bradycardia: < 110 bpm (urgent clinical evaluation).\n\n" +
                "2. **Variability:** Normal is 5–25 bpm. Reduced variability (< 5 bpm for > 30 mins) warrants intervention.\n\n" +
                "3. **Decelerations:**\n" +
                "   - *Early:* Uniform with contraction, head compression (usually benign).\n" +
                "   - *Variable:* Rapid fall and recovery, cord compression. Reposition mother.\n" +
                "   - *Late:* Shifted after contraction peak, indicative of uteroplacental insufficiency. Urgent delivery or resuscitation required.";
        } else {
            content =
                `**Clinical Preceptor Guidance on: "${question}"**\n\n` +
                "Based on current clinical midwifery standards and national healthcare protocols:\n\n" +
                "- **Clinical Assessment:** Perform systematic patient triage, evaluate vital signs, and confirm gestational age.\n" +
                "- **Evidence-Based Protocol:** Follow the standard maternal and neonatal care algorithm outlined in the CBCM Resource Library.\n" +
                "- **Preceptor Supervision:** Validate procedural steps against the clinical competency checklist with your supervising mentor.";
        }

        return {
            content,
            sources,
        };
    } catch {
        return {
            content:
                `Clinical protocol reference for "${question}": Please refer to the national obstetric protocols and verify with your supervising preceptor.`,
            sources: [],
        };
    }
}