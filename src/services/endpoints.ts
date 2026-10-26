export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    FORGOT_PASSWORD: "/auth/forgot-password",
    SET_PASSWORD: "/auth/set-password",
  },
  CYCLES: {
    BASE: "/api/v1/mentorship-cycles",
    DETAIL: (id: string | number) => `/api/v1/mentorship-cycles/${id}`,
    STATUS: (id: string | number) => `/api/v1/mentorship-cycles/${id}/status`,
    FACILITIES: (cycleId: string | number) => `/api/v1/mentorship-cycles/${cycleId}/facilities`,
    FACILITY_DETAIL: (cycleId: string | number, facilityId: string | number) =>
      `/api/v1/mentorship-cycles/${cycleId}/facilities/${facilityId}`,
    THEMATIC_AREAS: (cycleId: string | number) => `/api/v1/mentorship-cycles/${cycleId}/thematic-areas`,
    THEMATIC_AREA_DETAIL: (cycleId: string | number, areaId: string | number) =>
      `/api/v1/mentorship-cycles/${cycleId}/thematic-areas/${areaId}`,
  },
  FACILITIES: {
    BASE: "/api/v1/facilities",
    DETAIL: (id: string | number) => `/api/v1/facilities/${id}`,
  },
  ASSESSMENTS: {
    BASE: "/api/v1/assessments",
    DETAIL: (id: string | number) => `/api/v1/assessments/${id}`,
    FINALIZE: (id: string | number) => `/api/v1/assessments/${id}/finalize`,
    REVIEW: (id: string | number) => `/api/v1/assessments/${id}/review`,
    CRITERIA_SCORES: (id: string | number) => `/api/v1/assessments/${id}/criteria-scores`,
    CHECKLIST_ITEMS: (id: string | number) => `/api/v1/assessments/${id}/checklist-items`,
    EVIDENCE: (id: string | number) => `/api/v1/assessments/${id}/evidence`,
  },
  MESSAGES: {
    CONVERSATIONS: "/api/v1/messages/conversations",
    CONVERSATION_DETAIL: (id: string | number) => `/api/v1/messages/conversations/${id}`,
    MESSAGES: (id: string | number) => `/api/v1/messages/conversations/${id}/messages`,
    MESSAGE_DETAIL: (id: string | number, messageId: string | number) =>
      `/api/v1/messages/conversations/${id}/messages/${messageId}`,
    READ: (id: string | number) => `/api/v1/messages/conversations/${id}/read`,
    CONTACTS: "/api/v1/messages/contacts",
  },
  RESOURCES: {
    BASE: "/api/v1/resources",
    DETAIL: (id: string | number) => `/api/v1/resources/${id}`,
  },
  UPLOADS: {
    BASE: "/api/v1/uploads",
    DETAIL: (id: string | number) => `/api/v1/uploads/${id}`,
    CONTENT: (id: string | number) => `/api/v1/uploads/${id}/content`,
  },
  SESSIONS: {
    BASE: "/api/v1/sessions",
    DETAIL: (id: string | number) => `/api/v1/sessions/${id}`,
    AVAILABLE_TIMES: "/api/v1/sessions/available-times",
    STATUS: (id: string | number) => `/api/v1/sessions/${id}/status`,
    NOTES: (id: string | number) => `/api/v1/sessions/${id}/notes`,
    JOIN_TOKEN: (id: string | number) => `/api/v1/sessions/${id}/join-token`,
    PARTICIPANT_JOIN: (id: string | number) => `/api/v1/sessions/${id}/participant-join`,
  },
  ANALYTICS: {
    DASHBOARD: "/api/v1/analytics/dashboard",
    ACTIVITY_SUMMARY: "/api/v1/analytics/activity-summary",
    LEARNING_PROGRESS: "/api/v1/analytics/learning-progress",
  },
  ACTIVITY_LOGS: {
    BASE: "/api/v1/activity-logs",
    DETAIL: (id: string | number) => `/api/v1/activity-logs/${id}`,
  },
  PROGRESS: {
    SUMMARY: "/api/v1/progress/summary",
    TRENDS: "/api/v1/progress/trends",
    KNOWLEDGE_SNAPSHOTS: "/api/v1/progress/knowledge-snapshots",
    MENTEE_SNAPSHOTS: (menteeId: string | number) => `/api/v1/progress/mentees/${menteeId}/knowledge-snapshots`,
    MENTEE_COMPETENCIES: (menteeId: string | number) => `/api/v1/progress/mentees/${menteeId}/competencies`,
  },
  ASSIGNMENTS: {
    BASE: "/api/v1/assignments",
    DETAIL: (id: string | number) => `/api/v1/assignments/${id}`,
    STATUS: (id: string | number) => `/api/v1/assignments/${id}/status`,
    MATCHING: "/api/v1/assignments/matching",
    MENTOR_ASSIGNMENTS: (mentorId: string | number) => `/api/v1/assignments/mentors/${mentorId}/assignments`,
    MENTEE_ASSIGNMENTS: (menteeId: string | number) => `/api/v1/assignments/mentees/${menteeId}/assignments`,
  },
} as const;

