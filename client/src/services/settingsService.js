import api from './api';

const settingsService = {
  // ==================== SESSIONS ====================
  getSessions: async (program) => {
    const response = await api.get(`/settings/sessions${program ? `?program=${encodeURIComponent(program)}` : ''}`);
    // API interceptor already returns response.data, so response is the data object
    // Backend returns: { success: true, data: { sessions: [...] } }
    // After interceptor: { success: true, data: { sessions: [...] } }
    return response;
  },
  createSession: async (data) => {
    const response = await api.post('/settings/sessions', data);
    return response;
  },
  updateSession: async (id, data) => {
    const response = await api.put(`/settings/sessions/${id}`, data);
    return response;
  },
  deleteSession: async (id) => {
    const response = await api.delete(`/settings/sessions/${id}`);
    return response;
  },
  setCurrentSession: async (id) => {
    const response = await api.post(`/settings/sessions/${id}/set-current`);
    return response;
  },

  // ==================== PROGRAMS ====================
  getPrograms: async () => {
    const response = await api.get('/settings/programs');
    return response;
  },
  getProgram: async (id) => {
    const response = await api.get(`/settings/programs/${id}`);
    return response;
  },
  getProgramSessions: async (programId) => {
    const response = await api.get(`/settings/programs/${programId}/sessions`);
    return response;
  },
  createProgram: async (data) => {
    const response = await api.post('/settings/programs', data);
    return response;
  },
  updateProgram: async (id, data) => {
    const response = await api.put(`/settings/programs/${id}`, data);
    return response;
  },
  deleteProgram: async (id) => {
    const response = await api.delete(`/settings/programs/${id}`);
    return response;
  },

  // ==================== FEES ====================
  getFees: async () => {
    const response = await api.get('/settings/fees');
    return response;
  },
  getFee: async (id) => {
    const response = await api.get(`/settings/fees/${id}`);
    return response;
  },
  createFee: async (data) => {
    const response = await api.post('/settings/fees', data);
    return response;
  },
  updateFee: async (id, data) => {
    const response = await api.put(`/settings/fees/${id}`, data);
    return response;
  },
  deleteFee: async (id) => {
    const response = await api.delete(`/settings/fees/${id}`);
    return response;
  },

  // ==================== LEGACY (for backward compatibility) ====================
  getProgramFees: async () => {
    const response = await api.get('/settings/programs');
    return response;
  },
  getProgramFee: async (program) => {
    const response = await api.get(`/settings/programs/${program}/fee`);
    return response;
  },
  createProgramFee: async (data) => {
    const response = await api.post('/settings/programs', data);
    return response;
  },
  updateProgramFee: async (id, data) => {
    const response = await api.put(`/settings/programs/${id}`, data);
    return response;
  },
  deleteProgramFee: async (id) => {
    const response = await api.delete(`/settings/programs/${id}`);
    return response;
  }
};

export default settingsService;

