const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const state = {
  accessToken: localStorage.getItem("accessToken") || "",
  currentUser: null,
  projects: [],
  projectId: "",
  tasks: [],
  appLoading: true,
  loadingProjects: false,
  loadingTasks: false,
  authMode: "login",
  modalOpen: false,
};

const els = {
  app: document.getElementById("app"),
  alerts: document.getElementById("alerts"),
};

const notify = (message, type = "info") => {
  const alert = document.createElement("div");
  alert.className = `alert ${type}`;
  alert.textContent = message;
  els.alerts.append(alert);

  setTimeout(() => {
    alert.remove();
  }, 3000);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toIsoDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
};

const prettyDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "No due date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");

const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
};

const setAccessToken = (token) => {
  state.accessToken = token || "";

  if (state.accessToken) {
    localStorage.setItem("accessToken", state.accessToken);
  } else {
    localStorage.removeItem("accessToken");
  }
};

const authHeaders = () =>
  state.accessToken
    ? {
        Authorization: `Bearer ${state.accessToken}`,
      }
    : {};

const parseResponse = async (response) => {
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = {
      success: false,
      message: "Unexpected server response.",
    };
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload.data;
};

const refreshAccessToken = async () => {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
};

const apiFetch = async (path, options = {}, retried = false) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (response.status === 401 && !retried) {
    try {
      await refreshAccessToken();
      return apiFetch(path, options, true);
    } catch {
      setAccessToken("");
      state.currentUser = null;
      state.projects = [];
      state.projectId = "";
      state.tasks = [];
      render();
    }
  }

  return parseResponse(response);
};

const Sidebar = () => `
  <aside class="sidebar" aria-label="Main navigation">
    <div class="sidebar__brand">
      <div class="sidebar__logo" aria-hidden="true"></div>
      <p class="sidebar__name">Task Manager</p>
    </div>
    <nav class="sidebar__nav">
      <button class="nav-item" type="button">Dashboard</button>
      <button class="nav-item" type="button">Projects</button>
      <button class="nav-item is-active" type="button">Tasks</button>
    </nav>
  </aside>
`;

const Header = () => `
  <header class="main-header">
    <div>
      <h1 class="main-header__title">Tasks</h1>
      <p class="main-header__subtitle">Manage priorities, delivery timeline, and progress in one place.</p>
    </div>
    <div class="user-section">
      <button
        type="button"
        class="btn btn-primary"
        data-action="open-create-modal"
        ${!state.projectId ? "disabled" : ""}
      >
        New Task
      </button>
      <div class="user-chip">
        <div class="avatar">${escapeHtml(initials(state.currentUser?.name))}</div>
        <span class="user-chip__text">${escapeHtml(state.currentUser?.name || "User")}</span>
      </div>
      <button type="button" class="btn btn-secondary" data-action="logout">Logout</button>
    </div>
  </header>
`;

const ProjectSelector = () => {
  const options = state.projects.length
    ? state.projects
        .map(
          (project) => `
            <option value="${escapeHtml(project.id)}" ${project.id === state.projectId ? "selected" : ""}>
              ${escapeHtml(project.name)}
            </option>
          `,
        )
        .join("")
    : '<option value="">No projects available</option>';

  const projectMeta =
    state.projects.find((project) => project.id === state.projectId) || null;

  return `
    <section class="surface">
      <label for="projectSelect">Select Project</label>
      <select id="projectSelect" data-action="project-select" ${!state.projects.length ? "disabled" : ""}>
        ${options}
      </select>
      <p class="surface__meta">
        ${projectMeta ? `${escapeHtml(projectMeta.workspace.name)} · ${projectMeta.taskCount} tasks` : "Choose a project to view tasks."}
      </p>
    </section>
  `;
};

