// src/api/tasksApi.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const createTask = (payload) => axios.post(`${API_BASE}/tasks`, payload);
export const getTasks = (adminId) =>
    axios.get(`${API_BASE}/tasks`, { params: { adminId } });
export const updateTask = (id, payload) =>
    axios.put(`${API_BASE}/tasks/${id}`, payload);
export const deleteTask = (id) => axios.delete(`${API_BASE}/tasks/${id}`);
export const sendTaskNow = (id) => axios.post(`${API_BASE}/tasks/${id}/send`);