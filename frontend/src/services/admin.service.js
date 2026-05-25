import apiClient from './apiClient';

const adminService = {
  getProducts(params) {
    const mappedParams = {
      page: params?.page,
      limit: params?.limit,
      search: params?.search || params?.q || '',
      category_id: params?.category_id || params?.category || '',
    };

    return apiClient.get('/products', { params: mappedParams });
  },

  getMaterials(params) {
    return apiClient.get('/materials', { params });
  },

  getCategories(params) {
    return apiClient.get('/categories', { params });
  },

  getAccessLogs() {
    return apiClient.get('/auth/admin/access-logs');
  },
  createProduct(data) {
    return apiClient.post('/products', data);
  },

  updateProduct(id, data) {
    return apiClient.put(`/products/${id}`, data);
  },

  deleteProduct(id) {
    return apiClient.delete(`/products/${id}`);
  },

  createCategory(data) {
    return apiClient.post('/categories', data);
  },

  updateCategory(id, data) {
    return apiClient.put(`/categories/${id}`, data);
  },

  deleteCategory(id) {
    return apiClient.delete(`/categories/${id}`);
  },

  downloadImportTemplate() {
    return apiClient.get('/imports/template', {
      responseType: 'blob',
    });
  },

  uploadImportFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/imports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default adminService;
