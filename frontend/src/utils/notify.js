import { toast } from 'react-toastify';

export const showSuccess = (message = 'Thành công') => toast.success(message);
export const showError = (message = 'Đã xảy ra lỗi') => toast.error(message);
export const showInfo = (message = 'Thông tin') => toast.info(message);

export default {
  showSuccess,
  showError,
  showInfo,
};
