import api from './client'

export const initiatePayment = (amount) =>
  api.post('/payments/initiate/', { amount })

export const getPaymentHistory = (params) =>
  api.get('/payments/history/', { params })
