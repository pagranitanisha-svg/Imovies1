import api from './api'

export const getShows = async (params = {}) => (await api.get('/shows', { params })).data.data
export const getShow = async (id) => (await api.get(`/shows/${id}`)).data.data
export const getSeats = async (id) => (await api.get(`/shows/${id}/seats`)).data.data
export const createBooking = async (payload) => (await api.post('/bookings', payload)).data.data
export const getBooking = async (id) => (await api.get(`/bookings/${id}`)).data.data
export const getMyBookings = async () => (await api.get('/bookings/my-bookings')).data.data
export const cancelBooking = async (id) => (await api.patch(`/bookings/${id}/cancel`)).data.data
export const getAllBookings = async () => (await api.get('/bookings')).data.data
