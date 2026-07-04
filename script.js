/**
 * Smart TaskManager — Intelligent Task Manager
 * script.js | Version 2.0 | Vanilla JS ES6+
 * Features: Full CRUD, LocalStorage, Dark Mode, Drag & Drop,
 *           Search, Filter, Sort, Dashboard Stats, Notifications, Validation,
 *           Smart auto-suggestion of Category & Priority from task title
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════ */
let tasks = [];          // All tasks array
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';
let editingId = null;
let selectedColor = '#4F46E5';
let confirmCallback = null;
let dragSrcIndex = null;
let userSetPriority = false;
let userSetCategory = false;

/* ═══════════════════════════════════════════════════════════
   SMART SUGGESTION ENGINE
   Detects likely category & priority from keywords in the title
═══════════════════════════════════════════════════════════ */
const SMART_CATEGORY_RULES = {
  Work: ['meeting', 'client', 'project', 'deadline', 'email', 'report', 'presentation', 'invoice', 'boss', 'office', 'call', 'standup', 'sprint'],
  Study: ['exam', 'homework', 'assignment', 'class', 'lecture', 'study', 'revise', 'thesis', 'quiz', 'read chapter'],
  Shopping: ['buy', 'purchase', 'grocery', 'groceries', 'order', 'shopping', 'cart', 'store'],
  Health: ['doctor', 'gym', 'workout', 'medicine', 'appointment', 'exercise', 'dentist', 'yoga', 'run'],
  Personal: ['birthday', 'family', 'home', 'clean', 'anniversary', 'friend', 'trip', 'vacation']
};
const SMART_PRIORITY_RULES = {
  high: ['urgent', 'asap', 'deadline', 'important', 'critical', 'immediately', 'today'],
  low: ['someday', 'maybe', 'later', 'whenever', 'optional']
};

function getSmartSuggestion(title) {
  const t = title.toLowerCase();
  let category = null, priority = null;

  for (const [cat, words] of Object.entries(SMART_CATEGORY_RULES)) {
    if (words.some(w => t.includes(w))) { category = cat; break; }
  }
  for (const [p, words] of Object.entries(SMART_PRIORITY_RULES)) {
    if (words.some(w => t.includes(w))) { priority = p; break; }
  }
  return { category, priority };
}

function applySmartSuggestion() {
  const title = $('taskTitle').value.trim();
  const hint = $('smartHint');
  if (!title || title.length < 3) { hint.textContent = ''; return; }

  const { category, priority } = getSmartSuggestion(title);
  if (!category && !priority) { hint.textContent = ''; return; }

  const parts = [];
  if (category && !userSetCategory) {
    $('taskCategory').value = category;
    parts.push(`category: ${category}`);
  }
  if (priority && !userSetPriority) {
    $('taskPriority').value = priority;
    parts.push(`priority: ${cap(priority)}`);
  }
  hint.textContent = parts.length ? `✨ Smart suggestion applied — ${parts.join(', ')}` : '';
}

/* ═══════════════════════════════════════════════════════════
   DOM REFERENCES
═══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const taskList = $('taskList');
const emptyState = $('emptyState');
const taskModal = $('taskModal');
const confirmModal = $('confirmModal');
const searchInput = $('searchInput');
const searchClear = $('searchClear');
const sortSelect = $('sortSelect');
const themeToggle = $('themeToggle');
const themeIcon = $('themeIcon');
const backToTop = $('backToTop');
const loadingScr = $('loadingScreen');
const filterIndicator = $('filterIndicator');
const filterLabel = $('filterLabel');

/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  applyTheme(localStorage.getItem('smarttaskmanager-theme') || 'light');
  startClock();
  buildMiniCalendar();
  renderAll();
  bindEvents();
  setTimeout(() => loadingScr.classList.add('hidden'), 900);
});

/* ═══════════════════════════════════════════════════════════
   LOCAL STORAGE
═══════════════════════════════════════════════════════════ */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem('smarttaskmanager-tasks');
    tasks = raw ? JSON.parse(raw) : [];
  } catch { tasks = []; }
}

