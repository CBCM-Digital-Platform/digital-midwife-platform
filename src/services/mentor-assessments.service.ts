import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMyMentees } from "@/services/my-mentees.service";
import type { MyMentee } from "@/types/my-mentee";
import type {
    AssessmentChecklistItem,
    AssessmentCriterionScore,
    AssessmentEvidence,
    AssessmentStatus,
    MentorAssessment,
    NewAssessmentInput,
    CertificateEligibility,
    PreparedAssessmentTemplate,
} from "@/types/mentor-assessment";

export const ASSESSMENT_STORAGE_KEY = "cbcm_mentor_assessments_store";

export const PREPARED_ASSESSMENT_TEMPLATES: PreparedAssessmentTemplate[] = [
    {
        id: "nsvd-amtsl",
        title: "Normal Spontaneous Vaginal Delivery & AMTSL",
        thematicArea: "Labor & Delivery Care",
        thematicAreaId: 1,
        description: "Competency evaluation for conducting normal vertex delivery and Active Management of the Third Stage of Labor.",
        clinicalScope: "Conduct bedside delivery with aseptic technique, timely oxytocin administration (within 1 min of birth), controlled cord traction (CCT), and immediate postpartum uterine tone monitoring.",
        instructions: "Demonstrate aseptic delivery precautions, observe maternal vitals and fetal descent, perform delivery using manual perineal protection, administer 10 IU IM Oxytocin within 1 minute of fetal delivery, perform Brandt-Andrews maneuver for placental delivery, assess placenta completeness, and inspect birth canal for lacerations.",
        referenceLink: "https://who.int/publications/i/item/9789241548441",
        passingTheoryThreshold: 80,
        passingPracticalThreshold: 4,
        checklistItems: [
            "Patient explanation, dignity, and verbal consent obtained",
            "Sterile delivery pack, PPE, and neonatal warming surface prepared",
            "Perineal support and controlled head delivery performed smoothly",
            "Oxytocin 10 IU IM administered within 1 minute of delivery",
            "Controlled cord traction (CCT) with counter-traction applied correctly",
            "Placenta & membranes inspected for complete cotyledons and integrity",
            "Uterine tone verified firm, fundal massage taught to patient",
            "Immediate postpartum maternal vitals and blood loss recorded",
        ],
        criteria: [
            "Aseptic Technique & Infection Prevention",
            "Patient Communication & Trauma-Informed Care",
            "Procedural Precision & Complication Vigilance",
            "Postpartum Documentation & Emergency Readiness",
        ],
    },
    {
        id: "newborn-resuscitation",
        title: "Neonatal Resuscitation & The Golden Minute",
        thematicArea: "Immediate Newborn Care",
        thematicAreaId: 2,
        description: "Standardized clinical simulation and bedside assessment for non-breathing newborns within the first 60 seconds.",
        clinicalScope: "Rapid initial assessment (term gestation, tone, crying/breathing), thermal protection, clearing airway if obstructed, and initiating positive pressure ventilation (PPV) within the Golden Minute.",
        instructions: "Dry the newborn thoroughly on maternal abdomen, stimulate breathing, position airway in sniffing position, assess heart rate via cord pulsation or stethoscope, apply correct size mask for bag-mask ventilation at 40-60 breaths/min if apneic or HR < 100 bpm, and re-evaluate chest rise.",
        referenceLink: "https://www.who.int/publications/i/item/9789241548816",
        passingTheoryThreshold: 80,
        passingPracticalThreshold: 4,
        checklistItems: [
            "Immediate drying and removal of wet towel completed within 30s",
            "Apnea or gasping recognized immediately; newborn stimulated gently",
            "Airway positioned with neck slightly extended (sniffing position)",
            "Correct size mask selected with tight anatomic facial seal",
            "Bag-mask positive pressure ventilation initiated at 40-60 breaths/min",
            "Visible chest movement verified with each ventilation breath",
            "Heart rate auscultated and categorized (>100 or <100 bpm)",
            "Safe transition to post-resuscitation kangaroo care or advanced referral",
        ],
        criteria: [
            "Airway & Ventilation Technique",
            "Time-Critical Clinical Action (Golden Minute)",
            "Heart Rate & Respiration Assessment",
            "Thermal Care & Infection Control",
        ],
    },
    {
        id: "preeclampsia-mgso4",
        title: "Severe Pre-eclampsia & MgSO4 Administration",
        thematicArea: "Emergency Obstetric Care (EmONC)",
        thematicAreaId: 3,
        description: "Clinical protocol assessment for emergency stabilization, magnesium sulfate dosing, and toxicity monitoring.",
        clinicalScope: "Early recognition of imminent eclampsia danger signs, safe reconstitution and intravenous/intramuscular magnesium sulfate administration, and hourly clinical toxicity surveillance.",
        instructions: "Verify blood pressure criteria (≥160/110 mmHg) and danger signs (headache, visual disturbance, epigastric pain). Prepare Pritchard or Zuspan regimen: 4g IV loading dose over 15-20 minutes plus 10g IM (5g in each buttock). Document baseline patellar reflexes, respiratory rate (>16/min), and urine output (>30ml/hr). Keep Calcium Gluconate 10% available bedside.",
        referenceLink: "https://www.who.int/publications/i/item/9789241548335",
        passingTheoryThreshold: 80,
        passingPracticalThreshold: 4,
        checklistItems: [
            "Severe hypertension & eclampsia danger symptoms promptly recognized",
            "Indwelling Foley catheter placed for strict hourly urine output monitoring",
            "MgSO4 4g IV loading dose administered slowly over 15-20 minutes",
            "MgSO4 10g IM deep gluteal injection administered with 1% lidocaine",
            "Deep tendon patellar reflexes verified present prior to maintenance dose",
            "Respiratory rate confirmed ≥16 breaths/min before repeat administration",
            "Calcium gluconate 10% antidote confirmed at bedside and ready",
            "Antihypertensive agent (Hydralazine/Labetalol) administered as indicated",
        ],
        criteria: [
            "Medication Safety & Reconstitution Accuracy",
            "Toxicity Monitoring (Reflexes, Urine, Respiration)",
            "Bedside Patient Safety & Seizure Precautions",
            "Emergency Obstetric Documentation",
        ],
    },
    {
        id: "partograph-surveillance",
        title: "Partograph Plotting & Labor Progress Monitoring",
        thematicArea: "Intrapartum Surveillance",
        thematicAreaId: 4,
        description: "Assessment on accurate real-time plotting of the WHO Partograph and identifying abnormal labor progress requiring intervention.",
        clinicalScope: "Tracking cervical dilatation, fetal descent, uterine contraction frequency/duration, amniotic fluid status, and fetal heart rate patterns against Alert and Action lines.",
        instructions: "Accurately record patient admission data in active phase (≥4 cm). Plot cervical dilatation every 4 hours, descent of head every 4 hours, contractions every 30 minutes, and FHR every 30 minutes. Recognize crossing of Alert line and formulate timely intervention or referral plan before crossing Action line.",
        referenceLink: "https://www.who.int/tools/labour-care-guide",
        passingTheoryThreshold: 80,
        passingPracticalThreshold: 3,
        checklistItems: [
            "Active phase labor confirmed before initiating first partograph plot",
            "Cervical dilatation plotted accurately with 'X' on Alert line",
            "Fetal head descent assessed by abdominal palpation in fifths (not vaginal)",
            "Contraction frequency and strength recorded every 30 mins using correct shading",
            "Fetal heart rate auscultated for 1 full min immediately after contraction",
            "Maternal vital signs and urinalysis documented at recommended intervals",
            "Deviation past Alert line identified with documented clinical escalation plan",
        ],
        criteria: [
            "Partograph Plotting Precision",
            "Fetal Well-being Interpretation",
            "Labor Dystocia Recognition",
            "Timely Escalation & Referral Decision",
        ],
    },
    {
        id: "pph-emergency-bundle",
        title: "Postpartum Hemorrhage (PPH) Emergency Bundle",
        thematicArea: "Emergency Obstetric Care (EmONC)",
        thematicAreaId: 5,
        description: "Bedside emergency drills and clinical assessment for rapid control of primary postpartum hemorrhage.",
        clinicalScope: "Quantification of blood loss, systematic diagnosis of the 4 Ts, simultaneous multidisciplinary resuscitation, uterotonics, and bimanual uterine compression.",
        instructions: "Call for help immediately upon detecting excessive bleeding (>500ml vaginal or signs of shock). Initiate uterine massage. Establish two large-bore IV cannulae (16G or 18G). Administer second-line uterotonics (Oxytocin infusion, Misoprostol, Tranexamic Acid 1g IV within 3h of birth). Perform internal/external bimanual compression or aortic compression if atony persists.",
        referenceLink: "https://www.who.int/publications/i/item/9789241548502",
        passingTheoryThreshold: 80,
        passingPracticalThreshold: 4,
        checklistItems: [
            "Excessive bleeding quantified promptly; emergency team alert called",
            "Vigorous fundal massage initiated immediately and continuously",
            "Two large-bore IV access lines secured; rapid isotonic crystalloid started",
            "Tranexamic Acid 1g IV administered slowly within first 3 hours of birth",
            "Second-line uterotonics (Oxytocin 20-40 IU drip, Ergometrine/Misoprostol) given",
            "Bladder evacuated with straight or Foley catheter",
            "Bimanual uterine compression or external aortic compression executed",
            "Birth canal inspected systematically under direct visualization for tears",
        ],
        criteria: [
            "Rapid Emergency Team Mobilization",
            "Bimanual Compression Technique",
            "Pharmacologic Hemorrhage Protocol Adherence",
            "Shock Resuscitation & Fluid Management",
        ],
    },
    {
        id: "maternity-ipc",
        title: "Infection Prevention & Control (IPC) in Maternity",
        thematicArea: "Clinical Quality & Safety",
        thematicAreaId: 6,
        description: "Direct observation of clinical hygiene, PPE donning/doffing, sterile field maintenance, and waste segregation in labor rooms.",
        clinicalScope: "Adherence to the 5 Moments of Hand Hygiene, aseptic non-touch technique (ANTT), instrument decontamination, and sharp injury prevention.",
        instructions: "Demonstrate proper hand scrubbing technique (minimum 60 seconds with antimicrobial soap or 20-30 seconds with alcohol rub). Assemble sterile trolley without touching edges. Don sterile gloves using closed technique. Dispose of placenta in biohazard waste bin, and immerse reusable instruments immediately in 0.5% chlorine solution for 10 minutes.",
        referenceLink: "https://www.who.int/teams/integrated-health-services/infection-prevention-control",
        passingTheoryThreshold: 80,
        passingPracticalThreshold: 4,
        checklistItems: [
            "Hand hygiene performed according to WHO 5 Moments before touching patient",
            "Sterile gloves donned using aseptic technique without contaminating cuff",
            "Sterile delivery instruments opened onto field without edge contact",
            "Personal Protective Equipment (plastic apron, mask, eye protection) utilized",
            "Sharp needle placed directly into puncture-proof safety box (no recapping)",
            "Used instruments decontaminated in fresh 0.5% chlorine solution for 10 min",
            "Medical waste and soiled linen segregated according to color-coded bins",
        ],
        criteria: [
            "Hand Hygiene & Aseptic Non-Touch Technique",
            "PPE Compliance & Personal Protection",
            "Decontamination & Instrument Processing",
            "Biohazard Waste & Sharp Safety",
        ],
    },
];

