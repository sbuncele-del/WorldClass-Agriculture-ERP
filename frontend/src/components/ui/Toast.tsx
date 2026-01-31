/**
 * Toast Notification System
 * Centralized notification management with consistent styling
 */

import { message, notification } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

// Configure default settings
message.config({
  top: 70,
  duration: 3,
  maxCount: 3,
});

notification.config({
  placement: 'topRight',
  top: 70,
  duration: 4,
});

// Simple toast messages
export const toast = {
  success: (content: string, duration?: number) => {
    message.success({
      content,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      duration: duration || 3,
    });
  },

  error: (content: string, duration?: number) => {
    message.error({
      content,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      duration: duration || 4,
    });
  },

  warning: (content: string, duration?: number) => {
    message.warning({
      content,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      duration: duration || 3,
    });
  },

  info: (content: string, duration?: number) => {
    message.info({
      content,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      duration: duration || 3,
    });
  },

  loading: (content: string) => {
    return message.loading({
      content,
      icon: <LoadingOutlined style={{ color: '#667eea' }} />,
      duration: 0,
    });
  },
};

// Rich notifications with actions
export const notify = {
  success: (title: string, description?: string, onClick?: () => void) => {
    notification.success({
      message: title,
      description,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      onClick,
      style: {
        borderLeft: '4px solid #52c41a',
      },
    });
  },

  error: (title: string, description?: string, onClick?: () => void) => {
    notification.error({
      message: title,
      description,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      onClick,
      duration: 6,
      style: {
        borderLeft: '4px solid #ff4d4f',
      },
    });
  },

  warning: (title: string, description?: string, onClick?: () => void) => {
    notification.warning({
      message: title,
      description,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      onClick,
      style: {
        borderLeft: '4px solid #faad14',
      },
    });
  },

  info: (title: string, description?: string, onClick?: () => void) => {
    notification.info({
      message: title,
      description,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      onClick,
      style: {
        borderLeft: '4px solid #1890ff',
      },
    });
  },
};

// Action-specific toasts
export const actionToast = {
  saved: () => toast.success('Changes saved successfully'),
  created: (item: string) => toast.success(`${item} created successfully`),
  updated: (item: string) => toast.success(`${item} updated successfully`),
  deleted: (item: string) => toast.success(`${item} deleted successfully`),
  copied: () => toast.success('Copied to clipboard'),
  exported: () => toast.success('Export completed'),
  imported: () => toast.success('Import completed'),
  sent: () => toast.success('Message sent successfully'),
  
  // Error messages
  saveFailed: () => toast.error('Failed to save changes. Please try again.'),
  loadFailed: () => toast.error('Failed to load data. Please refresh the page.'),
  networkError: () => toast.error('Network error. Please check your connection.'),
  permissionDenied: () => toast.error('You don\'t have permission for this action.'),
  validationError: () => toast.error('Please fix the errors in the form.'),
  
  // Loading messages
  saving: () => toast.loading('Saving changes...'),
  loading: () => toast.loading('Loading...'),
  processing: () => toast.loading('Processing...'),
  uploading: () => toast.loading('Uploading...'),
};

// Async action wrapper with automatic toast
export const withToast = async <T,>(
  promise: Promise<T>,
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  } = {}
): Promise<T> => {
  const hide = message.loading(messages.loading || 'Processing...', 0);
  
  try {
    const result = await promise;
    hide();
    message.success(messages.success || 'Success!');
    return result;
  } catch (error) {
    hide();
    message.error(messages.error || 'Something went wrong');
    throw error;
  }
};

export default {
  toast,
  notify,
  actionToast,
  withToast,
};
