/**
 * Kanban Board for Tasks
 * Drag-and-drop task management with columns
 */

import React, { useState, useEffect } from 'react';
import { Card, Tag, Avatar, Button, Space, Input, Select, Tooltip, Badge, Modal, Form, DatePicker, message } from 'antd';
import { Plus, MoreVertical, Clock, MessageSquare, Paperclip, User, Calendar, Flag } from 'lucide-react';
import apiClient from '../../../services/api';
import './TasksBoard.css';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  tags: string[];
  comments: number;
  attachments: number;
  projectId: string;
  projectName: string;
}

interface Column {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  tasks: Task[];
}

const priorityColors: Record<string, string> = {
  low: '#52c41a',
  medium: '#1890ff',
  high: '#faad14',
  critical: '#ff4d4f'
};

const TasksBoard: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      // Fetch tasks from API
      const response = await apiClient.get('/api/projects/tasks');
      const tasksData = response.data?.data || response.data || [];
      
      const columnDefs: Omit<Column, 'tasks'>[] = [
        { id: 'backlog', title: 'Backlog', status: 'backlog', color: '#8c8c8c' },
        { id: 'todo', title: 'To Do', status: 'todo', color: '#1890ff' },
        { id: 'in-progress', title: 'In Progress', status: 'in-progress', color: '#722ed1' },
        { id: 'review', title: 'Review', status: 'review', color: '#faad14' },
        { id: 'done', title: 'Done', status: 'done', color: '#52c41a' }
      ];

      const populatedColumns = columnDefs.map(col => ({
        ...col,
        tasks: tasksData.filter((t: Task) => t.status === col.status)
      }));

      setColumns(populatedColumns);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStatus: Task['status']) => {
    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    setColumns(prevColumns => {
      return prevColumns.map(col => {
        if (col.status === draggedTask.status) {
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== draggedTask.id)
          };
        }
        if (col.status === targetStatus) {
          return {
            ...col,
            tasks: [...col.tasks, { ...draggedTask, status: targetStatus }]
          };
        }
        return col;
      });
    });

    message.success(`Task moved to ${targetStatus.replace('-', ' ')}`);
    setDraggedTask(null);
  };

  const handleAddTask = () => {
    form.validateFields().then(values => {
      const newTask: Task = {
        id: Date.now().toString(),
        title: values.title,
        description: values.description || '',
        status: selectedColumn as Task['status'],
        priority: values.priority || 'medium',
        assignee: values.assignee ? { id: '1', name: values.assignee } : undefined,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        tags: values.tags || [],
        comments: 0,
        attachments: 0,
        projectId: '1',
        projectName: 'ERP Implementation'
      };

      setColumns(prevColumns => {
        return prevColumns.map(col => {
          if (col.status === selectedColumn) {
            return { ...col, tasks: [...col.tasks, newTask] };
          }
          return col;
        });
      });

      message.success('Task created successfully');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const openAddTaskModal = (status: string) => {
    setSelectedColumn(status);
    setIsModalOpen(true);
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div
      className="task-card"
      draggable
      onDragStart={() => handleDragStart(task)}
    >
      <div className="task-header">
        <div className="task-priority" style={{ backgroundColor: priorityColors[task.priority] }} />
        <span className="task-project">{task.projectName}</span>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-tags">
        {task.tags.map(tag => (
          <Tag key={tag} style={{ fontSize: '10px', margin: '2px' }}>{tag}</Tag>
        ))}
      </div>
      <div className="task-footer">
        <div className="task-meta">
          {task.dueDate && (
            <Tooltip title={`Due: ${task.dueDate}`}>
              <span className="meta-item">
                <Calendar size={12} />
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </Tooltip>
          )}
          {task.comments > 0 && (
            <span className="meta-item">
              <MessageSquare size={12} /> {task.comments}
            </span>
          )}
          {task.attachments > 0 && (
            <span className="meta-item">
              <Paperclip size={12} /> {task.attachments}
            </span>
          )}
        </div>
        {task.assignee && (
          <Tooltip title={task.assignee.name}>
            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
              {task.assignee.name.charAt(0)}
            </Avatar>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div className="tasks-board">
      <div className="board-header">
        <h1>Tasks Board</h1>
        <Space>
          <Select
            placeholder="Filter by project"
            style={{ width: 200 }}
            allowClear
            options={[
              { value: '1', label: 'ERP Implementation' },
              { value: '2', label: 'Marketing Campaign' }
            ]}
          />
          <Select
            placeholder="Filter by assignee"
            style={{ width: 180 }}
            allowClear
          />
        </Space>
      </div>

      <div className="board-columns">
        {columns.map(column => (
          <div
            key={column.id}
            className="board-column"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.status)}
          >
            <div className="column-header">
              <div className="column-title">
                <span className="column-indicator" style={{ backgroundColor: column.color }} />
                {column.title}
                <Badge count={column.tasks.length} style={{ backgroundColor: '#f0f0f0', color: '#666' }} />
              </div>
              <Button
                type="text"
                size="small"
                icon={<Plus size={16} />}
                onClick={() => openAddTaskModal(column.status)}
              />
            </div>
            <div className="column-tasks">
              {column.tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {column.tasks.length === 0 && (
                <div className="column-empty">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        title="Add New Task"
        open={isModalOpen}
        onOk={handleAddTask}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="Create Task"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Please enter a task title' }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' }
              ]}
            />
          </Form.Item>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Select
              mode="tags"
              placeholder="Add tags"
              options={[
                { value: 'Design', label: 'Design' },
                { value: 'Backend', label: 'Backend' },
                { value: 'Frontend', label: 'Frontend' },
                { value: 'Testing', label: 'Testing' },
                { value: 'DevOps', label: 'DevOps' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksBoard;