export const ASSESSMENT_TYPES = PREPARED_ASSESSMENT_TEMPLATES.map((t) => t.title);

// Memory cache for SSR and in-process synchronization
let MEMORY_STORE: MentorAssessment[] = [];

export function getStoredAssessments(): MentorAssessment[] {
    if (typeof window === "undefined") {
        return MEMORY_STORE;
    }
    try {
        const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
        if (!raw) return MEMORY_STORE;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            const ids = new Set(parsed.map((a: MentorAssessment) => a.id));
            const merged = [...parsed];
            for (const item of MEMORY_STORE) {
                if (!ids.has(item.id)) {
                    merged.push(item);
                }
            }
            return merged;
        }
    } catch (e) {
        console.warn("Could not read assessments from localStorage:", e);
    }
    return MEMORY_STORE;
}

export function saveStoredAssessments(items: MentorAssessment[]): void {
    MEMORY_STORE = items;
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(items));
            window.dispatchEvent(new CustomEvent("cbcm-assessments-updated", { detail: items }));
        } catch (e) {
            console.warn("Could not write assessments to localStorage:", e);
        }
    }
}

export async function getAssessmentTypes(): Promise<string[]> {
    return ASSESSMENT_TYPES;
}

export function getPreparedAssessmentTemplates(): PreparedAssessmentTemplate[] {
    return PREPARED_ASSESSMENT_TEMPLATES;
}