const TaskCard = (task) => `
  <article class="task-card">
    <div>
      <h3 class="task-card__title">${escapeHtml(task.title)}</h3>
      <p class="task-card__description">${escapeHtml(task.description || "No description provided.")}</p>
    </div>
    <div class="badges">
      <span class="badge badge-status-${escapeHtml(task.status)}">${escapeHtml(formatLabel(task.status))}</span>
      <span class="badge badge-priority-${escapeHtml(task.priority)}">${escapeHtml(formatLabel(task.priority))}</span>
    </div>
    <div class="task-card__footer">
      <p class="task-card__date">Due ${escapeHtml(prettyDate(task.dueDate))}</p>
      <div class="task-card__actions">
        <select data-action="update-task-status" data-task-id="${escapeHtml(task.id)}">
          ${TASK_STATUSES.map(
            (status) =>
              `<option value="${status}" ${status === task.status ? "selected" : ""}>${formatLabel(status)}</option>`,
          ).join("")}
        </select>
        <button type="button" class="btn btn-ghost" data-action="delete-task" data-task-id="${escapeHtml(task.id)}">
          Delete
        </button>
      </div>
    </div>
  </article>
`;

const TaskList = () => {
  if (!state.projectId) {
    return '<div class="empty-state">Select a project to get started.</div>';
  }

  if (state.loadingTasks) {
    return '<div class="loading-state">Loading tasks...</div>';
  }

  if (!state.tasks.length) {
    return '<div class="empty-state">No tasks yet. Create your first task for this project.</div>';
  }

  return `<div class="task-list">${state.tasks.map(TaskCard).join("")}</div>`;
};

const CreateTaskModal = () => `
  <div class="modal" ${!state.modalOpen ? "hidden" : ""}>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="createTaskHeading">
      <div class="modal__head">
        <div>
          <h2 id="createTaskHeading" class="modal__title">Create Task</h2>
          <p class="modal__subtitle">Add details and assign priority to keep your project moving.</p>
        </div>
        <button class="btn btn-ghost" type="button" data-action="close-create-modal">Close</button>
      </div>
      <form id="createTaskForm" class="auth-form" novalidate>
        <label>
          Title
          <input name="title" type="text" maxlength="255" required />
        </label>
        <label>
          Description
          <textarea name="description" rows="3" maxlength="5000"></textarea>
        </label>
        <div class="grid-2">
          <label>
            Status
            <select name="status">
              ${TASK_STATUSES.map((status) => `<option>${status}</option>`).join("")}
            </select>
          </label>
          <label>
            Priority
            <select name="priority">
              ${TASK_PRIORITIES.map(
                (priority) =>
                  `<option ${priority === "MEDIUM" ? "selected" : ""}>${priority}</option>`,
              ).join("")}
            </select>
          </label>
        </div>
        <label>
          Due date
          <input name="dueDate" type="date" />
        </label>
        <button type="submit" class="btn btn-primary" ${!state.projectId ? "disabled" : ""}>Create Task</button>
      </form>
    </div>
  </div>
`;

const AuthCard = () => {
  const isLogin = state.authMode === "login";

  return `
    <main class="auth-shell">
      <section class="auth-card">
        <div class="auth-card__heading">
          <h2>${isLogin ? "Welcome back" : "Create your account"}</h2>
          <p>${isLogin ? "Sign in to continue to your workspace." : "Join your workspace and start organizing tasks."}</p>
        </div>

        <div class="auth-switch" role="tablist" aria-label="Authentication mode">
          <button type="button" class="btn ${isLogin ? "btn-primary" : "btn-secondary"}" data-action="switch-auth" data-mode="login">Login</button>
          <button type="button" class="btn ${!isLogin ? "btn-primary" : "btn-secondary"}" data-action="switch-auth" data-mode="register">Register</button>
        </div>

        ${
          isLogin
            ? `
            <form id="loginForm" class="auth-form" novalidate>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" required />
              </label>
              <button type="submit" class="btn btn-primary">Login</button>
            </form>
          `
            : `
            <form id="registerForm" class="auth-form" novalidate>
              <label>
                Name
                <input name="name" type="text" minlength="2" maxlength="100" required />
              </label>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" minlength="8" required />
              </label>
              <button type="submit" class="btn btn-primary">Create account</button>
            </form>
          `
        }
      </section>
    </main>
  `;
};

const Dashboard = () => `
  <div class="dashboard-shell app-shell">
    ${Sidebar()}
    <main class="main-content">
      ${Header()}
      ${ProjectSelector()}
      <section class="surface" aria-live="polite">
        <div class="task-header">
          <h2 class="surface__title">Task List</h2>
        </div>
        ${TaskList()}
      </section>
    </main>
    ${CreateTaskModal()}
  </div>
`;

