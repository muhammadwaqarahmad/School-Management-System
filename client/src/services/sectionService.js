import API from './api';

const sectionService = {
  getByClass: async (classId) => {
    return await API.get(`/sections/class/${classId}`);
  },
  getById: async (id) => {
    return await API.get(`/sections/${id}`);
  },
  create: async (classId, sectionData) => {
    return await API.post(`/sections/class/${classId}`, sectionData);
  },
  update: async (id, sectionData) => {
    return await API.put(`/sections/${id}`, sectionData);
  },
  delete: async (id) => {
    return await API.delete(`/sections/${id}`);
  },
};

export default sectionService;