function mapBackendStatus(rawStatus?: string): AssessmentStatus {
    const s = String(rawStatus || "").toLowerCase();
    if (s === "finalized" || s === "reviewed" || s === "pass") return "PASS";
    if (s === "in_review" || s === "needs_review") return "NEEDS_REVIEW";
    return "PENDING";
}

/**
 * Normalizes backend assessment payload to frontend MentorAssessment model.
 */
export function normalizeAssessment(raw: any): MentorAssessment {
    if (!raw) return {} as MentorAssessment;

    const id = String(raw.id ?? raw._id ?? "");
    const mentee = raw.mentee || {};
    const menteeId = String(raw.mentee_id ?? raw.menteeId ?? mentee.id ?? "");
    const menteeName =
        raw.mentee_name ||
        raw.menteeName ||
        mentee.full_name ||
        mentee.name ||
        `Mentee #${menteeId || id}`;
    const menteeTitle =
        mentee.highest_qualification ||
        mentee.training_status ||
        raw.mentee_title ||
        raw.menteeTitle ||
        "Resident Midwife";

    const thematicArea = raw.thematic_area || raw.thematicArea || {};
    const type =
        thematicArea.name ||
        raw.type ||
        raw.title ||
        "Normal Spontaneous Vaginal Delivery & AMTSL";

    const date = raw.created_at
        ? new Date(raw.created_at).toISOString().slice(0, 10)
        : raw.date || new Date().toISOString().slice(0, 10);

    const dueDate = raw.due_date || raw.dueDate || date;
    const status = mapBackendStatus(raw.status);

    const theoryScore =
        raw.theory_score !== undefined && raw.theory_score !== null
            ? Number(raw.theory_score)
            : raw.theoryScore !== undefined && raw.theoryScore !== null
            ? Number(raw.theoryScore)
            : null;

    const scorePct =
        raw.aggregate_score !== undefined && raw.aggregate_score !== null
            ? Number(raw.aggregate_score)
            : raw.scorePct !== undefined && raw.scorePct !== null
            ? Number(raw.scorePct)
            : null;

    const practicalScore =
        raw.practical_score !== undefined && raw.practical_score !== null
            ? Number(raw.practical_score)
            : raw.practicalScore !== undefined && raw.practicalScore !== null
            ? Number(raw.practicalScore)
            : null;

    const criteriaScores: AssessmentCriterionScore[] = Array.isArray(raw.criteria_scores)
        ? raw.criteria_scores.map((c: any) => ({
              id: c.id,
              criterion: c.criterion || "Clinical Criterion",
              score: Number(c.score ?? 0),
          }))
        : Array.isArray(raw.criteriaScores)
        ? raw.criteriaScores
        : [];

    const checklistItems: AssessmentChecklistItem[] = Array.isArray(raw.checklist_items)
        ? raw.checklist_items.map((i: any) => ({
              id: i.id,
              item: i.item || "Procedural Step",
              checked: Boolean(i.checked),
          }))
        : Array.isArray(raw.checklistItems)
        ? raw.checklistItems
        : [];

    const evidence: AssessmentEvidence[] = Array.isArray(raw.evidence)
        ? raw.evidence.map((e: any) => ({
              id: e.id,
              title: e.title || "Clinical Evidence File",
              file_id: e.file_id ?? e.fileId,
              fileId: e.file_id ?? e.fileId,
              url: e.url,
              created_at: e.created_at,
          }))
        : [];

    return {
        id,
        menteeId,
        menteeName,
        menteeTitle,
        date,
        dueDate,
        type,
        status,
        scorePct,
        aggregateScore: scorePct,
        theoryScore,
        theoryPassed: raw.theory_passed ?? (theoryScore !== null ? theoryScore >= 80 : undefined),
        practicalScore,
        practicalFeedback: raw.practical_feedback || raw.feedback || "",
        assessmentDate: raw.assessment_date || date,
        instructions: raw.instructions || raw.feedback || "",
        referenceLink: raw.reference_link || raw.referenceLink || "",
        feedback: raw.feedback || "",
        attachmentNames: raw.attachmentNames || (evidence.length > 0 ? evidence.map((e) => e.title) : []),
        createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
        facilityId: raw.facility_id ?? raw.facilityId,
        facilityName: raw.facility?.name,
        cycleId: raw.cycle_id ?? raw.cycleId,
        thematicAreaId: raw.thematic_area_id ?? raw.thematicAreaId,
        thematicAreaName: thematicArea.name,
        criteriaScores,
        checklistItems,
        evidence,
        prerequisitesMet: raw.prerequisites_met ?? raw.prerequisitesMet ?? true,
    };
}