function saveToStorage() {
  localStorage.setItem('smarttaskmanager-tasks', JSON.stringify(tasks));
}

/* ═══════════════════════════════════════════════════════════
   CLOCK
═══════════════════════════════════════════════════════════ */
function startClock() {
  const tick = () => {
    const now = new Date();
    $('liveDate').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    $('liveTime').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('smarttaskmanager-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

/* ═══════════════════════════════════════════════════════════
   MINI CALENDAR
═══════════════════════════════════════════════════════════ */
function buildMiniCalendar() {
  const cal = $('miniCalendar');
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();

  // Task due dates for highlight
  const taskDates = new Set(tasks.map(t => t.dueDate).filter(Boolean));

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let html = `<div class="cal-header"><span>${monthName}</span></div>
  <div class="cal-grid">
    <span class="cal-day-name">Su</span><span class="cal-day-name">Mo</span>
    <span class="cal-day-name">Tu</span><span class="cal-day-name">We</span>
    <span class="cal-day-name">Th</span><span class="cal-day-name">Fr</span>
    <span class="cal-day-name">Sa</span>`;

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<span class="cal-day other-month">${prevDays - i}</span>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = d === today;
    const hasTask = taskDates.has(dateStr);
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (hasTask) cls += ' has-task';
    html += `<span class="${cls}">${d}</span>`;
  }
  html += `</div>`;
  cal.innerHTML = html;
}

/* ═══════════════════════════════════════════════════════════
   RENDER ALL
═══════════════════════════════════════════════════════════ */
function renderAll() {
  updateStats();
  updateSidebarCounts();
  renderTasks();
  buildMiniCalendar();
}

/* ═══════════════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════════════ */
function updateStats() {
  const active = tasks.filter(t => !t.archived);
  const archived = tasks.filter(t => t.archived);
  const completed = active.filter(t => t.status === 'completed');
  const pending = active.filter(t => t.status === 'pending');
  const pinned = active.filter(t => t.pinned);
  const overdue = active.filter(t => t.status === 'pending' && isOverdue(t));
  const total = active.length;
  const pct = total ? Math.round((completed.length / total) * 100) : 0;
  const circumference = 213.6;

  $('statTotal').textContent = total;
  $('statCompleted').textContent = completed.length;
  $('statPending').textContent = pending.length;
  $('statOverdue').textContent = overdue.length;
  $('statPinned').textContent = pinned.length;
  $('statArchived').textContent = archived.length;
  $('cpText').textContent = pct + '%';
  $('cpFill').style.strokeDashoffset = circumference - (pct / 100) * circumference;
  $('linearFill').style.width = pct + '%';
  $('linearPct').textContent = pct + '%';
  $('progressSubLabel').textContent = `${completed.length} of ${total} tasks completed`;
}

function updateSidebarCounts() {
  const active = tasks.filter(t => !t.archived);
  const archived = tasks.filter(t => t.archived);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(new Date());

  $('countAll').textContent = active.length;
  $('countPending').textContent = active.filter(t => t.status === 'pending').length;
  $('countCompleted').textContent = active.filter(t => t.status === 'completed').length;
  $('countPinned').textContent = active.filter(t => t.pinned).length;
  $('countArchived').textContent = archived.length;
  $('countOverdue').textContent = active.filter(t => t.status === 'pending' && isOverdue(t)).length;
  $('countToday').textContent = active.filter(t => t.dueDate === todayStr).length;
  $('countHigh').textContent = active.filter(t => t.priority === 'high').length;
  $('countMedium').textContent = active.filter(t => t.priority === 'medium').length;
  $('countLow').textContent = active.filter(t => t.priority === 'low').length;
}

/* ═══════════════════════════════════════════════════════════
   FILTER / SORT / SEARCH
═══════════════════════════════════════════════════════════ */
function getFilteredSorted() {
  const q = searchQuery.toLowerCase();
  const todayStr = toDateStr(new Date());

  let result = tasks.filter(t => {
    // Search
    if (q && !(
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.priority || '').toLowerCase().includes(q) ||
      (t.status || '').toLowerCase().includes(q)
    )) return false;

    // Filter
    switch (currentFilter) {
      case 'all': return !t.archived;
      case 'pending': return !t.archived && t.status === 'pending';
      case 'completed': return !t.archived && t.status === 'completed';
      case 'pinned': return !t.archived && t.pinned;
      case 'archived': return t.archived;
      case 'overdue': return !t.archived && t.status === 'pending' && isOverdue(t);
      case 'today': return !t.archived && t.dueDate === todayStr;
      case 'high': return !t.archived && t.priority === 'high';
      case 'medium': return !t.archived && t.priority === 'medium';
      case 'low': return !t.archived && t.priority === 'low';
      default:
        if (currentFilter.startsWith('cat-')) {
          return !t.archived && t.category === currentFilter.slice(4);
        }
        return !t.archived;
    }
  });

  // Sort
  const pMap = { high: 3, medium: 2, low: 1 };
  result.sort((a, b) => {
    switch (currentSort) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'alpha': return a.title.localeCompare(b.title);
      case 'priority': return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      case 'duedate':
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'status':
        return (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0);
      default: return 0;
    }
  });

  // Pinned always first (non-archived)
  if (currentFilter !== 'archived') {
    result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════
   RENDER TASKS
═══════════════════════════════════════════════════════════ */
function renderTasks() {
  const filtered = getFilteredSorted();
  taskList.innerHTML = '';

  if (!filtered.length) {
    emptyState.style.display = 'block';
    const noSearch = !searchQuery;
    $('emptyTitle').textContent = noSearch ? 'No Tasks Here' : 'No Results Found';
    $('emptyDesc').innerHTML = noSearch
      ? 'Click <strong>+ New Task</strong> to get started!'
      : `No tasks match "<strong>${searchQuery}</strong>". Try different keywords.`;
    return;
  }

  emptyState.style.display = 'none';
  filtered.forEach((task, idx) => {
    taskList.appendChild(createTaskCard(task, idx));
  });
}

function createTaskCard(task, idx) {
  const card = document.createElement('div');
  card.className = ['task-card',
    task.status === 'completed' ? 'completed' : '',
    task.pinned ? 'pinned' : '',
    task.archived ? 'archived' : ''
  ].filter(Boolean).join(' ');
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `Task: ${task.title}`);
  card.dataset.id = task.id;
  card.setAttribute('draggable', 'true');

  // Overdue?
  const overdue = task.status === 'pending' && isOverdue(task);

  // Badges
  const priorityClass = { high: 'badge-priority-high', medium: 'badge-priority-medium', low: 'badge-priority-low' }[task.priority] || '';
  const priorityEmoji = { high: '🔥', medium: '⚡', low: '🌿' }[task.priority] || '';
  const catEmoji = { Personal: '👤', Work: '💼', Study: '📚', Shopping: '🛒', Health: '💊', Custom: '⚙️' }[task.category] || '🏷';
  const statusBadge = task.status === 'completed'
    ? `<span class="badge badge-status-completed">✅ Done</span>`
    : `<span class="badge badge-status-pending">⏳ Pending</span>`;

  // Due date display
  let dueMeta = '';
  if (task.dueDate) {
    const dStr = formatDate(task.dueDate) + (task.dueTime ? ' ' + formatTime(task.dueTime) : '');
    dueMeta = overdue
      ? `<span class="overdue-time">⚠️ ${dStr}</span>`
      : `<span>📅 ${dStr}</span>`;
  }

  // Action buttons
  const archiveBtn = task.archived
    ? `<button class="task-action-btn" title="Restore" onclick="restoreTask('${task.id}')">♻️</button>
       <button class="task-action-btn del" title="Delete Permanently" onclick="permanentDelete('${task.id}')">🗑️</button>`
    : `<button class="task-action-btn" title="${task.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}"
        onclick="toggleComplete('${task.id}')">${task.status === 'completed' ? '↩️' : '✅'}</button>
       <button class="task-action-btn" title="Edit" onclick="openEditModal('${task.id}')">✏️</button>
       <button class="task-action-btn" title="${task.pinned ? 'Unpin' : 'Pin'}" onclick="togglePin('${task.id}')">${task.pinned ? '📌' : '📍'}</button>
       <button class="task-action-btn" title="Duplicate" onclick="duplicateTask('${task.id}')">📋</button>
       <button class="task-action-btn" title="Archive" onclick="archiveTask('${task.id}')">🗃️</button>
       <button class="task-action-btn del" title="Delete" onclick="deleteTask('${task.id}')">🗑️</button>`;

  card.innerHTML = `
    <div class="task-color-strip" style="background:${task.color || 'var(--accent)'}"></div>
    <div class="task-check ${task.status === 'completed' ? 'done' : ''}"
      onclick="toggleComplete('${task.id}')"
      role="checkbox"
      aria-checked="${task.status === 'completed'}"
      aria-label="Toggle task completion"
      tabindex="0"></div>
    <div class="task-main">
      <div class="task-top">
        <span class="task-title">${escHtml(task.title)}</span>
        ${task.pinned ? '<span class="task-pin-icon">📌</span>' : ''}
      </div>
      <div class="task-badges">
        <span class="badge ${priorityClass}">${priorityEmoji} ${cap(task.priority)}</span>
        <span class="badge badge-category">${catEmoji} ${escHtml(task.category)}</span>
        ${statusBadge}
        ${overdue ? '<span class="badge badge-overdue">⚠️ Overdue</span>' : ''}
        ${task.archived ? '<span class="badge badge-archived">🗃️ Archived</span>' : ''}
      </div>
      ${task.description ? `<p class="task-desc">${escHtml(task.description)}</p>` : ''}
      <div class="task-meta">
        ${dueMeta}
        <span>🕐 Created ${formatRelative(task.createdAt)}</span>
        ${task.updatedAt !== task.createdAt ? `<span>✏️ Updated ${formatRelative(task.updatedAt)}</span>` : ''}
      </div>
    </div>
    <div class="task-actions" role="group" aria-label="Task actions">
      ${archiveBtn}
    </div>`;

  // Keyboard on check box
  card.querySelector('.task-check')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleComplete(task.id); }
  });

  // Drag & Drop
  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragover', onDragOver);
  card.addEventListener('drop', onDrop);
  card.addEventListener('dragend', onDragEnd);

  return card;
}

