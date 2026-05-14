import api from './client'

export const listReviews = (params) =>
  api.get('/reviews/', { params })

export const createReview = (data) =>
  api.post('/reviews/', data)

export const updateReview = (id, data) =>
  api.patch(`/reviews/${id}/`, data)

export const deleteReview = (id) =>
  api.delete(`/reviews/${id}/`)

export const hideReview = (id) =>
  api.post(`/reviews/${id}/hide/`)
