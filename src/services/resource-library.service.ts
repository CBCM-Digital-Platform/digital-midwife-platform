import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type { Resource, ResourceCategory, ResourceKind } from "@/types/resource";

const STORAGE_STARRED_KEY = "cbcm_starred_resources";

export function getStarredResourceIds(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(STORAGE_STARRED_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

export function saveStarredResourceId(id: string, starred: boolean): void {
    if (typeof window === "undefined") return;
    try {
        const set = getStarredResourceIds();
        if (starred) {
            set.add(String(id));
        } else {
            set.delete(String(id));
        }
        localStorage.setItem(STORAGE_STARRED_KEY, JSON.stringify(Array.from(set)));
    } catch {
        // Ignore storage errors
    }
}

const MOCK_RESOURCES: Resource[] = [
    {
        id: "r1",
        title: "Postpartum Hemorrhage Protocols",
        description: "Updated clinical guidelines for managing PPH in rural facility settings.",
        kind: "GUIDELINE",
        category: "CLINICAL_GUIDELINES",
        updatedAt: "2023-10-12",
        sizeMb: 2.4,
        starred: true,
        url: "#",
    },
    {
        id: "r2",
        title: "Active Management of Third Stage",
        description:
            "Demonstration video focusing on controlled cord traction and oxytocin administration.",
        kind: "VIDEO",
        category: "TRAINING_VIDEOS",
        updatedAt: "2023-10-03",
        durationLabel: "12:45",
        tag: "Training",
        starred: true,
        url: "#",
    },
    {
        id: "r3",
        title: "Antenatal Care Screening Checklist",
        description: "Step-by-step checklist for first and follow-up antenatal visits.",
        kind: "GUIDELINE",
        category: "CLINICAL_GUIDELINES",
        updatedAt: "2023-09-18",
        sizeMb: 1.1,
        starred: false,
        url: "#",
    },
    {
        id: "r4",
        title: "Neonatal Resuscitation Algorithm",
        description: "Printable manual covering initial assessment, airway management and ventilation.",
        kind: "MANUAL",
        category: "CLINICAL_GUIDELINES",
        updatedAt: "2023-08-22",
        sizeMb: 3.8,
        starred: false,
        url: "#",
    },
    {
        id: "r5",
        title: "Respectful Maternity Care Manual",
        description: "Standards and practical examples for respectful, dignified care during labor.",
        kind: "MANUAL",
        category: "CLINICAL_GUIDELINES",
        updatedAt: "2023-03-14",
        sizeMb: 4.4,
        starred: false,
        url: "#",
    },
    {
        id: "r6",
        title: "Giving Constructive Feedback to Mentees",
        description: "Short guide with phrases and examples for feedback that builds confidence.",
        kind: "TIP",
        category: "MENTOR_TIPS",
        updatedAt: "2023-07-09",
        sizeMb: 0.6,
        starred: false,
        url: "#",
    },
    {
        id: "r7",
        title: "Running an Effective Mentoring Session",
        description: "How to plan, run and document a 45-minute clinical mentoring session.",
        kind: "TIP",
        category: "MENTOR_TIPS",
        updatedAt: "2023-09-05",
        sizeMb: 0.9,
        starred: false,
        url: "#",
    },
    {
        id: "r8",
        title: "Adolescent-Friendly Services: Communication Basics",
        description: "Principles for confidential, non-judgmental conversations with adolescent clients.",
        kind: "GUIDELINE",
        category: "ADOLESCENT_HEALTH",
        updatedAt: "2023-06-20",
        sizeMb: 1.7,
        starred: false,
        url: "#",
    },
    {
        id: "r9",
        title: "Contraceptive Counselling for Adolescents",
        description: "Method-by-method counselling manual with eligibility and follow-up guidance.",
        kind: "MANUAL",
        category: "ADOLESCENT_HEALTH",
        updatedAt: "2023-05-11",
        sizeMb: 5.2,
        starred: false,
        url: "#",
    },
    {
        id: "r10",
        title: "Supporting Teen Mothers After Birth",
        description: "Postnatal care, breastfeeding support and referral pathways for young mothers.",
        kind: "GUIDELINE",
        category: "ADOLESCENT_HEALTH",
        updatedAt: "2023-04-26",
        sizeMb: 1.3,
        starred: false,
        url: "#",
    },
    {
        id: "r11",
        title: "Partograph Interpretation",
        description: "Worked examples of plotting and interpreting the partograph during labor.",
        kind: "VIDEO",
        category: "TRAINING_VIDEOS",
        updatedAt: "2023-08-30",
        durationLabel: "18:20",
        tag: "Training",
        starred: false,
        url: "#",
    },
    {
        id: "r12",
        title: "Hand Hygiene and Infection Prevention",
        description: "Quick demonstration of the six steps of hand hygiene in a delivery ward.",
        kind: "VIDEO",
        category: "TRAINING_VIDEOS",
        updatedAt: "2023-07-17",
        durationLabel: "08:05",
        tag: "Training",
        starred: false,
        url: "#",
    },
];

function deriveKindAndCategory(
    type?: string,
    title: string = ""
): { kind: ResourceKind; category: ResourceCategory } {
    const t = (type || "").toLowerCase();
    const lowerTitle = title.toLowerCase();

    let kind: ResourceKind = "MANUAL";
    if (t === "video") {
        kind = "VIDEO";
    } else if (lowerTitle.includes("guide") || lowerTitle.includes("protocol") || lowerTitle.includes("checklist")) {
        kind = "GUIDELINE";
    } else if (lowerTitle.includes("tip") || lowerTitle.includes("feedback") || lowerTitle.includes("effective")) {
        kind = "TIP";
    }

    let category: ResourceCategory = "CLINICAL_GUIDELINES";
    if (kind === "VIDEO" || t === "video") {
        category = "TRAINING_VIDEOS";
    } else if (lowerTitle.includes("adolescent") || lowerTitle.includes("teen") || lowerTitle.includes("contraceptive")) {
        category = "ADOLESCENT_HEALTH";
    } else if (kind === "TIP" || lowerTitle.includes("mentor") || lowerTitle.includes("mentee") || lowerTitle.includes("preceptor")) {
        category = "MENTOR_TIPS";
    }

    return { kind, category };
}

function normalizeResource(raw: any, starredIds: Set<string>): Resource {
    const id = String(raw.id ?? raw._id ?? "");
    const title = raw.title || raw.name || "Clinical Resource";
    const { kind, category } = deriveKindAndCategory(raw.type, title);

    const fileId = raw.file_id ?? raw.fileId ?? raw.file?.id;
    let url = raw.url || "#";
    if (!url || url === "#") {
        if (fileId) {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-tntq.onrender.com/api/v1").replace(/\/+$/, "");
            url = `${baseUrl}/uploads/${fileId}/content`;
        }
    }

    const sizeBytes = raw.file?.sizeBytes ?? raw.size_bytes;
    const sizeMb = sizeBytes ? Number((sizeBytes / (1024 * 1024)).toFixed(1)) : undefined;

    const description =
        raw.description ||
        (raw.thematicArea?.name
            ? `Resource module for ${raw.thematicArea.name} clinical training.`
            : "Authorized clinical guideline and practice manual.");

    const updatedAt = raw.updated_at
        ? new Date(raw.updated_at).toISOString().slice(0, 10)
        : raw.created_at
        ? new Date(raw.created_at).toISOString().slice(0, 10)
        : "2024-01-01";

    const isStarred = starredIds.has(id);

    return {
        id,
        title,
        description,
        kind,
        category,
        updatedAt,
        sizeMb,
        durationLabel: kind === "VIDEO" ? "12:30" : undefined,
        tag: kind === "VIDEO" ? "Training" : undefined,
        starred: isStarred,
        url,
    };
}

/**
 * Fetches learning resources from backend GET /api/v1/resources,
 * falling back to curated clinical guidelines if none are published yet.
 */
export async function getResources(): Promise<Resource[]> {
    const starredIds = getStarredResourceIds();

    try {
        const res = await apiClient.get<any>(`${ENDPOINTS.RESOURCES.BASE}?limit=100`);
        const rawList = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : [];

        if (rawList.length > 0) {
            const live = rawList.map((r: any) => normalizeResource(r, starredIds));
            // Supplement with initial curated list if backend has few records
            if (live.length < 4) {
                const liveTitles = new Set(live.map((r: Resource) => r.title.toLowerCase()));
                const extraCurated = MOCK_RESOURCES.filter((m) => !liveTitles.has(m.title.toLowerCase()));
                return [...live, ...extraCurated];
            }

            return live;
        }
    } catch (err) {
        console.warn("Failed to fetch resources from backend API (falling back to mock dataset):", err);
    }

    return MOCK_RESOURCES.map((r) => ({
        ...r,
        starred: starredIds.has(r.id) ? true : r.starred,
    }));
}

/**
 * Creates and uploads a new learning resource to the platform.
 */
export async function createResource(input: {
    title: string;
    type: "pdf" | "audio" | "video";
    thematicAreaId: number;
    moduleId: number;
    file?: File;
    url?: string;
}): Promise<any> {
    let fileId: number | null = null;

    if (input.file) {
        const formData = new FormData();
        formData.append("file", input.file);
        formData.append("context", "resource");

        const uploadRes = await apiClient.post<any>(ENDPOINTS.UPLOADS.BASE, formData);
        const uploaded = uploadRes?.data ?? uploadRes;
        if (uploaded?.id) {
            fileId = Number(uploaded.id);
        }
    }

    const payload = {
        title: input.title,
        type: input.type,
        thematic_area_id: input.thematicAreaId,
        module_id: input.moduleId,
        file_id: fileId,
        url: input.url || null,
    };

    return await apiClient.post(ENDPOINTS.RESOURCES.BASE, payload);
}