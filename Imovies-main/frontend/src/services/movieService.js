import api from './api'

export const getMovies = async (params = {}) => (await api.get('/movies', { params })).data
export const getMovie = async (id) => (await api.get(`/movies/${id}`)).data.data
export const createMovie = async (payload) => (await api.post('/movies', payload)).data.data
export const updateMovie = async (id, payload) => (await api.put(`/movies/${id}`, payload)).data.data
export const deleteMovie = async (id) => (await api.delete(`/movies/${id}`)).data
