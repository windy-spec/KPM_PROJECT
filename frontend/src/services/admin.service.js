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

  getMaterialTypes() {
    return apiClient.get('/material-types');
  },

  getMaterialUnits() {
    return apiClient.get('/material-units');
  },

  createMaterial(data) {
    return apiClient.post('/materials', data);
  },

  updateMaterial(id, data) {
    return apiClient.put(`/materials/${id}`, data);
  },

  deleteMaterial(id) {
    return apiClient.delete(`/materials/${id}`);
  },

  /* Material Types Additions */
  createMaterialType(data) {
    return apiClient.post('/material-types', data);
  },
  updateMaterialType(id, data) {
    return apiClient.put(`/material-types/${id}`, data);
  },
  deleteMaterialType(id) {
    return apiClient.delete(`/material-types/${id}`);
  },

  /* Material Units Additions */
  createMaterialUnit(data) {
    return apiClient.post('/material-units', data);
  },
  updateMaterialUnit(id, data) {
    return apiClient.put(`/material-units/${id}`, data);
  },
  deleteMaterialUnit(id) {
    return apiClient.delete(`/material-units/${id}`);
  },

  getCategories(params) {
    return apiClient.get('/categories', { params });
  },

  /* Material thickness (settings) */
  getMaterialThickness(params) {
    return apiClient.get('/material-thickness', { params });
  },

  createMaterialThickness(data) {
    return apiClient.post('/material-thickness', data);
  },

  updateMaterialThickness(id, data) {
    return apiClient.put(`/material-thickness/${id}`, data);
  },

  deleteMaterialThickness(id) {
    return apiClient.delete(`/material-thickness/${id}`);
  },

  /* Paint types (settings) */
  getPaintTypes(params) {
    return apiClient.get('/paint-types', { params });
  },

  /* Quotations */
  calculateQuotation(payload) {
    // payload: { items: [...] }
    return apiClient.post('/quotations/calculate', payload);
  },
  /* Quotations management */
  getQuotations(params) {
    return apiClient.get('/quotations', { params });
  },

  getQuotation(id) {
    return apiClient.get(`/quotations/${id}`);
  },

  updateQuotationStatus(id, data) {
    return apiClient.put(`/quotations/${id}/status`, data);
  },

  createQuotationAttachment(id, data) {
    return apiClient.post(`/quotations/${id}/attachments`, data);
  },

  createPaintType(data) {
    return apiClient.post('/paint-types', data);
  },

  updatePaintType(id, data) {
    return apiClient.put(`/paint-types/${id}`, data);
  },

  deletePaintType(id) {
    return apiClient.delete(`/paint-types/${id}`);
  },

  /* Labor pricing (categories, models, rates) */
  getLaborCategories() {
    return apiClient.get('/labor/categories');
  },

  createLaborCategory(data) {
    return apiClient.post('/labor/categories', data);
  },

  deleteLaborCategory(id) {
    return apiClient.delete(`/labor/categories/${id}`);
  },

  getLaborModels() {
    return apiClient.get('/labor/models');
  },

  createLaborModel(data) {
    return apiClient.post('/labor/models', data);
  },

  deleteLaborModel(id) {
    return apiClient.delete(`/labor/models/${id}`);
  },

  getLaborRates() {
    return apiClient.get('/labor/rates');
  },

  // setRate is upsert: body should contain { category_id, model_id, price }
  setLaborRate(data) {
    return apiClient.post('/labor/rates', data);
  },

  deleteLaborRate(id) {
    return apiClient.delete(`/labor/rates/${id}`);
  },

  getAccessLogs() {
    return apiClient.get('/auth/admin/access-logs');
  },
  createProduct(data) {
    return apiClient.post('/products', data);
  },
  
  // Drawings Management
  createDrawing(data) {
    return apiClient.post('/drawings', data);
  },
  getDrawingsByProduct(productId) {
    return apiClient.get(`/drawings/product/${productId}`);
  },

  updateProduct(id, data) {
    return apiClient.put(`/products/${id}`, data);
  },

  deleteProduct(id) {
    return apiClient.delete(`/products/${id}`);
  },

  uploadProductImage(id, imageFile, isPrimary = true) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('isPrimary', String(isPrimary));

    return apiClient.post(`/products/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteProductImage(id, imageId) {
    return apiClient.delete(`/products/${id}/images/${imageId}`);
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
      params: { t: Date.now() },
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

  getImportBatch(batchId) {
    return apiClient.get(`/imports/batch/${batchId}`);
  },

  rejectImportBatch(batchId) {
    return apiClient.post(`/imports/batch/${batchId}/reject`);
  },

  approveImportBatch(batchId) {
    return apiClient.post(`/imports/batch/${batchId}/approve`);
  },

  exportInvalidImportRows(batchId) {
    return apiClient.get(`/imports/batch/${batchId}/export-errors`, {
      responseType: 'blob',
    });
  },
  getImportBatches(params) {
    return apiClient.get('/imports/batches', { params });
  },

  getImportBatchDetails(batchId) {
    return apiClient.get(`/imports/batch/${batchId}`);
  },

  deleteImportBatch(batchId) {
    return apiClient.delete(`/imports/batch/${batchId}`);
  },
  
  exportInvalidBatchErrors(batchId) {
    return apiClient.get(`/imports/batch/${batchId}/export-errors`, {
      responseType: 'blob'
    });
  },

  getUsersForAdmin(params) {
    return apiClient.get('/auth/admin/users', { params });
  },

  adminUpdateUser(id, data) {
    return apiClient.put(`/auth/admin/users/${id}`, data);
  },

  getUsersAccessLogs() {
    return apiClient.get('/auth/admin/access-logs');
  },

  getDashboardStats() {
    return apiClient.get('/admin/dashboard/stats');
  },

  /* Component Templates */
  getComponentTemplates(params) {
    return apiClient.get('/component-templates', { params });
  },

  createComponentTemplate(data) {
    return apiClient.post('/component-templates', data);
  },

  updateComponentTemplate(id, data) {
    return apiClient.put(`/component-templates/${id}`, data);
  },

  deleteComponentTemplate(id) {
    return apiClient.delete(`/component-templates/${id}`);
  }
};

export default adminService;