/* ═══════════════════════════════════════════════════════════
   TASK CRUD
═══════════════════════════════════════════════════════════ */
function openAddModal() {
  editingId = null;
  resetForm();
  $('modalTitle').textContent = '✨ New Task';
  $('saveTaskBtn').textContent = 'Save Task';
  showModal(taskModal);
  setTimeout(() => $('taskTitle').focus(), 100);
}

function openEditModal(id) {
  const task = findTask(id);
  if (!task) return;
  editingId = id;
  $('taskTitle').value = task.title;
  $('taskDesc').value = task.description || '';
  $('taskPriority').value = task.priority;
  $('taskCategory').value = task.category;
  $('taskDueDate').value = task.dueDate || '';
  $('taskDueTime').value = task.dueTime || '';
  selectedColor = task.color || '#4F46E5';
  // Editing an existing task: don't let smart-suggestion override deliberate choices
  userSetPriority = true;
  userSetCategory = true;
  $('smartHint').textContent = '';
  $$('#colorPicker .color-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.color === selectedColor);
  });
  $('modalTitle').textContent = '✏️ Edit Task';
  $('saveTaskBtn').textContent = 'Update Task';
  showModal(taskModal);
  clearErrors();
  setTimeout(() => $('taskTitle').focus(), 100);
}

