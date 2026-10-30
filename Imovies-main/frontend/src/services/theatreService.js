import api from './api'

export const getTheatres = async () => (await api.get('/theatres')).data.data
export const getTheatre = async (id) => (await api.get(`/theatres/${id}`)).data.data
export const createTheatre = async (payload) => (await api.post('/theatres', payload)).data.data
export const updateTheatre = async (id, payload) => (await api.put(`/theatres/${id}`, payload)).data.data
export const deleteTheatre = async (id) => (await api.delete(`/theatres/${id}`)).data
export const createShow = async (payload) => (await api.post('/shows', payload)).data.data
export const updateShow = async (id, payload) => (await api.put(`/shows/${id}`, payload)).data.data
export const deleteShow = async (id) => (await api.delete(`/shows/${id}`)).data
