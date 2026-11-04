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
    THEORY_SCORE: (id: string | number) => `/api/v1/assessments/${id}/theory-score`,
    CHECKLIST_ITEMS: (id: string | number) => `/api/v1/assessments/${id}/checklist-items`,
    EVIDENCE: (id: string | number) => `/api/v1/assessments/${id}/evidence`,
    PRACTICAL_RESULT: (id: string | number) => `/api/v1/assessments/${id}/practical-result`,
    SYNC_THEORY: (id: string | number) => `/api/v1/assessments/${id}/sync-theory`,
    SYNC_CRITERIA: (id: string | number) => `/api/v1/assessments/${id}/sync-criteria`,
    CERTIFICATE_ELIGIBILITY: (id: string | number) => `/api/v1/assessments/${id}/certificate-eligibility`,
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
    CONTENT: (id: string | number) => `/api/v1/resources/${id}/content`,
    ASSIGN_MENTEE: (resourceId: string | number, menteeId: string | number) =>
      `/api/v1/resources/${resourceId}/mentees/${menteeId}`,
    REVOKE_MENTEE: (resourceId: string | number, menteeId: string | number) =>
      `/api/v1/resources/${resourceId}/mentees/${menteeId}`,
    GRANT_MENTOR: (id: string | number) => `/api/v1/resources/${id}`,
  },
  HIERARCHICAL_RESOURCES: {
    BASE: "/api/v1/resources",
    DETAIL: (id: string | number) => `/api/v1/resources/${id}`,
    GRANT_FACILITIES: (id: string | number) => `/api/v1/resources/${id}`,
    GRANT_MENTOR: (id: string | number) => `/api/v1/resources/${id}`,
    ASSIGN_MENTEE: (id: string | number) => `/api/v1/resources/${id}`,
    CONTENT: (id: string | number) => `/api/v1/resources/${id}/content`,
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
  LEARNING: {
    BASE: "/api/v1/learning/modules",
    DETAIL: (id: string | number) => `/api/v1/learning/modules/${id}`,
    CONTENTS: (moduleId: string | number) => `/api/v1/learning/modules/${moduleId}/contents`,
    CONTENT_DETAIL: (moduleId: string | number, contentId: string | number) =>
      `/api/v1/learning/modules/${moduleId}/contents/${contentId}`,
    // Live Swagger endpoint: POST/GET /api/v1/learning/modules/{moduleId}/mentor-permissions
    MENTOR_PERMISSIONS: (moduleId: string | number) => `/api/v1/learning/modules/${moduleId}/mentor-permissions`,
    MENTOR_PERMISSIONS_REVOKE: (moduleId: string | number, mentorId: string | number) =>
      `/api/v1/learning/modules/${moduleId}/mentor-permissions/${mentorId}`,
    // Backward compatibility aliases pointing to the live mentor-permissions endpoint
    MENTOR_ACCESS: (moduleId: string | number) => `/api/v1/learning/modules/${moduleId}/mentor-permissions`,
    MENTOR_ACCESS_REVOKE: (moduleId: string | number, mentorId: string | number) =>
      `/api/v1/learning/modules/${moduleId}/mentor-permissions/${mentorId}`,
    // Mentee module and resource endpoints
    MY_MODULES: "/api/v1/learning/my/modules",
    MY_MODULE_DETAIL: (moduleId: string | number) => `/api/v1/learning/my/modules/${moduleId}`,
    MY_MODULE_PROGRESS: (moduleId: string | number) => `/api/v1/learning/my/modules/${moduleId}/progress`,
    MY_MODULE_CONTENTS_PROGRESS: (moduleId: string | number) =>
      `/api/v1/learning/my/modules/${moduleId}/contents/progress`,
    MY_MODULE_CONTENT_COMPLETE: (moduleId: string | number, contentId: string | number) =>
      `/api/v1/learning/my/modules/${moduleId}/contents/${contentId}/complete`,
    MY_MODULE_CONFIRM_COMPLETION: (moduleId: string | number) =>
      `/api/v1/learning/my/modules/${moduleId}/confirm-completion`,
    RESOURCES_BY_MODULE: (moduleId: string | number) => `/api/v1/resources?module_id=${moduleId}`,
    RESOURCE_ASSIGNMENT: (moduleId: string | number, resourceId: string | number) =>
      `/api/v1/learning/modules/${moduleId}/resources/${resourceId}/assignments`,
    REVOKE_RESOURCE_ASSIGNMENT: (assignmentId: string | number) =>
      `/api/v1/learning/resource-assignments/${assignmentId}/revoke`,
    MENTEE_MODULES: (menteeId: string | number) => `/api/v1/learning/mentees/${menteeId}/modules`,
    MENTEE_RESOURCES: (menteeId: string | number) => `/api/v1/learning/mentees/${menteeId}/resources`,
    MY_RESOURCES: "/api/v1/learning/my/resources",
    MY_RESOURCE_DETAIL: (resourceId: string | number) => `/api/v1/learning/my/resources/${resourceId}`,
    MY_RESOURCE_CONTENT: (resourceId: string | number) => `/api/v1/learning/my/resources/${resourceId}/content`,
    MY_RESOURCE_COMPLETE: (resourceId: string | number) => `/api/v1/learning/my/resources/${resourceId}/complete`,
    QUIZZES: (moduleId: string | number) => `/api/v1/learning/modules/${moduleId}/quizzes`,
    QUIZ_DETAIL: (quizId: string | number) => `/api/v1/learning/quizzes/${quizId}`,
  },
} as const;
