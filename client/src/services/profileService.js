import api from './api';

const profileService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response;
  },

  // Change password
  changePassword: async (data) => {
    const response = await api.post('/profile/change-password', data);
    return response;
  }
};

export default profileService;