function saveTask() {
  if (!validateForm()) return;

  const title = $('taskTitle').value.trim();
  const desc = $('taskDesc').value.trim();
  const priority = $('taskPriority').value;
  const category = $('taskCategory').value;
  const dueDate = $('taskDueDate').value;
  const dueTime = $('taskDueTime').value;
  const now = new Date().toISOString();

  if (editingId) {
    const idx = tasks.findIndex(t => t.id === editingId);
    if (idx === -1) return;
    tasks[idx] = { ...tasks[idx], title, description: desc, priority, category, dueDate, dueTime, color: selectedColor, updatedAt: now };
    showToast('✏️', 'Task updated!', 'yellow');
  } else {
    const task = {
      id: genId(), title, description: desc, priority, category,
      dueDate, dueTime, color: selectedColor,
      status: 'pending', pinned: false, archived: false,
      createdAt: now, updatedAt: now
    };
    tasks.unshift(task);
    showToast('✅', 'Task added!', 'green');
  }

  saveToStorage();
  closeModal(taskModal);
  renderAll();
}

function toggleComplete(id) {
  const task = findTask(id);
  if (!task) return;
  task.status = task.status === 'completed' ? 'pending' : 'completed';
  task.updatedAt = new Date().toISOString();
  saveToStorage();
  renderAll();
  showToast(
    task.status === 'completed' ? '✅' : '↩️',
    task.status === 'completed' ? 'Task completed!' : 'Marked as pending',
    task.status === 'completed' ? 'green' : 'left'
  );
}

