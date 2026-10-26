export type ResourceKind = "GUIDELINE" | "MANUAL" | "TIP" | "VIDEO";

export type ResourceCategory =
    | "CLINICAL_GUIDELINES"
    | "MENTOR_TIPS"
    | "ADOLESCENT_HEALTH"
    | "TRAINING_VIDEOS";

export interface Resource {
    id: string;
    title: string;
    description: string;
    kind: ResourceKind;
    category: ResourceCategory;
    updatedAt: string; // ISO date
    sizeMb?: number; // documents
    durationLabel?: string; // videos, e.g. "12:45"
    tag?: string; // videos, e.g. "Training"
    starred: boolean;
    url: string; // "#" until the backend provides a file or video link
}