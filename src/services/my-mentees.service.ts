import type { CompetencyLevel, MyMentee } from "@/types/my-mentee";

const FIRST_THREE: MyMentee[] = [
    {
        id: "m1",
        code: "M-8492",
        name: "Bilen Alemu",
        facility: "Maternity Ward A",
        level: "ADVANCED",
        lastSession: "2023-10-24",
        overdue: false,
        avatarUrl: null,
    },
    {
        id: "m2",
        code: "M-9103",
        name: "Sara Abebe",
        facility: "Clinic North",
        level: "NOVICE",
        lastSession: "2023-11-02",
        overdue: false,
        avatarUrl: null,
    },
    {
        id: "m3",
        code: "M-7321",
        name: "Maritu Taye",
        facility: "Maternity Ward A",
        level: "QUALIFIED",
        lastSession: "2023-09-15",
        overdue: true,
        avatarUrl: null,
    },
];

const EXTRA_NAMES = [
    "Hanna Tesfaye",
    "Selam Bekele",
    "Meron Girma",
    "Rahel Haile",
    "Tigist Alemu",
    "Abeba Kebede",
    "Liya Worku",
    "Eden Mulugeta",
    "Saron Desta",
    "Helen Assefa",
    "Bethlehem Tadesse",
    "Mekdes Negash",
    "Genet Wolde",
    "Aster Demissie",
    "Sosina Tilahun",
    "Yodit Mengistu",
    "Zenebech Lemma",
    "Almaz Birhanu",
    "Tsion Gebre",
    "Rediet Abate",
    "Kalkidan Fikre",
];

const FACILITIES = ["Maternity Ward A", "Clinic North", "Maternity Ward B", "Outpatient Clinic"];
const LEVELS: CompetencyLevel[] = ["NOVICE", "QUALIFIED", "ADVANCED"];

// Pads the list to 24 mentees so pagination and filters can be tested
const EXTRA: MyMentee[] = EXTRA_NAMES.map((name, i) => ({
    id: `m${i + 4}`,
    code: `M-${String(2000 + i * 337).padStart(4, "0")}`,
    name,
    facility: FACILITIES[i % FACILITIES.length],
    level: LEVELS[i % LEVELS.length],
    lastSession: new Date(Date.UTC(2023, 9, 1 + (i % 28))).toISOString().slice(0, 10),
    overdue: i % 5 === 0,
    avatarUrl: null,
}));

const MOCK_MENTEES: MyMentee[] = [...FIRST_THREE, ...EXTRA];

// TODO: replace with a fetch to the backend (mentees assigned to the logged-in mentor)
export async function getMyMentees(): Promise<MyMentee[]> {
    return MOCK_MENTEES;
}