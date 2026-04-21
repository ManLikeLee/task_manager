const ROUTES = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your workspace" },
  "/projects": { title: "Projects", subtitle: "Plan, track, and ship with clarity" },
  "/tasks": { title: "Tasks", subtitle: "Manage execution on a kanban board" },
};

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const KANBAN_COLUMNS = [
  { key: "todo", title: "Todo", statuses: ["TODO", "BLOCKED"] },
  { key: "progress", title: "In Progress", statuses: ["IN_PROGRESS", "IN_REVIEW"] },
  { key: "done", title: "Done", statuses: ["DONE"] },
];

const state = {
  accessToken: localStorage.getItem("accessToken") || "",
  currentUser: null,
  route: "/dashboard",
  sidebarOpen: false,
  authMode: "login",
  projects: [],
  tasks: [],
  selectedProjectId: "",
  projectFilter: "",
  overview: {
    stats: {
      totalProjects: 0,
      totalTasks: 0,
      inProgress: 0,
      dueToday: 0,
    },
    recentActivity: [],
  },
  loadingApp: true,
  loadingProjects: false,
  loadingTasks: false,
  loadingOverview: false,
  createProjectModalOpen: false,
  createTaskModalOpen: false,
};

const DEV_API_BASE_CANDIDATES =
  window.location.hostname === "localhost" && window.location.port === "3000"
    ? ["http://127.0.0.1:5050", "http://localhost:5050", "http://127.0.0.1:5000", "http://localhost:5000", ""]
    : [""];

let activeApiBaseUrl = sessionStorage.getItem("taskforceApiBaseUrl") || "";

const apiUrl = (path, baseUrl = activeApiBaseUrl) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  }

  return `${baseUrl}${path}`;
};

const fetchApi = async (path, options = {}) => {
  const candidateBases = [...new Set([activeApiBaseUrl, ...DEV_API_BASE_CANDIDATES])];
  let lastError = null;

  for (const baseUrl of candidateBases) {
    try {
      const response = await fetch(apiUrl(path, baseUrl), options);
      const contentType = String(response.headers.get("content-type") || "").toLowerCase();
      const isJson = contentType.includes("application/json");

      if (!isJson && candidateBases.length > 1) {
        lastError = new Error("Unexpected server response.");
        continue;
      }

      if (baseUrl !== activeApiBaseUrl) {
        activeApiBaseUrl = baseUrl;
        sessionStorage.setItem("taskforceApiBaseUrl", activeApiBaseUrl);
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to reach the backend API.");
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

const routeMeta = () => ROUTES[state.route] || ROUTES["/dashboard"];

const initials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "TF";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const toIsoDateOrNull = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
};

const prettyDate = (value, withTime = false) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "-";

  if (withTime) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeRoute = (path) => {
  if (path === "/") return "/dashboard";
  if (Object.prototype.hasOwnProperty.call(ROUTES, path)) return path;
  return "/dashboard";
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
  const response = await fetchApi("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
};

const clearSessionState = () => {
  setAccessToken("");
  state.currentUser = null;
  state.projects = [];
  state.tasks = [];
  state.selectedProjectId = "";
  state.projectFilter = "";
  state.overview = {
    stats: {
      totalProjects: 0,
      totalTasks: 0,
      inProgress: 0,
      dueToday: 0,
    },
    recentActivity: [],
  };
  state.createProjectModalOpen = false;
  state.createTaskModalOpen = false;
};

const apiFetch = async (path, options = {}, retried = false) => {
  const response = await fetchApi(path, {
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
      clearSessionState();
      render();
    }
  }

  return parseResponse(response);
};

const selectedProject = () =>
  state.projects.find((project) => project.id === state.selectedProjectId) || null;

const filteredProjects = () => {
  const query = state.projectFilter.trim().toLowerCase();

  if (!query) return state.projects;

  return state.projects.filter((project) => {
    const name = String(project.name || "").toLowerCase();
    const description = String(project.description || "").toLowerCase();
    return name.includes(query) || description.includes(query);
  });
};

const boardStatus = (status) => {
  if (status === "IN_REVIEW") return "IN_PROGRESS";
  if (status === "BLOCKED") return "TODO";
  return status;
};

const groupedTasks = () =>
  KANBAN_COLUMNS.map((column) => ({
    ...column,
    tasks: state.tasks.filter((task) => column.statuses.includes(task.status)),
  }));

const routeWithQuery = (path, query = {}) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, value);
    }
  }

  const normalizedPath = normalizeRoute(path);
  const queryString = params.toString();
  return `${normalizedPath}${queryString ? `?${queryString}` : ""}`;
};