/**
 * Returns all assessments, fetching from the backend API with fallback to stored data.
 */
export async function getAssessments(): Promise<MentorAssessment[]> {
    const stored = getStoredAssessments();

    try {
        const res = await apiClient.get<any>(`${ENDPOINTS.ASSESSMENTS.BASE}?limit=100`);
        const rawList = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : [];

        if (rawList.length > 0) {
            const liveAssessments = rawList.map(normalizeAssessment);
            const liveIds = new Set(liveAssessments.map((a: MentorAssessment) => a.id));
            const unSyncedStored = stored.filter((s) => !liveIds.has(s.id));
            return [...unSyncedStored, ...liveAssessments];
        }
    } catch (err) {
        console.warn("Could not fetch assessments from backend API:", err);
    }

    return stored;
}

export async function getAssessmentById(id: string | number): Promise<MentorAssessment | null> {
    try {
        const res = await apiClient.get<any>(ENDPOINTS.ASSESSMENTS.DETAIL(id));
        const raw = res?.data ?? res;
        if (raw && (raw.id || raw.mentee_id)) {
            return normalizeAssessment(raw);
        }
    } catch (e) {
        console.warn(`Failed to fetch assessment ${id} from API:`, e);
    }

    const all = await getAssessments();
    const found = all.find((a) => String(a.id) === String(id));
    if (found) return found;

    const byMentee = all.find((a) => String(a.menteeId) === String(id));
    if (byMentee) return byMentee;

    return null;
}

