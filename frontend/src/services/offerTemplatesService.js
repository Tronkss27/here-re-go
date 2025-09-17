import apiClient from './apiClient';

const base = '/offer-templates';

const offerTemplatesService = {
  async list({ q = '', onlyActive = true } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('onlyActive', String(onlyActive));
    const res = await apiClient.get(`${base}?${params.toString()}`);
    return res.data?.data || [];
  },

  async create(payload) {
    const res = await apiClient.post(base, payload);
    return res.data?.data;
  },

  async update(id, payload) {
    const res = await apiClient.put(`${base}/${id}`, payload);
    return res.data?.data;
  },

  async remove(id) {
    await apiClient.delete(`${base}/${id}`);
    return true;
  }
};

export default offerTemplatesService;


