// Centralise les requêtes HTTP et les opérations sur les ressources de l'API.
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: options.credentials ?? "include",
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (cause) {
    const error = new Error("The CAMPUS LIFE API could not be reached.", {
      cause,
    });
    error.statusCode = 0;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("campus-life:unauthorized"));
    }
    const error = new Error(
      typeof payload === "object" && payload?.message
        ? payload.message
        : "The request could not be completed.",
    );
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}

const jsonOptions = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const collectionService = (path) => ({
  getAll: (params = {}, options = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    const suffix = query.toString();
    return apiRequest(`/${path}${suffix ? `?${suffix}` : ""}`, options);
  },
  create: (record) => apiRequest(`/${path}`, jsonOptions("POST", record)),
  update: (id, updates) =>
    apiRequest(
      `/${path}/${encodeURIComponent(id)}`,
      jsonOptions("PUT", updates),
    ),
  delete: (id) =>
    apiRequest(`/${path}/${encodeURIComponent(id)}`, { method: "DELETE" }),
});

const tasks = collectionService("tasks");
const courses = collectionService("courses");
const exams = collectionService("exams");
const announcements = collectionService("announcements");
const resources = collectionService("resources");
const notifications = collectionService("notifications");

export const api = {
  register: (credentials) =>
    apiRequest("/auth/register", jsonOptions("POST", credentials)),
  login: (credentials) =>
    apiRequest("/auth/login", jsonOptions("POST", credentials)),
  getCurrentUser: () => apiRequest("/auth/me"),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  changePassword: (passwords) =>
    apiRequest("/auth/password", jsonOptions("PUT", passwords)),
  getTasks: (params) => tasks.getAll(params),
  createTask: (record) => tasks.create(record),
  updateTask: (id, updates) => tasks.update(id, updates),
  deleteTask: (id) => tasks.delete(id),
  getCourses: (params) => courses.getAll(params),
  createCourse: (record) => courses.create(record),
  updateCourse: (id, updates) => courses.update(id, updates),
  deleteCourse: (id) => courses.delete(id),
  getExams: (params) => exams.getAll(params),
  createExam: (record) => exams.create(record),
  updateExam: (id, updates) => exams.update(id, updates),
  deleteExam: (id) => exams.delete(id),
  getAnnouncements: (params) => announcements.getAll(params),
  createAnnouncement: (record) => announcements.create(record),
  updateAnnouncement: (id, updates) => announcements.update(id, updates),
  deleteAnnouncement: (id) => announcements.delete(id),
  getAnnouncementComments: (id) =>
    apiRequest(`/announcements/${encodeURIComponent(id)}/comments`, {
      cache: "no-store",
    }),
  createAnnouncementComment: (id, content, parentId) =>
    apiRequest(
      `/announcements/${encodeURIComponent(id)}/comments`,
      jsonOptions("POST", {
        content,
        ...(parentId ? { parentId } : {}),
      }),
    ),
  toggleAnnouncementCommentLike: (commentId) =>
    apiRequest(
      `/announcements/comments/${encodeURIComponent(commentId)}/like`,
      jsonOptions("POST"),
    ),
  toggleAnnouncementLike: (id) =>
    apiRequest(
      `/announcements/${encodeURIComponent(id)}/like`,
      jsonOptions("POST"),
    ),
  getResources: (params) => resources.getAll(params),
  createResource: (record) => resources.create(record),
  updateResource: (id, updates) => resources.update(id, updates),
  deleteResource: (id) => resources.delete(id),
  getNotifications: (params) =>
    notifications.getAll(params, { cache: "no-store" }),
  setNotificationRead: (id, isRead) =>
    apiRequest(
      `/notifications/${encodeURIComponent(id)}/read`,
      jsonOptions("PATCH", { isRead }),
    ),
  createNotification: (record) => notifications.create(record),
  updateNotification: (id, updates) => notifications.update(id, updates),
  deleteNotification: (id) => notifications.delete(id),
  deleteSelectedNotifications: (ids) =>
    apiRequest(
      "/notifications/selected",
      jsonOptions("DELETE", { ids }),
    ),
  getProfile: () => apiRequest("/profile"),
  updateProfile: (profile) =>
    apiRequest("/profile", jsonOptions("PUT", profile)),
  replaceData: (data) => apiRequest("/data", jsonOptions("PUT", data)),
  clearData: () => apiRequest("/data", { method: "DELETE" }),
  getDashboardSummary: () => apiRequest("/dashboard/summary"),
};
