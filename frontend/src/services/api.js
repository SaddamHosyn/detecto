import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const detectPeople = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/detect`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/history`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resetHistory = async () => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/reset`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