function togglePin(id) {
  const task = findTask(id);
  if (!task) return;
  task.pinned = !task.pinned;
  task.updatedAt = new Date().toISOString();
  saveToStorage();
  renderAll();
  showToast('📌', task.pinned ? 'Task pinned!' : 'Task unpinned', 'left');
}

function archiveTask(id) {
  const task = findTask(id);
  if (!task) return;
  task.archived = true;
  task.pinned = false;
  task.updatedAt = new Date().toISOString();
  saveToStorage();
  renderAll();
  showToast('🗃️', 'Task archived', 'yellow');
}

function restoreTask(id) {
  const task = findTask(id);
  if (!task) return;
  task.archived = false;
  task.updatedAt = new Date().toISOString();
  saveToStorage();
  renderAll();
  showToast('♻️', 'Task restored!', 'green');
}

function deleteTask(id) {
  showConfirm('🗑️', 'Delete this task?', 'This action cannot be undone.', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    renderAll();
    showToast('🗑️', 'Task deleted', 'red');
  });
}

function permanentDelete(id) {
  showConfirm('⚠️', 'Permanently delete?', 'This archived task will be removed forever.', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    renderAll();
    showToast('🗑️', 'Permanently deleted', 'red');
  });
}

function duplicateTask(id) {
  const task = findTask(id);
  if (!task) return;
  const now = new Date().toISOString();
  const clone = { ...task, id: genId(), title: task.title + ' (Copy)', createdAt: now, updatedAt: now, pinned: false };
  const idx = tasks.findIndex(t => t.id === id);
  tasks.splice(idx + 1, 0, clone);
  saveToStorage();
  renderAll();
  showToast('📋', 'Task duplicated!', 'left');
}

function confirmClearAll() {
  showConfirm('⚠️', 'Clear All Data?', 'All tasks will be permanently deleted. This cannot be undone.', () => {
    tasks = [];
    saveToStorage();
    renderAll();
    showToast('🗑️', 'All data cleared', 'red');
  });
}

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */
function validateForm() {
  clearErrors();
  let ok = true;
  const title = $('taskTitle').value.trim();
  const priority = $('taskPriority').value;
  const category = $('taskCategory').value;
  const dueDate = $('taskDueDate').value;

  if (!title) {
    showError('titleError', 'Title is required.');
    $('taskTitle').focus();
    ok = false;
  } else if (title.length < 2) {
    showError('titleError', 'Title must be at least 2 characters.');
    ok = false;
  }

  if (!priority) { showError('priorityError', 'Please select a priority.'); ok = false; }
  if (!category) { showError('categoryError', 'Please select a category.'); ok = false; }

  if (!dueDate) {
    showError('dueDateError', 'Due date is required.');
    ok = false;
  } else {
    // Allow today and future dates only
    const today = toDateStr(new Date());
    if (dueDate < today) {
      showError('dueDateError', 'Due date cannot be in the past.');
      ok = false;
    }
  }

  return ok;
}

function showError(id, msg) {
  const el = $(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  ['titleError', 'priorityError', 'categoryError', 'dueDateError'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '';
  });
}

