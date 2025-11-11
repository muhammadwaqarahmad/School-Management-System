import api from './api';

const userService = {
  // Get all users
  getUsers: async () => {
    const response = await api.get('/users');
    return response;
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  },

  // Reset user password
  resetUserPassword: async (id, newPassword) => {
    const response = await api.post(`/users/${id}/reset-password`, { newPassword });
    return response;
  },
};

export default userService;

