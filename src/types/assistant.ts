export type SuggestionIcon = "ctg" | "neonatal" | "medication" | "literature";

export interface Suggestion {
    id: string;
    title: string;
    subtitle: string;
    icon: SuggestionIcon;
}

export interface AssistantSource {
    title: string;
    url: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    attachments?: string[]; // names of the files the user attached
    sources?: AssistantSource[];
}

export interface AssistantReply {
    content: string;
    sources: AssistantSource[];
}

export interface AssistantData {
    suggestions: Suggestion[];
    recentQueries: string[];
}