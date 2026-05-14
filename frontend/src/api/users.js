import api from './client'

export const listUsers = (params) =>
  api.get('/auth/', { params })

export const getUser = (id) =>
  api.get(`/auth/${id}/`)

export const updateUser = (id, data) =>
  api.patch(`/auth/${id}/`, data)

export const deactivateUser = (id) =>
  api.delete(`/auth/${id}/`)

export const setUserPassword = (id, newPassword) =>
  api.post(`/auth/${id}/set_password/`, { new_password: newPassword })

export const getAdminStats = () =>
  api.get('/auth/admin/')