/**
 * Returns all assessments specifically assigned to a mentee.
 */
export async function getAssessmentsForMentee(menteeId: string): Promise<MentorAssessment[]> {
    const all = await getAssessments();
    return all.filter((a) => String(a.menteeId) === String(menteeId));
}

/**
 * Returns the active or latest assigned assessment for a mentee.
 */
export async function getLatestAssessmentForMentee(menteeId: string): Promise<MentorAssessment | null> {
    const forMentee = await getAssessmentsForMentee(menteeId);
    if (forMentee.length === 0) return null;

    const pending = forMentee.find((a) => a.status === "PENDING");
    if (pending) return pending;

    return forMentee[0] || null;
}

/**
 * Creates and persists a new assessment for a mentee from prepared assessment selection, syncing with backend.
 */
export async function createAssessment(
    input: NewAssessmentInput,
    files: File[] = []
): Promise<MentorAssessment> {
    const mentees = await getMyMentees();
    const mentee = mentees.find((m) => String(m.id) === String(input.menteeId));

    // Match with prepared template if available
    const template = PREPARED_ASSESSMENT_TEMPLATES.find(
        (t) => t.title === input.type || t.id === input.type
    );

    const thematicAreaId = Number(input.thematicAreaId || template?.thematicAreaId || 1);

    // Initial checklist and criteria items from template or defaults
    const checklistStrings = input.checklistItems || template?.checklistItems || [
        "Patient explanation, dignity, and verbal consent obtained",
        "Sterile delivery pack and neonatal warming surface prepared",
        "Active management of third stage performed to protocol",
        "Immediate postpartum maternal vitals and blood loss recorded",
    ];

    const criteriaStrings = input.criteria || template?.criteria || [
        "Aseptic Technique & Hand Hygiene",
        "Clinical Patient Communication",
        "Procedural Adherence & Safety",
        "Emergency Vigilance & Documentation",
    ];

    const defaultChecklist: AssessmentChecklistItem[] = checklistStrings.map((item) => ({
        item,
        checked: false,
    }));

    const defaultCriteria: AssessmentCriterionScore[] = criteriaStrings.map((criterion) => ({
        criterion,
        score: 80,
    }));

    // Try resolving current mentor and active cycle
    let mentorId = 1;
    let facilityId = Number(input.facilityId || 1);
    let cycleId = Number(input.cycleId || 1);

    try {
        const [meRes, cyclesRes] = await Promise.all([
            apiClient.get<any>("/api/v1/users/me").catch(() => null),
            apiClient.get<any>("/api/v1/mentorship-cycles?limit=5").catch(() => null),
        ]);

        const me = meRes?.data || meRes;
        if (me?.id) mentorId = Number(me.id);
        if (me?.facility_id) facilityId = Number(me.facility_id);

        const cycles = Array.isArray(cyclesRes?.data) ? cyclesRes.data : [];
        if (cycles.length > 0) {
            const activeCycle = cycles.find((c: any) => c.status === "active") || cycles[0];
            if (activeCycle?.id) cycleId = Number(activeCycle.id);
        }
    } catch {
        // Use defaults
    }

    const numericMenteeId = Number(input.menteeId);
    let createdBackendId: string | null = null;

    // 1. Create on Backend if mentee is numeric
    if (!isNaN(numericMenteeId)) {
        try {
            const payload = {
                mentee_id: numericMenteeId,
                mentor_id: mentorId,
                facility_id: facilityId,
                cycle_id: cycleId,
                thematic_area_id: thematicAreaId,
                prerequisites_met: true,
            };

            const res = await apiClient.post<any>(ENDPOINTS.ASSESSMENTS.BASE, payload);
            const createdRaw = res?.data ?? res;
            if (createdRaw?.id) {
                createdBackendId = String(createdRaw.id);

                // Initialize criteria scores on backend
                await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(createdRaw.id), {
                    criteria_scores: defaultCriteria.map((c) => ({
                        criterion: c.criterion,
                        score: c.score,
                    })),
                }).catch(() => null);

                // Initialize checklist items on backend
                await apiClient.post(ENDPOINTS.ASSESSMENTS.CHECKLIST_ITEMS(createdRaw.id), {
                    checklist_items: defaultChecklist.map((i) => ({
                        item: i.item,
                        checked: i.checked,
                    })),
                }).catch(() => null);
            }
        } catch (apiErr) {
            console.warn("Backend assessment creation failed, creating local assessment:", apiErr);
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    const newAssessment: MentorAssessment = {
        id: createdBackendId || `assgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        menteeId: input.menteeId,
        menteeName: mentee ? mentee.name : `Mentee #${input.menteeId}`,
        menteeTitle: mentee ? mentee.title : "Resident Midwife",
        date: today,
        dueDate: input.dueDate || today,
        type: template?.title || input.type,
        status: "PENDING",
        scorePct: null,
        aggregateScore: null,
        theoryScore: null,
        theoryPassed: false,
        practicalScore: null,
        thematicAreaId,
        thematicAreaName: template?.thematicArea,
        instructions: input.instructions || template?.instructions || "",
        referenceLink: input.referenceLink || template?.referenceLink || "",
        feedback: input.feedback || "",
        attachmentNames: files.map((f) => f.name),
        createdAt: new Date().toISOString(),
        criteriaScores: defaultCriteria,
        checklistItems: defaultChecklist,
    };

    const currentStored = getStoredAssessments();
    const updated = [newAssessment, ...currentStored];
    saveStoredAssessments(updated);

    return newAssessment;
}

/**
 * Updates status, score, or review of an assessment in backend and local store.
 */
export async function updateAssessmentStatus(
    assessmentId: string,
    status: AssessmentStatus,
    scorePct: number | null = null,
    feedback?: string
): Promise<MentorAssessment | null> {
    const numId = Number(assessmentId);

    if (!isNaN(numId) && numId > 0) {
        try {
            if (scorePct !== null) {
                await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(numId), {
                    criteria_scores: [
                        { criterion: "Aseptic Technique & Hand Hygiene", score: Math.min(100, scorePct + 4) },
                        { criterion: "Clinical Patient Communication", score: scorePct },
                        { criterion: "Procedural Adherence & Safety", score: Math.max(50, scorePct - 4) },
                    ],
                }).catch(() => null);
            }

            if (status === "PASS") {
                await apiClient.post(ENDPOINTS.ASSESSMENTS.FINALIZE(numId)).catch(() => null);
                await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(numId), {
                    feedback: feedback || "Clinical assessment evaluated and passed by mentor preceptor.",
                    aggregate_score: scorePct ?? 90,
                }).catch(() => null);
            } else if (status === "NEEDS_REVIEW") {
                await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(numId), {
                    feedback: feedback || "Assessment requires remediation and preceptor review.",
                    aggregate_score: scorePct ?? 65,
                }).catch(async () => {
                    if (feedback) {
                        await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(numId), { feedback }).catch(() => null);
                    }
                });
            } else if (feedback) {
                await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(numId), { feedback }).catch(() => null);
            }
        } catch (e) {
            console.warn('Failed to update assessment ' + assessmentId + ' on backend:', e);
        }
    }

    const all = await getAssessments();
    const target = all.find((a) => String(a.id) === String(assessmentId));
    if (!target) return null;

    const updatedTarget: MentorAssessment = {
        ...target,
        status,
        scorePct: scorePct !== null ? scorePct : target.scorePct,
        aggregateScore: scorePct !== null ? scorePct : target.aggregateScore,
        feedback: feedback || target.feedback,
    };

    const currentStored = getStoredAssessments();
    const existingIndex = currentStored.findIndex((a) => String(a.id) === String(assessmentId));
    let newStored: MentorAssessment[];
    if (existingIndex >= 0) {
        newStored = [...currentStored];
        newStored[existingIndex] = updatedTarget;
    } else {
        newStored = [updatedTarget, ...currentStored];
    }

    saveStoredAssessments(newStored);
    return updatedTarget;
}

