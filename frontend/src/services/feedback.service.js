import apiClient from './apiClient';

const feedbackService = {
    // POST /feedbacks -> Cần Token (User/Admin đều gửi được)
    createFeedback(formData) {
        return apiClient.post('/feedbacks', formData); //
    },

    // GET /feedbacks -> Cần Token + Quyền Admin
    getAllFeedbacks() {
        return apiClient.get('/feedbacks'); //
    },

    // GET /feedbacks/:id -> Cần Token (Xem chi tiết)
    getFeedbackById(id) {
        return apiClient.get(`/feedbacks/${id}`); //[cite: 9]
    },

    // PUT /feedbacks/:id -> Cần Token (Cập nhật)
    updateFeedback(id, data) {
        return apiClient.put(`/feedbacks/${id}`, data); //[cite: 9]
    },

    // DELETE /feedbacks/:id -> Cần Token + Quyền Admin
    deleteFeedback(id) {
        return apiClient.delete(`/feedbacks/${id}`); //[cite: 9]
    }
};

export default feedbackService;