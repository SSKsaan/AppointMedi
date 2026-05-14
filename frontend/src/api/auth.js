import api from './client'

export const loginUser = (email, password) =>
  api.post('/auth/token/', { email, password })

export const registerUser = (data) =>
  api.post('/auth/register/', data)

export const refreshToken = (refresh) =>
  api.post('/auth/token/refresh/', { refresh })

export const logoutUser = (refresh) =>
  api.post('/auth/blacklist/', { refresh })

export const getProfile = () =>
  api.get('/auth/profile/')

export const updateProfile = (data) =>
  api.patch('/auth/profile/', data)

export const changePassword = (oldPassword, newPassword) =>
  api.post('/auth/password/change/', { old_password: oldPassword, new_password: newPassword })
