import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GripVertical, Check, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../lib/notifications';

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

const COLUMNS: Array<'Общее' | 'Алина' | 'Юра'> = ['Юра', 'Алина', 'Общее'];

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

  const { data: tasks = [], isLoading, error: queryError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('[TaskManager] Fetching tasks...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[TaskManager] No active session');
        throw new Error('No active session');
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('archived_at', null)
        .order('position', { ascending: true });

      if (error) {
        console.error('[TaskManager] Query error:', error);
        throw error;
      }

      console.log('[TaskManager] Fetched tasks:', data?.length || 0);

      const now = new Date();
      const tasksToArchive: string[] = [];

      const tasksMap = new Map<string, Task>();
      const rootTasks: Task[] = [];

      (data || []).forEach((task: Task) => {
        if (task.completed_at) {
          const completedDate = new Date(task.completed_at);
          const hoursSinceCompletion = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);

          if (hoursSinceCompletion >= 24) {
            tasksToArchive.push(task.id);
            return;
          }
        }

        tasksMap.set(task.id, { ...task, subtasks: [] });
      });

      if (tasksToArchive.length > 0) {
        await supabase
          .from('tasks')
          .update({ archived_at: now.toISOString() })
          .in('id', tasksToArchive);
      }

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (!data.parent_task_id) {
        showNotification('Новая задача добавлена', {
          body: `${data.title} - ${data.column_name}`,
          tag: 'task-added',
        });
      }
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
      const columnTasks = tasks.filter(t => t.column_name === column);
      const activeColumnTasks = columnTasks.filter(t => !t.completed_at);
      const maxPosition = activeColumnTasks.length > 0
        ? Math.max(...activeColumnTasks.map(t => t.position))
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
        updates: { completed_at: new Date().toISOString() },
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

  const handleUncompleteTask = async (task: Task) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      updates: { completed_at: null },
    });
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
        t => t.column_name === targetColumn
      );
      const activeTargetTasks = targetColumnTasks.filter(t => !t.completed_at);
      const maxPosition = activeTargetTasks.length > 0
        ? Math.max(...activeTargetTasks.map(t => t.position))
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
    const isCompleted = !!task.completed_at;

    return (
      <div key={task.id} className={`${isSubtask ? 'ml-6' : ''}`}>
        <div
          draggable={!isSubtask && !isCompleted}
          onDragStart={() => !isCompleted && handleDragStart(task)}
          className={`group bg-gray-800 rounded-lg p-3 mb-2 transition-all ${
            isCompleting ? 'opacity-50' : ''
          } ${isCompleted ? 'opacity-60' : ''} ${!isSubtask && !isCompleted ? 'cursor-move' : ''}`}
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
                <div className={`text-gray-100 text-sm font-medium ${isCompleted ? 'line-through' : ''}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className={`text-gray-400 text-xs mt-1 ${isCompleted ? 'line-through' : ''}`}>
                    {task.description}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                {!isCompleted ? (
                  <>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCompleteTask(task)}
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleUncompleteTask(task)}
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded transition-all"
                    title="Отменить выполнение"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
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

  if (queryError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <div className="text-red-400 mb-4">Ошибка загрузки задач</div>
          <div className="text-gray-500 text-sm mb-4">{queryError.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Обновить страницу
          </button>
        </div>
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
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row h-full lg:overflow-hidden">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter(
              (t) => t.column_name === column
            );

            return (
              <div
                key={column}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column)}
                className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-800 last:border-b-0 lg:last:border-r-0 flex flex-col min-h-[400px] lg:min-h-0"
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
