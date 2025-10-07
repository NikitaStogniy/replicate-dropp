import toast from 'react-hot-toast';

/**
 * Show success toast notification
 */
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
  });
};

/**
 * Show error toast notification
 */
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
  });
};

/**
 * Show info toast notification
 */
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 4000,
  });
};

/**
 * Show loading toast notification
 * Returns toast ID that can be used to dismiss it
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * Dismiss a specific toast by ID
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Update an existing toast
 */
export const updateToast = (toastId: string, message: string, type: 'success' | 'error') => {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else {
    toast.error(message, { id: toastId });
  }
};

/**
 * Show promise toast - automatically handles loading, success, and error states
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages);
};