const readRouteFromLocation = () => {
  const hashValue = String(window.location.hash || "").replace(/^#/, "");

  if (hashValue) {
    const [hashPath = "/", hashQuery = ""] = hashValue.split("?");

    return {
      path: hashPath || "/",
      searchParams: new URLSearchParams(hashQuery),
    };
  }

  return {
    path: window.location.pathname,
    searchParams: new URLSearchParams(window.location.search),
  };
};

const navigate = (path, query = {}, replace = false) => {
  const normalizedPath = normalizeRoute(path);
  const target = routeWithQuery(normalizedPath, query);
  const locationWithHash = `/#${target}`;

  if (replace) {
    window.history.replaceState({}, "", locationWithHash);
  } else {
    window.history.pushState({}, "", locationWithHash);
  }

  syncRouteFromLocation();
  handleRouteData();
  render();
};

const syncRouteFromLocation = () => {
  const { path, searchParams } = readRouteFromLocation();
  const nextRoute = normalizeRoute(path);

  state.route = nextRoute;

  if (nextRoute !== "/tasks") {
    return;
  }

  const projectId = searchParams.get("projectId") || "";

  if (projectId) {
    state.selectedProjectId = projectId;
  }
};

const SkeletonCards = (count = 4) =>
  `<div class="skeleton-grid">${Array.from({ length: count })
    .map(() => '<div class="skeleton-card"></div>')
    .join("")}</div>`;

const Sidebar = () => {
  const userName = state.currentUser?.name || "TaskForce User";

  return `
    <aside class="sidebar ${state.sidebarOpen ? "is-open" : ""}">
      <div class="sidebar__brand">TaskForce</div>

      <nav class="sidebar__nav" aria-label="Main navigation">
        ${Object.entries(ROUTES)
          .map(
            ([path, meta]) => `
            <button
              type="button"
              class="nav-link ${state.route === path ? "is-active" : ""}"
              data-action="navigate"
              data-route="${path}"
            >
              ${meta.title}
            </button>
          `,
          )
          .join("")}
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar-user">
          <div class="avatar">${escapeHtml(initials(userName))}</div>
          <div>
            <p class="sidebar-user__name">${escapeHtml(userName)}</p>
            <p class="sidebar-user__sub">Workspace user</p>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-full" data-action="logout">Logout</button>
      </div>
    </aside>
  `;
};

const Header = () => {
  const userName = state.currentUser?.name || "TaskForce User";

  return `
    <header class="top-header">
      <div class="top-header__left">
        <button type="button" class="menu-toggle" data-action="toggle-sidebar" aria-label="Open navigation">
          <span></span><span></span><span></span>
        </button>
        <div>
          <h1>${routeMeta().title}</h1>
          <p>${routeMeta().subtitle}</p>
        </div>
      </div>

      <div class="top-header__right">
        <button
          type="button"
          class="btn btn-primary"
          data-action="open-create-task"
          ${!state.projects.length ? "disabled" : ""}
        >
          New Task
        </button>
        <div class="top-user">
          <div class="avatar">${escapeHtml(initials(userName))}</div>
          <span>${escapeHtml(userName)}</span>
        </div>
      </div>
    </header>
  `;
};

const StatsCard = (label, value) => `
  <article class="stats-card">
    <p class="stats-card__label">${escapeHtml(label)}</p>
    <p class="stats-card__value">${escapeHtml(value)}</p>
  </article>
`;

const ActivityList = () => {
  if (state.loadingOverview) {
    return SkeletonCards(3);
  }

  if (!state.overview.recentActivity.length) {
    return '<div class="empty-state">No recent activity yet.</div>';
  }

  return `
    <div class="activity-list">
      ${state.overview.recentActivity
        .map(
          (item) => `
          <article class="activity-item">
            <div>
              <p class="activity-item__title">${escapeHtml(item.taskTitle)}</p>
              <p class="activity-item__meta">${escapeHtml(item.action)} in ${escapeHtml(item.projectName)}</p>
            </div>
            <time class="activity-item__time">${escapeHtml(prettyDate(item.timestamp, true))}</time>
          </article>
        `,
        )
        .join("")}
    </div>
  `;
};

const DashboardPage = () => {
  const stats = state.overview.stats;

  return `
    <section class="page-stack">
      <section class="stats-grid">
        ${StatsCard("Total Projects", String(stats.totalProjects))}
        ${StatsCard("Total Tasks", String(stats.totalTasks))}
        ${StatsCard("In Progress", String(stats.inProgress))}
        ${StatsCard("Due Today", String(stats.dueToday))}
      </section>

      <section class="panel">
        <div class="panel__header">
          <h2>Recent Activity</h2>
        </div>
        ${ActivityList()}
      </section>

      <section class="panel">
        <div class="panel__header">
          <h2>Quick Actions</h2>
        </div>
        <div class="quick-actions">
          <button class="btn btn-secondary" type="button" data-action="open-create-project">Create Project</button>
          <button class="btn btn-primary" type="button" data-action="open-create-task" ${!state.projects.length ? "disabled" : ""}>Create Task</button>
        </div>
      </section>
    </section>
  `;
};

const ProjectCard = (project) => `
  <article class="project-card" data-action="open-project-tasks" data-project-id="${escapeHtml(project.id)}" role="button" tabindex="0">
    <h3>${escapeHtml(project.name)}</h3>
    <p class="project-card__description">${escapeHtml(project.description || "No description")}</p>
    <div class="project-card__meta">
      <span>${escapeHtml(String(project.taskCount))} tasks</span>
      <span>${escapeHtml(prettyDate(project.createdAt))}</span>
    </div>
  </article>
`;

const ProjectsPage = () => {
  if (state.loadingProjects) {
    return SkeletonCards(6);
  }

  if (!state.projects.length) {
    return `
      <div class="empty-state">
        <p>No projects yet</p>
        <button type="button" class="btn btn-primary" data-action="open-create-project">New Project</button>
      </div>
    `;
  }

  return `
    <section class="page-stack">
      <div class="page-actions">
        <button type="button" class="btn btn-primary" data-action="open-create-project">New Project</button>
      </div>
      <section class="projects-grid">
        ${state.projects.map((project) => ProjectCard(project)).join("")}
      </section>
    </section>
  `;
};

const priorityClass = (priority) => {
  if (priority === "HIGH" || priority === "URGENT") return "priority-high";
  if (priority === "MEDIUM") return "priority-medium";
  return "priority-low";
};

const TaskCard = (task) => `
  <article class="task-card">
    <div>
      <h4>${escapeHtml(task.title)}</h4>
      <p>${escapeHtml(task.description || "No description")}</p>
    </div>
    <div class="task-card__meta-row">
      <span class="priority-badge ${priorityClass(task.priority)}">${escapeHtml(task.priority || "LOW")}</span>
      <span class="task-card__due">Due ${escapeHtml(prettyDate(task.dueDate))}</span>
    </div>
    <label class="inline-label">
      Move to
      <select data-action="task-status" data-task-id="${escapeHtml(task.id)}">
        ${TASK_STATUSES.map(
          (status) =>
            `<option value="${status}" ${boardStatus(task.status) === status ? "selected" : ""}>${status.replace("_", " ")}</option>`,
        ).join("")}
      </select>
    </label>
  </article>
`;

const Column = (column) => `
  <section class="kanban-column">
    <header class="kanban-column__header">
      <h3>${escapeHtml(column.title)}</h3>
      <span>${column.tasks.length}</span>
    </header>
    <div class="kanban-column__body">
      ${
        column.tasks.length
          ? column.tasks.map((task) => TaskCard(task)).join("")
          : '<div class="kanban-empty">No tasks yet</div>'
      }
    </div>
  </section>
`;

const KanbanBoard = () => {
  if (!state.selectedProjectId) {
    return '<div class="empty-state">No projects yet</div>';
  }

  if (state.loadingTasks) {
    return SkeletonCards(3);
  }

  if (!state.tasks.length) {
    return '<div class="empty-state">No tasks yet</div>';
  }

  return `<div class="kanban-board">${groupedTasks().map((column) => Column(column)).join("")}</div>`;
};

const TasksPage = () => {
  const projects = filteredProjects();

  return `
    <section class="page-stack">
      <section class="panel">
        <div class="task-toolbar">
          <label>
            Search Projects
            <input type="search" data-action="project-filter" value="${escapeHtml(state.projectFilter)}" placeholder="Filter projects" />
          </label>
          <label>
            Select Project
            <select data-action="project-select" ${projects.length ? "" : "disabled"}>
              ${
                projects.length
                  ? projects
                      .map(
                        (project) =>
                          `<option value="${project.id}" ${project.id === state.selectedProjectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`,
                      )
                      .join("")
                  : '<option value="">No projects yet</option>'
              }
            </select>
          </label>
        </div>
      </section>

      ${KanbanBoard()}
    </section>
  `;
};

const CreateProjectModal = () => `
  <div class="modal ${state.createProjectModalOpen ? "is-open" : ""}">
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="createProjectTitle">
      <header class="modal__header">
        <h2 id="createProjectTitle">Create Project</h2>
        <button type="button" class="btn btn-ghost" data-action="close-create-project">Cancel</button>
      </header>
      <form id="createProjectForm" class="modal__form">
        <label>
          Name
          <input name="name" type="text" maxlength="120" required />
        </label>
        <label>
          Description
          <textarea name="description" rows="4" maxlength="2000"></textarea>
        </label>
        <div class="modal__actions">
          <button type="button" class="btn btn-ghost" data-action="close-create-project">Cancel</button>
          <button type="submit" class="btn btn-primary">Create</button>
        </div>
      </form>
    </div>
  </div>
`;

const CreateTaskModal = () => `
  <div class="modal ${state.createTaskModalOpen ? "is-open" : ""}">
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="createTaskTitle">
      <header class="modal__header">
        <h2 id="createTaskTitle">Create Task</h2>
        <button type="button" class="btn btn-ghost" data-action="close-create-task">Cancel</button>
      </header>
      <form id="createTaskForm" class="modal__form">
        <label>
          Project
          <select name="projectId" required>
            ${state.projects
              .map(
                (project) =>
                  `<option value="${project.id}" ${project.id === state.selectedProjectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`,
              )
              .join("")}
          </select>
        </label>
        <label>
          Title
          <input name="title" type="text" maxlength="255" required />
        </label>
        <label>
          Description
          <textarea name="description" rows="4" maxlength="5000"></textarea>
        </label>
        <div class="split-grid">
          <label>
            Status
            <select name="status">
              ${TASK_STATUSES.map((status) => `<option value="${status}">${status.replace("_", " ")}</option>`).join("")}
            </select>
          </label>
          <label>
            Priority
            <select name="priority">
              ${TASK_PRIORITIES.map((priority) => `<option value="${priority}">${priority}</option>`).join("")}
            </select>
          </label>
          <label>
            Due date
            <input name="dueDate" type="date" />
          </label>
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn-ghost" data-action="close-create-task">Cancel</button>
          <button type="submit" class="btn btn-primary">Create</button>
        </div>
      </form>
    </div>
  </div>
`;

const AuthPage = () => {
  const isLogin = state.authMode === "login";

  return `
    <main class="auth-shell">
      <section class="auth-card">
        <h1>TaskForce</h1>
        <p>Minimal task operations for focused teams.</p>
        <div class="auth-switch">
          <button class="btn ${isLogin ? "btn-primary" : "btn-secondary"}" type="button" data-action="switch-auth" data-mode="login">Login</button>
          <button class="btn ${!isLogin ? "btn-primary" : "btn-secondary"}" type="button" data-action="switch-auth" data-mode="register">Register</button>
        </div>

        ${
          isLogin
            ? `
            <form id="loginForm" class="auth-form">
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" required />
              </label>
              <button class="btn btn-primary" type="submit">Login</button>
            </form>
          `
            : `
            <form id="registerForm" class="auth-form">
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
              <button class="btn btn-primary" type="submit">Create account</button>
            </form>
          `
        }
      </section>
    </main>
  `;
};

const MainContent = () => {
  if (state.route === "/projects") return ProjectsPage();
  if (state.route === "/tasks") return TasksPage();
  return DashboardPage();
};

const AppShell = () => `
  <div class="app-shell">
    <div class="sidebar-overlay ${state.sidebarOpen ? "is-open" : ""}" data-action="close-sidebar"></div>
    ${Sidebar()}

    <section class="main-shell">
      ${Header()}
      <main class="content">${MainContent()}</main>
    </section>

    ${CreateProjectModal()}
    ${CreateTaskModal()}
  </div>
`;

const render = () => {
  if (state.loadingApp) {
    els.app.innerHTML = '<main class="auth-shell"><div class="empty-state">Loading TaskForce...</div></main>';
    return;
  }

  els.app.innerHTML = state.currentUser ? AppShell() : AuthPage();
};

const loadProjects = async () => {
  state.loadingProjects = true;
  render();

  try {
    const data = await apiFetch("/api/projects", { method: "GET" });
    state.projects = data.projects || [];

    if (!state.projects.some((project) => project.id === state.selectedProjectId)) {
      state.selectedProjectId = state.projects[0]?.id || "";
    }
  } finally {
    state.loadingProjects = false;
    render();
  }
};

const loadDashboardOverview = async () => {
  state.loadingOverview = true;
  render();

  try {
    const data = await apiFetch("/api/dashboard/overview", { method: "GET" });
    state.overview = {
      stats: data.stats || state.overview.stats,
      recentActivity: data.recentActivity || [],
    };
  } finally {
    state.loadingOverview = false;
    render();
  }
};

const loadTasksForProject = async (projectId) => {
  if (!projectId) {
    state.tasks = [];
    render();
    return;
  }

  state.loadingTasks = true;
  render();

  try {
    const data = await apiFetch(`/api/projects/${projectId}/tasks`, { method: "GET" });
    state.tasks = data.tasks || [];
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

  await Promise.all([loadProjects(), loadDashboardOverview()]);
  await handleRouteData();
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

const createProject = async (form) => {
  const formData = new FormData(form);

  const data = await apiFetch("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
    }),
  });

  notify("Project created.");
  state.createProjectModalOpen = false;

  await Promise.all([loadProjects(), loadDashboardOverview()]);

  if (data.project?.id) {
    state.selectedProjectId = data.project.id;
  }

  navigate("/tasks", { projectId: state.selectedProjectId });
};

const createTask = async (form) => {
  const formData = new FormData(form);
  const projectId = String(formData.get("projectId") || "").trim();

  if (!projectId) {
    throw new Error("Select a project first.");
  }

  await apiFetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      projectId,
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
      status: String(formData.get("status") || "TODO"),
      priority: String(formData.get("priority") || "LOW"),
      dueDate: toIsoDateOrNull(String(formData.get("dueDate") || "")),
    }),
  });

  state.createTaskModalOpen = false;
  state.selectedProjectId = projectId;

  notify("Task created.");

  await Promise.all([loadProjects(), loadDashboardOverview(), loadTasksForProject(projectId)]);

  if (state.route !== "/tasks") {
    navigate("/tasks", { projectId });
  } else {
    navigate("/tasks", { projectId }, true);
  }
};