/* ═══════════════════════════════════════════════════════════
   MODAL HELPERS
═══════════════════════════════════════════════════════════ */
function showModal(modal) {
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function resetForm() {
  $('taskTitle').value = '';
  $('taskDesc').value = '';
  $('taskPriority').value = '';
  $('taskCategory').value = '';
  $('taskDueDate').value = '';
  $('taskDueTime').value = '';
  selectedColor = '#4F46E5';
  userSetPriority = false;
  userSetCategory = false;
  $('smartHint').textContent = '';
  $$('#colorPicker .color-dot').forEach((d, i) => d.classList.toggle('active', i === 0));
  clearErrors();
}

function showConfirm(icon, title, msg, cb) {
  $('confirmIcon').textContent = icon;
  $('confirmTitle').textContent = title;
  $('confirmMsg').textContent = msg;
  confirmCallback = cb;
  showModal(confirmModal);
}

/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
function showToast(icon, msg, type = 'left') {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  const typeClass = { green: 'toast-green', red: 'toast-red', yellow: 'toast-yellow', left: 'toast-left' }[type] || 'toast-left';
  toast.className = `toast ${typeClass}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 350); }, 3200);
}

/* ═══════════════════════════════════════════════════════════
   DRAG & DROP
═══════════════════════════════════════════════════════════ */
function onDragStart(e) {
  dragSrcIndex = [...taskList.children].indexOf(this);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  $$('.task-card').forEach(c => c.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const destIndex = [...taskList.children].indexOf(this);
  if (dragSrcIndex === null || dragSrcIndex === destIndex) return;

  // Reorder filtered tasks and map back to main array
  const filtered = getFilteredSorted();
  const srcTask = filtered[dragSrcIndex];
  const destTask = filtered[destIndex];
  if (!srcTask || !destTask) return;

  const srcMainIdx = tasks.findIndex(t => t.id === srcTask.id);
  const destMainIdx = tasks.findIndex(t => t.id === destTask.id);
  tasks.splice(destMainIdx, 0, tasks.splice(srcMainIdx, 1)[0]);
  saveToStorage();
  renderAll();
}

function onDragEnd() {
  $$('.task-card').forEach(c => { c.classList.remove('dragging'); c.classList.remove('drag-over'); });
  dragSrcIndex = null;
}

/* ═══════════════════════════════════════════════════════════
   EXPORT / IMPORT
═══════════════════════════════════════════════════════════ */
function exportTasks() {
  const data = JSON.stringify({ version: '2.0', exportedAt: new Date().toISOString(), tasks }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smart-taskmanager-backup-${toDateStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤', 'Tasks exported!', 'green');
}

function importTasks() {
  $('importFileInput').click();
}

$('importFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      const imported = parsed.tasks || parsed;
      if (!Array.isArray(imported)) throw new Error();
      tasks = [...tasks, ...imported.filter(t => t.id && t.title)];
      // Deduplicate by id
      tasks = tasks.filter((t, i, self) => self.findIndex(x => x.id === t.id) === i);
      saveToStorage();
      renderAll();
      showToast('📥', `Imported ${imported.length} tasks!`, 'green');
    } catch {
      showToast('❌', 'Invalid file format', 'red');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

/* ═══════════════════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════════════════ */
function bindEvents() {
  // Navbar
  themeToggle.addEventListener('click', toggleTheme);
  $('addTaskBtn').addEventListener('click', openAddModal);
  $('profileBtn').addEventListener('click', e => {
    e.stopPropagation();
    $('profileDropdown').classList.toggle('open');
  });
  document.addEventListener('click', () => $('profileDropdown').classList.remove('open'));

  // Search
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    searchClear.style.display = searchQuery ? 'block' : 'none';
    renderTasks();
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';
    renderTasks();
    searchInput.focus();
  });

  // Sort
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    renderTasks();
  });

  // Sidebar filters
  $$('.sidebar-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      $$('.sidebar-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      updateFilterIndicator();
      renderTasks();
    });
  });

  // Filter clear
  $('clearFilterBtn').addEventListener('click', () => {
    currentFilter = 'all';
    $$('.sidebar-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    document.querySelector('.sidebar-btn[data-filter="all"]').classList.add('active');
    document.querySelector('.sidebar-btn[data-filter="all"]').setAttribute('aria-pressed', 'true');
    updateFilterIndicator();
    renderTasks();
  });

  // Task Modal
  $('modalClose').addEventListener('click', () => closeModal(taskModal));
  $('cancelBtn').addEventListener('click', () => closeModal(taskModal));
  $('saveTaskBtn').addEventListener('click', saveTask);
  taskModal.addEventListener('click', e => { if (e.target === taskModal) closeModal(taskModal); });

  // Confirm Modal
  $('confirmClose').addEventListener('click', () => closeModal(confirmModal));
  $('confirmCancelBtn').addEventListener('click', () => closeModal(confirmModal));
  $('confirmOkBtn').addEventListener('click', () => {
    closeModal(confirmModal);
    if (typeof confirmCallback === 'function') confirmCallback();
    confirmCallback = null;
  });
  confirmModal.addEventListener('click', e => { if (e.target === confirmModal) closeModal(confirmModal); });

  // Color picker
  $$('#colorPicker .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      selectedColor = dot.dataset.color;
      $$('#colorPicker .color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  });

  // Smart suggestion: watch the title field while adding a task
  $('taskTitle').addEventListener('input', () => {
    if (!editingId) applySmartSuggestion();
  });
  // If the user manually changes priority/category, stop overriding their choice
  $('taskPriority').addEventListener('change', () => { userSetPriority = true; });
  $('taskCategory').addEventListener('change', () => { userSetCategory = true; });

  // Ripple
  $$('.ripple').forEach(addRipple);

  // Back to Top
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Also scroll content-area for back-to-top
  document.querySelector('.content-area')?.addEventListener('scroll', function () {
    backToTop.classList.toggle('visible', this.scrollTop > 200);
  }, { passive: true });

  // Keyboard Shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Min date = today for due date
  const today = toDateStr(new Date());
  $('taskDueDate').setAttribute('min', today);
}

function updateFilterIndicator() {
  const labels = {
    all: 'All Tasks', pending: 'Pending', completed: 'Completed', pinned: 'Pinned',
    archived: 'Archived', overdue: 'Overdue', today: "Today's Tasks",
    high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority'
  };
  let label = labels[currentFilter] || (currentFilter.startsWith('cat-') ? `Category: ${currentFilter.slice(4)}` : currentFilter);
  filterLabel.textContent = `Showing: ${label}`;
  filterIndicator.style.display = currentFilter === 'all' ? 'none' : 'flex';
}

/* ═══════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════════ */
function handleKeyboard(e) {
  const tag = document.activeElement.tagName.toLowerCase();
  const inInput = ['input', 'textarea', 'select'].includes(tag);

  if (e.key === 'Escape') {
    closeModal(taskModal);
    closeModal(confirmModal);
    return;
  }

  if (!inInput) {
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openAddModal(); return; }
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); toggleTheme(); return; }
  }

  // Enter in modal form
  if (e.key === 'Enter' && taskModal.style.display !== 'none' && !inInput) {
    saveTask();
  }
}

/* ═══════════════════════════════════════════════════════════
   RIPPLE
═══════════════════════════════════════════════════════════ */
function addRipple(btn) {
  btn.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.left = (e.clientX - rect.left - 5) + 'px';
    wave.style.top = (e.clientY - rect.top - 5) + 'px';
    this.appendChild(wave);
    setTimeout(() => wave.remove(), 700);
  });
}

/* ═══════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════ */
function genId() {
  return 'stm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function findTask(id) { return tasks.find(t => t.id === id); }

function isOverdue(task) {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate + (task.dueTime ? 'T' + task.dueTime : 'T23:59:59'));
  return due < new Date();
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(str) {
  if (!str) return '';
  const [h, min] = str.split(':');
  const d = new Date(); d.setHours(+h, +min);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(toDateStr(new Date(iso)));
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
