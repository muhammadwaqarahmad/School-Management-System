/**
 * STUDENT SERVICE
 * ===============
 * Handles all student-related API calls (CRUD operations)
 */

import API from './api';

const studentService = {
  // Get all students
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/students${queryString ? `?${queryString}` : ''}`);
  },

  // Get single student by ID
  getById: async (id) => {
    return await API.get(`/students/${id}`);
  },

  // Create new student
  create: async (studentData) => {
    return await API.post('/students', studentData);
  },

  // Update student
  update: async (id, studentData) => {
    return await API.put(`/students/${id}`, studentData);
  },

  // Delete student
  delete: async (id) => {
    return await API.delete(`/students/${id}`);
  },

  // Search students by registration number, roll number, name, or NIC
  search: async (query) => {
    return await API.get(`/students/search?query=${encodeURIComponent(query)}`);
  },

  // Change student status (Promote to Alumni / Mark as Dropped)
  changeStatus: async (id, status, description, actionDate) => {
    return await API.patch(`/students/${id}/status`, { status, description, actionDate });
  },

  // Get alumni (GRADUATED/DROPPED students)
  getAlumni: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/students/alumni${queryString ? `?${queryString}` : ''}`);
  },
};

export default studentService;

