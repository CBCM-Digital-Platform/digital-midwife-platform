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
} as const;