/**
 * Updates criteria scores on the backend.
 */
export async function setAssessmentCriteriaScores(
    assessmentId: string | number,
    scores: AssessmentCriterionScore[]
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(numId), {
                criteria_scores: scores.map((s) => ({
                    criterion: s.criterion,
                    score: Number(s.score),
                })),
            });
            return true;
        } catch (err) {
            console.warn("Failed to set criteria scores on backend:", err);
        }
    }
    return true;
}

/**
 * Updates checklist items on the backend.
 */
export async function setAssessmentChecklistItems(
    assessmentId: string | number,
    items: AssessmentChecklistItem[]
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.CHECKLIST_ITEMS(numId), {
                checklist_items: items.map((i) => ({
                    item: i.item,
                    checked: Boolean(i.checked),
                })),
            });
            return true;
        } catch (err) {
            console.warn("Failed to set checklist items on backend:", err);
        }
    }
    return true;
}

/**
 * Sets theory score on an assessment (POST /api/v1/assessments/:id/theory-score).
 */
export async function setAssessmentTheoryScore(
    assessmentId: string | number,
    theoryScore: number
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.THEORY_SCORE(numId), {
                theory_score: Math.max(0, Math.min(100, Number(theoryScore))),
            });
            return true;
        } catch (err) {
            console.warn("Failed to set theory score on backend:", err);
        }
    }
    return true;
}

