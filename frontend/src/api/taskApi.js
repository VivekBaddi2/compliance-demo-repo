// src/api/tasksApi.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const createTask = (payload) => axios.post(`${API_BASE}/api/tasks`, payload);
export const getTasks = (adminId) =>
    axios.get(`${API_BASE}/api/tasks`, { params: { adminId } });
export const updateTask = (id, payload) =>
    axios.put(`${API_BASE}/api/tasks/${id}`, payload);
export const deleteTask = (id) => axios.delete(`${API_BASE}/api/tasks/${id}`);
export const sendTaskNow = (id) => axios.post(`${API_BASE}/api/tasks/${id}/send`);