const updateTaskStatus = async (taskId, status) => {
  await apiFetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  );

  notify("Task moved.");
  render();
  await loadDashboardOverview();
};

const handleRouteData = async () => {
  if (!state.currentUser) return;

  if (state.route === "/tasks") {
    const { searchParams } = readRouteFromLocation();
    const queryProjectId = searchParams.get("projectId") || "";

    if (queryProjectId && state.projects.some((project) => project.id === queryProjectId)) {
      state.selectedProjectId = queryProjectId;
    }

    if (!state.selectedProjectId && state.projects.length) {
      state.selectedProjectId = state.projects[0].id;
      navigate("/tasks", { projectId: state.selectedProjectId }, true);
      return;
    }

    await loadTasksForProject(state.selectedProjectId);
  }
};

els.app.addEventListener("click", async (event) => {
  const actionable = event.target.closest("[data-action]");
  if (!actionable) return;

  const action = actionable.dataset.action;

  try {
    if (action === "switch-auth") {
      state.authMode = actionable.dataset.mode === "register" ? "register" : "login";
      render();
      return;
    }

    if (action === "navigate") {
      state.sidebarOpen = false;
      navigate(actionable.dataset.route || "/dashboard");
      return;
    }

    if (action === "toggle-sidebar") {
      state.sidebarOpen = !state.sidebarOpen;
      render();
      return;
    }

    if (action === "close-sidebar") {
      state.sidebarOpen = false;
      render();
      return;
    }

    if (action === "open-create-project") {
      state.createProjectModalOpen = true;
      render();
      return;
    }

    if (action === "close-create-project") {
      state.createProjectModalOpen = false;
      render();
      return;
    }

    if (action === "open-create-task") {
      if (!state.selectedProjectId && state.projects.length) {
        state.selectedProjectId = state.projects[0].id;
      }

      state.createTaskModalOpen = true;
      render();
      return;
    }

    if (action === "close-create-task") {
      state.createTaskModalOpen = false;
      render();
      return;
    }

    if (action === "open-project-tasks") {
      const projectId = actionable.dataset.projectId;
      if (!projectId) return;

      state.selectedProjectId = projectId;
      navigate("/tasks", { projectId });
      return;
    }

    if (action === "logout") {
      await apiFetch("/api/auth/logout", { method: "POST" });
      clearSessionState();
      notify("Logged out.");
      render();
      return;
    }
  } catch (error) {
    notify(error.message, "error");
  }
});