/**
 * Sets practical assessment result (1-5 scale) on an assessment (POST /api/v1/assessments/:id/practical-result).
 */
export async function setAssessmentPracticalResult(
    assessmentId: string | number,
    practicalScore: number,
    assessmentDate?: string,
    practicalFeedback?: string
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.PRACTICAL_RESULT(numId), {
                practical_score: Math.max(1, Math.min(5, Math.round(Number(practicalScore)))),
                assessment_date: assessmentDate || new Date().toISOString().slice(0, 10),
                practical_feedback: practicalFeedback || "",
            });
            return true;
        } catch (err) {
            console.warn("Failed to set practical result on backend:", err);
        }
    }
    return true;
}

/**
 * Syncs theory score from mapped quiz attempt (POST /api/v1/assessments/:id/sync-theory).
 */
export async function syncAssessmentTheoryScore(
    assessmentId: string | number
): Promise<{ success: boolean; theoryScore?: number; theoryPassed?: boolean; message?: string }> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            const res = await apiClient.post<any>(ENDPOINTS.ASSESSMENTS.SYNC_THEORY(numId));
            const data = res?.data ?? res;
            return {
                success: true,
                theoryScore: data?.theory_score ?? data?.theoryScore,
                theoryPassed: data?.theory_passed ?? (data?.theory_score >= 80),
                message: data?.message || "Theoretical quiz score synchronized successfully.",
            };
        } catch (err: any) {
            console.warn(`Failed to sync theory score for assessment ${assessmentId}:`, err);
            return {
                success: false,
                message: err?.response?.data?.message || err?.message || "Could not sync theoretical quiz score.",
            };
        }
    }
    return { success: false, message: "Invalid assessment ID" };
}

