/**
 * Enhanced Form Components
 * Auto-save, better validation UX, inline editing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  Typography,
  Tooltip,
  Tag,
  message,
  Spin,
} from 'antd';
import type { FormInstance, FormProps } from 'antd';
import {
  SaveOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  EditOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// Auto-save status
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveFormProps extends FormProps {
  onAutoSave?: (values: Record<string, unknown>) => Promise<void>;
  autoSaveDelay?: number;
  showStatus?: boolean;
  children: React.ReactNode;
}

export function AutoSaveForm({
  onAutoSave,
  autoSaveDelay = 2000,
  showStatus = true,
  children,
  form: externalForm,
  onValuesChange,
  ...restProps
}: AutoSaveFormProps) {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleAutoSave = useCallback(async () => {
    if (!onAutoSave) return;

    try {
      setStatus('saving');
      const values = form.getFieldsValue();
      await onAutoSave(values);
      setStatus('saved');
      setLastSaved(new Date());

      // Reset to idle after a delay
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      console.error('Auto-save failed:', error);
    }
  }, [form, onAutoSave]);

  const handleValuesChange = useCallback((changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => {
    // Clear existing timeout
    clearTimeout(timeoutRef.current);

    // Call external handler if provided
    onValuesChange?.(changedValues, allValues);

    // Schedule auto-save
    if (onAutoSave) {
      setStatus('idle');
      timeoutRef.current = setTimeout(handleAutoSave, autoSaveDelay);
    }
  }, [handleAutoSave, autoSaveDelay, onAutoSave, onValuesChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const statusIndicator = showStatus && (
    <div style={{ marginBottom: 16 }}>
      {status === 'saving' && (
        <Tag icon={<SyncOutlined spin />} color="processing">
          Saving...
        </Tag>
      )}
      {status === 'saved' && (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Saved {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}
        </Tag>
      )}
      {status === 'error' && (
        <Tag icon={<WarningOutlined />} color="error">
          Save failed
        </Tag>
      )}
    </div>
  );

  return (
    <>
      {statusIndicator}
      <Form
        form={form}
        onValuesChange={handleValuesChange}
        {...restProps}
      >
        {children}
      </Form>
    </>
  );
}

// Inline editable field
interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  renderView?: (value: string) => React.ReactNode;
  inputType?: 'text' | 'textarea';
}

export function InlineEdit({
  value: initialValue,
  onSave,
  placeholder = 'Click to edit',
  maxLength,
  required = false,
  renderView,
  inputType = 'text',
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (required && !value.trim()) {
      message.error('This field is required');
      return;
    }

    try {
      setLoading(true);
      await onSave(value);
      setIsEditing(false);
    } catch (error) {
      message.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputType === 'text') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    const InputComponent = inputType === 'textarea' ? Input.TextArea : Input;

    return (
      <Space.Compact style={{ width: '100%' }}>
        <InputComponent
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Tooltip title="Save">
          <Button
            type="primary"
            icon={loading ? <Spin size="small" /> : <CheckCircleOutlined />}
            onClick={handleSave}
            disabled={loading}
          />
        </Tooltip>
        <Tooltip title="Cancel">
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancel}
            disabled={loading}
          />
        </Tooltip>
      </Space.Compact>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 4,
        transition: 'background 0.2s',
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {renderView ? renderView(value) : (
        <Text style={{ color: value ? undefined : '#bfbfbf' }}>
          {value || placeholder}
        </Text>
      )}
      <EditOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
    </div>
  );
}

// Field with character count
interface CharCountInputProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  showWarningAt?: number;
  inputType?: 'text' | 'textarea';
  rows?: number;
}

export function CharCountInput({
  value = '',
  onChange,
  maxLength,
  placeholder,
  showWarningAt = 0.8,
  inputType = 'text',
  rows = 4,
}: CharCountInputProps) {
  const count = value.length;
  const percentage = count / maxLength;
  const showWarning = percentage >= showWarningAt;

  const InputComponent = inputType === 'textarea' ? Input.TextArea : Input;

  return (
    <div>
      <InputComponent
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={inputType === 'textarea' ? rows : undefined}
      />
      <div style={{ textAlign: 'right', marginTop: 4 }}>
        <Text
          type={showWarning ? 'warning' : 'secondary'}
          style={{ fontSize: 12 }}
        >
          {count}/{maxLength}
        </Text>
      </div>
    </div>
  );
}

// Form with dirty state tracking
interface DirtyFormProps extends FormProps {
  onDirtyChange?: (isDirty: boolean) => void;
  children: React.ReactNode;
}

export function DirtyForm({
  onDirtyChange,
  children,
  form: externalForm,
  initialValues,
  onValuesChange,
  ...restProps
}: DirtyFormProps) {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef(initialValues);

  const handleValuesChange = useCallback((changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => {
    // Compare with initial values
    const dirty = JSON.stringify(allValues) !== JSON.stringify(initialValuesRef.current);
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
    onValuesChange?.(changedValues, allValues);
  }, [onDirtyChange, onValuesChange]);

  // Warn before leaving if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <Form
      form={form}
      initialValues={initialValues}
      onValuesChange={handleValuesChange}
      {...restProps}
    >
      {children}
    </Form>
  );
}

// Export everything
export const FormUtils = {
  AutoSaveForm,
  InlineEdit,
  CharCountInput,
  DirtyForm,
};

export default FormUtils;