els.app.addEventListener("keydown", (event) => {
  const projectCard = event.target.closest("[data-action='open-project-tasks']");

  if (!projectCard) return;

  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();

  const projectId = projectCard.dataset.projectId;
  if (!projectId) return;

  state.selectedProjectId = projectId;
  navigate("/tasks", { projectId });
});

els.app.addEventListener("input", (event) => {
  const target = event.target;

  if (target.matches('[data-action="project-filter"]')) {
    state.projectFilter = target.value;
    render();
  }
});

els.app.addEventListener("change", async (event) => {
  const target = event.target;

  try {
    if (target.matches('[data-action="project-select"]')) {
      state.selectedProjectId = target.value;
      navigate("/tasks", { projectId: state.selectedProjectId }, true);
      await loadTasksForProject(state.selectedProjectId);
      return;
    }

    if (target.matches('[data-action="task-status"]')) {
      const taskId = target.dataset.taskId;
      if (!taskId) return;

      await updateTaskStatus(taskId, target.value);
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
      render();
      return;
    }

    if (form.id === "registerForm") {
      await register(form);
      return;
    }

    if (form.id === "createProjectForm") {
      await createProject(form);
      return;
    }

    if (form.id === "createTaskForm") {
      await createTask(form);
    }
  } catch (error) {
    notify(error.message, "error");
  }
});

window.addEventListener("popstate", async () => {
  syncRouteFromLocation();
  render();
  await handleRouteData();
});

const bootstrap = async () => {
  const { path } = readRouteFromLocation();

  if (normalizeRoute(path) === "/dashboard" && !window.location.hash) {
    window.history.replaceState({}, "", "/#/dashboard");
  }

  syncRouteFromLocation();

  render();

  if (!state.accessToken) {
    state.loadingApp = false;
    render();
    return;
  }

  try {
    const data = await apiFetch("/api/auth/me", {
      method: "GET",
    });

    state.currentUser = data.user;

    await Promise.all([loadProjects(), loadDashboardOverview()]);
    await handleRouteData();
  } catch {
    clearSessionState();
  } finally {
    state.loadingApp = false;
    render();
  }
};

bootstrap();