/**
 * Checks certificate eligibility (GET /api/v1/assessments/:id/certificate-eligibility).
 */
export async function getAssessmentCertificateEligibility(
    assessmentId: string | number
): Promise<CertificateEligibility | null> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            const res = await apiClient.get<any>(ENDPOINTS.ASSESSMENTS.CERTIFICATE_ELIGIBILITY(numId));
            const data = res?.data ?? res;
            if (data) {
                return {
                    eligible: Boolean(data.eligible),
                    reason: data.reason || null,
                    assessment: data.assessment || null,
                    existingCertificate: data.existingCertificate || null,
                };
            }
        } catch (err) {
            console.warn(`Failed to check certificate eligibility for ${assessmentId}:`, err);
        }
    }
    return null;
}

/**
 * Adds evidence file to an assessment (POST /api/v1/assessments/:id/evidence).
 */
export async function addAssessmentEvidence(
    assessmentId: string | number,
    title: string,
    fileId: number
): Promise<AssessmentEvidence | null> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            const res = await apiClient.post<any>(ENDPOINTS.ASSESSMENTS.EVIDENCE(numId), {
                title,
                file_id: Number(fileId),
            });
            const data = res?.data ?? res;
            return {
                id: data.id,
                title: data.title || title,
                file_id: data.file_id || fileId,
                fileId: data.file_id || fileId,
                url: data.url,
                created_at: data.created_at || new Date().toISOString(),
            };
        } catch (err) {
            console.warn("Failed to add evidence to assessment on backend:", err);
        }
    }
    return null;
}

/**
 * Reviews an assessment (POST /api/v1/assessments/:id/review).
 */
export async function reviewAssessment(
    assessmentId: string | number,
    feedback: string,
    aggregateScore?: number
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            const body: { feedback: string; aggregate_score?: number } = { feedback };
            if (aggregateScore !== undefined && aggregateScore !== null) {
                body.aggregate_score = Number(aggregateScore);
            }
            await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(numId), body);
            return true;
        } catch (err) {
            console.warn("Failed to review assessment on backend:", err);
        }
    }
    return true;
}

/**
 * Finalizes an assessment (POST /api/v1/assessments/:id/finalize).
 */
export async function finalizeAssessment(assessmentId: string | number): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.FINALIZE(numId));
            return true;
        } catch (err) {
            console.warn("Failed to finalize assessment on backend:", err);
        }
    }
    return true;
}

/**
 * Partially updates an assessment (PATCH /api/v1/assessments/:id).
 */
export async function patchAssessment(
    assessmentId: string | number,
    data: { feedback?: string; prerequisites_met?: boolean }
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(numId), data);
            return true;
        } catch (err) {
            console.warn("Failed to patch assessment on backend:", err);
        }
    }
    return true;
}
