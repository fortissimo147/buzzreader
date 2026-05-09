import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getStatus = () => api.get('/status').then(r => r.data);
export const getKeywords = () => api.get('/keywords').then(r => r.data);
export const addKeyword = (keyword) => api.post('/keywords', { keyword }).then(r => r.data);
export const removeKeyword = (keyword) =>
  api.delete(`/keywords/${encodeURIComponent(keyword)}`).then(r => r.data);
export const getTweets = (params) => api.get('/tweets', { params }).then(r => r.data);
export const getMetrics = (params) => api.get('/metrics', { params }).then(r => r.data);
