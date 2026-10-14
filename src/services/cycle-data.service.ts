import type { Cycle } from "@/types/cycle";
import type { CreateCycleInput, Facility } from "@/types/newCycle";

const MOCK_CYCLES: Cycle[] = [
    {
        id: "1",
        name: "Q1 2024 Clinical Refresh",
        status: "ACTIVE",
        startDate: "2024-01-15",
        endDate: "2024-04-15",
        facilities: 12,
        mentors: 24,
        mentees: 84,
        progress: 65,
        assignmentsLinked: 84,
        averageScore: 78,
        milestones: [
            { id: "m1", title: "Mid-term Assessments Released", when: "2 days ago", done: true },
            { id: "m2", title: "Facility Visits Completed (Region A)", when: "1 week ago", done: true },
            { id: "m3", title: "Cycle Kick-off Meeting", when: "Jan 15, 2024", done: false },
        ],
    },
    {
        id: "2",
        name: "Q2 2024 Advanced OBGYN",
        status: "PLANNING",
        startDate: "2024-05-01",
        endDate: "2024-08-31",
        facilities: 8,
        mentors: 15,
        mentees: 45,
        progress: 20,
        assignmentsLinked: 0,
        averageScore: 0,
        milestones: [],
    },
    {
        id: "3",
        name: "Q4 2023 Foundation Basics",
        status: "COMPLETED",
        startDate: "2023-09-01",
        endDate: "2023-12-15",
        facilities: 10,
        mentors: 20,
        mentees: 70,
        progress: 100,
        assignmentsLinked: 70,
        averageScore: 82,
        milestones: [],
    },
];

const MOCK_FACILITIES: Facility[] = [
    { id: "f1", name: "Tirunesh Beijing Hospital" },
    { id: "f2", name: "St. Paul's Hospital" },
    { id: "f3", name: "Yekatit 12 Hospital" },
    { id: "f4", name: "Zewditu Memorial Hospital" },
    { id: "f5", name: "Gandhi Memorial Hospital" },
];

// TODO: replace with a fetch to the backend cycles endpoint
export async function getCycles(): Promise<Cycle[]> {
    return MOCK_CYCLES;
}

// TODO: replace with a fetch to the backend facilities endpoint
export async function getFacilities(): Promise<Facility[]> {
    return MOCK_FACILITIES;
}

// TODO: replace with a POST to the backend cycles endpoint
export async function createCycle(input: CreateCycleInput): Promise<{ id: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600)); // fake network delay
    console.log("Create cycle (mock):", input);
    return { id: crypto.randomUUID() };
}