const render = () => {
  if (state.appLoading) {
    els.app.innerHTML = '<main class="auth-shell"><div class="loading-state">Loading workspace...</div></main>';
    return;
  }

  els.app.innerHTML = state.currentUser ? Dashboard() : AuthCard();
};

const loadProjects = async () => {
  state.loadingProjects = true;
  render();

  try {
    const data = await apiFetch("/api/projects", {
      method: "GET",
    });

    state.projects = data.projects || [];

    if (!state.projects.some((project) => project.id === state.projectId)) {
      state.projectId = state.projects[0]?.id || "";
    }

    if (state.projectId) {
      await loadTasks(state.projectId);
    } else {
      state.tasks = [];
      render();
    }
  } finally {
    state.loadingProjects = false;
    render();
  }
};

const loadTasks = async (projectId) => {
  if (!projectId) {
    state.tasks = [];
    render();
    return;
  }

  state.loadingTasks = true;
  render();

  try {
    const data = await apiFetch(`/api/projects/${projectId}/tasks`, {
      method: "GET",
    });
    state.tasks = data.tasks;
  } finally {
    state.loadingTasks = false;
    render();
  }
};

const login = async (form) => {
  const formData = new FormData(form);
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    }),
  });

  setAccessToken(data.accessToken);
  state.currentUser = data.user;
  notify("Login successful.");
  await loadProjects();
};

const register = async (form) => {
  const formData = new FormData(form);
  await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    }),
  });

  notify("Registration complete. You can now log in.");
  state.authMode = "login";
  render();
};

const createTask = async (form) => {
  if (!state.projectId) {
    throw new Error("Select a project before creating tasks.");
  }

  const formData = new FormData(form);

  await apiFetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      projectId: state.projectId,
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
      status: String(formData.get("status") || "TODO"),
      priority: String(formData.get("priority") || "MEDIUM"),
      dueDate: toIsoDateOrNull(String(formData.get("dueDate") || "")),
    }),
  });

  notify("Task created successfully.");
  state.modalOpen = false;
  await loadTasks(state.projectId);
};

const updateTaskStatus = async (taskId, status) => {
  await apiFetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  );
  notify("Task updated.");
  render();
};

const deleteTask = async (taskId) => {
  await apiFetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });

  notify("Task deleted.");
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  render();
};

els.app.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action } = button.dataset;

  try {
    if (action === "switch-auth") {
      state.authMode = button.dataset.mode === "register" ? "register" : "login";
      render();
    }

    if (action === "open-create-modal") {
      state.modalOpen = true;
      render();
    }

    if (action === "close-create-modal") {
      state.modalOpen = false;
      render();
    }

    if (action === "logout") {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });

      setAccessToken("");
      state.currentUser = null;
      state.projects = [];
      state.tasks = [];
      state.projectId = "";
      state.modalOpen = false;
      notify("Logged out.");
      render();
    }

    if (action === "delete-task") {
      await deleteTask(button.dataset.taskId);
    }
  } catch (error) {
    notify(error.message, "error");
  }
});

els.app.addEventListener("change", async (event) => {
  const target = event.target;

  try {
    if (target.matches('[data-action="project-select"]')) {
      state.projectId = target.value;
      await loadTasks(state.projectId);
    }

    if (target.matches('[data-action="update-task-status"]')) {
      await updateTaskStatus(target.dataset.taskId, target.value);
    }
  } catch (error) {
    notify(error.message, "error");
  }
});

els.app.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.target;

  try {
    if (form.id === "loginForm") {
      await login(form);
      return;
    }

    if (form.id === "registerForm") {
      await register(form);
      return;
    }

    if (form.id === "createTaskForm") {
      await createTask(form);
      return;
    }
  } catch (error) {
    notify(error.message, "error");
  }
});

const bootstrap = async () => {
  render();

  if (!state.accessToken) {
    state.appLoading = false;
    render();
    return;
  }

  try {
    const data = await apiFetch("/api/auth/me", {
      method: "GET",
    });

    state.currentUser = data.user;
    await loadProjects();
  } catch {
    setAccessToken("");
    state.currentUser = null;
    state.projects = [];
    state.tasks = [];
    state.projectId = "";
  } finally {
    state.appLoading = false;
    render();
  }
};

bootstrap();
