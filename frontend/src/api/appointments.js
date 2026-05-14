import api from './client'

export const listAppointments = (params) =>
  api.get('/appointments/', { params })

export const getAppointment = (id) =>
  api.get(`/appointments/${id}/`)

export const createAppointment = (data) =>
  api.post('/appointments/', data)

export const updateAppointment = (id, data) =>
  api.patch(`/appointments/${id}/`, data)

export const claimAppointment = (id) =>
  api.post(`/appointments/${id}/claim/`)

export const respondAppointment = (id, data) =>
  api.post(`/appointments/${id}/respond/`, data)

export const requestIncomplete = (id, data) =>
  api.post(`/appointments/${id}/request_incomplete/`, data)

export const confirmAppointment = (id) =>
  api.post(`/appointments/${id}/confirm/`)

export const rejectAppointment = (id) =>
  api.post(`/appointments/${id}/reject/`)

export const cancelAppointment = (id) =>
  api.post(`/appointments/${id}/cancel/`)

export const completeAppointment = (id) =>
  api.post(`/appointments/${id}/complete/`)

export const followUpAppointment = (id, data) =>
  api.post(`/appointments/${id}/follow_up/`, data)
