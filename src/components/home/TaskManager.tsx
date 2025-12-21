import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GripVertical, Check, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Task {
  id: string;
  title: string;
  description: string;
  color: string | null;
  column_name: 'Общее' | 'Алина' | 'Юра';
  position: number;
  parent_task_id: string | null;
  completed_at: string | null;
  archived_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
}

const COLUMNS: Array<'Общее' | 'Алина' | 'Юра'> = ['Общее', 'Алина', 'Юра'];

const COLORS = [
  { name: 'Красный', value: '#ef4444' },
  { name: 'Оранжевый', value: '#f97316' },
  { name: 'Желтый', value: '#eab308' },
  { name: 'Зеленый', value: '#22c55e' },
  { name: 'Голубой', value: '#3b82f6' },
  { name: 'Синий', value: '#2563eb' },
  { name: 'Фиолетовый', value: '#a855f7' },
  { name: 'Розовый', value: '#ec4899' },
];

const TaskManager: React.FC = () => {
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({
    'Общее': '',
    'Алина': '',
    'Юра': '',
  });
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('archived_at', null)
        .order('position', { ascending: true });

      if (error) throw error;

      const tasksMap = new Map<string, Task>();
      const rootTasks: Task[] = [];

      (data || []).forEach((task: Task) => {
        tasksMap.set(task.id, { ...task, subtasks: [] });
      });

      tasksMap.forEach((task) => {
        if (task.parent_task_id) {
          const parent = tasksMap.get(task.parent_task_id);
          if (parent) {
            parent.subtasks!.push(task);
          }
        } else {
          rootTasks.push(task);
        }
      });

      return rootTasks;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({
      title,
      description,
      color,
      column_name,
      parent_task_id,
      position,
    }: {
      title: string;
      description: string;
      color: string | null;
      column_name: string;
      parent_task_id: string | null;
      position: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          color,
          column_name,
          parent_task_id,
          position,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Task>;
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const parseTaskInput = (input: string) => {
    const parts = input.split('++').map(s => s.trim()).filter(Boolean);
    return parts;
  };

  const handleCreateTask = async (column: string) => {
    const input = newTaskInputs[column]?.trim();
    if (!input) return;

    const parts = parseTaskInput(input);
    if (parts.length === 0) return;

    try {
      const columnTasks = tasks.filter(t => t.column_name === column && !t.completed_at);
      const maxPosition = columnTasks.length > 0
        ? Math.max(...columnTasks.map(t => t.position))
        : -1;

      const mainTask = await createTaskMutation.mutateAsync({
        title: parts[0],
        description: '',
        color: null,
        column_name: column,
        parent_task_id: null,
        position: maxPosition + 1,
      });

      for (let i = 1; i < parts.length; i++) {
        await createTaskMutation.mutateAsync({
          title: parts[i],
          description: '',
          color: null,
          column_name: column,
          parent_task_id: mainTask.id,
          position: i - 1,
        });
      }

      setNewTaskInputs({ ...newTaskInputs, [column]: '' });
    } catch (error) {
      console.error('[TaskManager] Error creating task:', error);
      alert('Ошибка при создании задачи. Проверьте, что вы вошли в систему.');
    }
  };

  const handleCompleteTask = (task: Task) => {
    setCompletingTaskId(task.id);

    const timer = setTimeout(async () => {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        updates: { archived_at: new Date().toISOString() },
      });
      setCompletingTaskId(null);
      setUndoTimer(null);
    }, 5000);

    setUndoTimer(timer);
  };

  const handleUndoComplete = () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
      setCompletingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Удалить эту задачу?')) {
      await deleteTaskMutation.mutateAsync(taskId);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditColor(task.color);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    await updateTaskMutation.mutateAsync({
      id: editingTask,
      updates: {
        title: editTitle,
        description: editDescription,
        color: editColor,
      },
    });

    setEditingTask(null);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetColumn: string) => {
    if (!draggedTask) return;

    if (draggedTask.column_name !== targetColumn) {
      const targetColumnTasks = tasks.filter(
        t => t.column_name === targetColumn && !t.completed_at
      );
      const maxPosition = targetColumnTasks.length > 0
        ? Math.max(...targetColumnTasks.map(t => t.position))
        : -1;

      await updateTaskMutation.mutateAsync({
        id: draggedTask.id,
        updates: {
          column_name: targetColumn,
          position: maxPosition + 1,
        },
      });
    }

    setDraggedTask(null);
  };

  const toggleCollapse = (taskId: string) => {
    const newCollapsed = new Set(collapsedTasks);
    if (newCollapsed.has(taskId)) {
      newCollapsed.delete(taskId);
    } else {
      newCollapsed.add(taskId);
    }
    setCollapsedTasks(newCollapsed);
  };

  const renderTask = (task: Task, isSubtask = false) => {
    if (task.archived_at) return null;

    const isCompleting = completingTaskId === task.id;
    const isEditing = editingTask === task.id;
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isCollapsed = collapsedTasks.has(task.id);

    return (
      <div key={task.id} className={`${isSubtask ? 'ml-6' : ''}`}>
        <div
          draggable={!isSubtask}
          onDragStart={() => handleDragStart(task)}
          className={`group bg-gray-800 rounded-lg p-3 mb-2 transition-all ${
            isCompleting ? 'opacity-50' : ''
          } ${!isSubtask ? 'cursor-move' : ''}`}
          style={{ borderLeft: task.color ? `4px solid ${task.color}` : undefined }}
        >
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-gray-700 text-gray-100 px-2 py-1 rounded text-sm"
                placeholder="Название"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-gray-700 text-gray-100 px-2 py-1 rounded text-sm"
                placeholder="Описание"
              />
              <div className="flex items-center space-x-2">
                <select
                  value={editColor || ''}
                  onChange={(e) => setEditColor(e.target.value || null)}
                  className="bg-gray-700 text-gray-100 px-2 py-1 rounded text-sm"
                >
                  <option value="">Без цвета</option>
                  {COLORS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-2">
              {!isSubtask && (
                <GripVertical className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              )}
              {hasSubtasks && (
                <button
                  onClick={() => toggleCollapse(task.id)}
                  className="text-gray-400 hover:text-gray-300 mt-0.5"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-gray-100 text-sm font-medium">{task.title}</div>
                {task.description && (
                  <div className="text-gray-400 text-xs mt-1">{task.description}</div>
                )}
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditTask(task)}
                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCompleteTask(task)}
                  className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {hasSubtasks && !isCollapsed && (
          <div>
            {task.subtasks!.map((subtask) => renderTask(subtask, true))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Undo notification */}
      {completingTaskId && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 shadow-lg z-50 flex items-center space-x-3">
          <span className="text-sm text-gray-300">Задача выполнена</span>
          <button
            onClick={handleUndoComplete}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Отменить
          </button>
        </div>
      )}

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max lg:min-w-0">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter(
              (t) => t.column_name === column && !t.completed_at
            );

            return (
              <div
                key={column}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column)}
                className="flex-1 min-w-[300px] lg:min-w-0 border-r border-gray-800 last:border-r-0 flex flex-col"
              >
                <div className="p-4 border-b border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-100 mb-3">{column}</h2>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTaskInputs[column] || ''}
                      onChange={(e) =>
                        setNewTaskInputs({ ...newTaskInputs, [column]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTask(column);
                        }
                      }}
                      placeholder="Новая задача..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleCreateTask(column)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Используйте ++ для вложенных задач
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {columnTasks.map((task) => renderTask(task))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
