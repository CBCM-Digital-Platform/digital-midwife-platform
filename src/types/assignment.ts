export type AssignmentStatus = "active" | "pending";

export interface Person {
    id: string;
    name: string;
    /** Job title or training level, e.g. "Chief Attending" or "Resident PGY-2" */
    subtitle: string;
    initials: string;
    /** Optional photo. Falls back to initials when missing. */
    avatarUrl?: string;
}

export interface Assignment {
    id: string;
    mentor: Person & { code: string };
    mentee: Person;
    facility: string;
    thematicDomain: string;
    /** ISO date, e.g. "2024-10-12" */
    assignedDate: string;
    /** Short note under the date, e.g. "1.2 months tenure" or "Starts in 3 days" */
    dateNote: string;
    status: AssignmentStatus;
}

export interface MentorLead {
    id: string;
    name: string;
    initials: string;
    specialty: string;
    /** Current load, e.g. "1/3" */
    load: string;
}

export interface AssignmentStats {
    availableMentors: {
        readyToIntake: number;
        vacant: number;
        balanced: number;
        atLimit: number;
        leads: MentorLead[];
    };
    unassignedMentees: {
        total: number;
        urgent: number;
        waitingOver14Days: number;
        bySpecialty: { label: string; count: number }[];
        nextInQueue: { name: string; specialty: string } | null;
    };
}

export interface AssignmentFiltersState {
    search: string;
    mentorId: string; // "all" or a mentor id
    facility: string; // "all" or a facility name
    domain: string; // "all" or a domain name
    status: "all" | AssignmentStatus;
}

export type AssignmentTab = "all" | "active" | "pending";