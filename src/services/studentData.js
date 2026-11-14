import { getLocalDateString } from "./dates.js";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getTaskStats(tasks, today = getLocalDateString()) {
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const pending = tasks.filter((task) => task.status !== "Completed").length;
  const overdue = tasks.filter(
    (task) => task.status !== "Completed" && task.dueDate < today,
  ).length;

  return {
    total: tasks.length,
    completed,
    pending,
    overdue,
    completion: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

export function getNextClass(courses, now = new Date()) {
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const todayName = weekdays[now.getDay()];
  const hasValidStartTime = (course) =>
    typeof course.startTime === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(course.startTime);
  const todayCourses = courses
    .filter((course) => course.day === todayName && hasValidStartTime(course))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcomingToday = todayCourses.find((course) => {
    const [hour, minute] = course.startTime.split(":").map(Number);
    return hour * 60 + minute >= minuteOfDay;
  });
  if (upcomingToday) return { ...upcomingToday, dayOffset: 0 };

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = weekdays[(now.getDay() + offset) % 7];
    const course = courses
      .filter((item) => item.day === day && hasValidStartTime(item))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    if (course) return { ...course, dayOffset: offset };
  }
  return null;
}

export function getClassesForDay(courses, date = new Date()) {
  const day = weekdays[date.getDay()];
  return courses
    .filter((course) => course.day === day)
    .sort((a, b) =>
      String(a.startTime || "").localeCompare(String(b.startTime || "")),
    );
}

export function getStudyStreak(tasks, now = new Date()) {
  const completedDays = new Set(
    tasks
      .filter((task) => task.status === "Completed")
      .map((task) => task.completedAt || task.createdAt)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date || "")),
  );
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!completedDays.has(getLocalDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (completedDays.has(getLocalDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getWeeklyActivity(tasks, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = getLocalDateString(date);
    const count = tasks.filter((task) => {
      if (task.status !== "Completed") return false;
      const completedDate = task.completedAt || task.createdAt;
      return completedDate === dateKey;
    }).length;
    return {
      date: dateKey,
      weekday: weekdays[date.getDay()],
      count,
    };
  });
}

export function getNotifications({
  tasks,
  courses,
  announcements,
  now = new Date(),
  preferences = {},
}) {
  const alerts = {
    events: true,
    deadlines: true,
    ...preferences,
  };
  const today = getLocalDateString(now);
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const deadlineLimit = getLocalDateString(dayAfterTomorrow);
  const notifications = [];

  if (alerts.deadlines)
    tasks.forEach((task) => {
      if (task.status === "Completed" || !task.dueDate) return;
      if (task.dueDate < today) {
        notifications.push({
          id: `overdue:${task.id}`,
          type: "overdue",
          title: task.title,
          date: task.dueDate,
          href: "/tasks",
        });
      } else if (task.dueDate === today) {
        notifications.push({
          id: `deadline:${task.id}`,
          type: "dueToday",
          title: task.title,
          date: task.dueDate,
          href: "/tasks",
        });
      } else if (task.dueDate <= deadlineLimit) {
        notifications.push({
          id: `deadline:${task.id}`,
          type: "deadline",
          title: task.title,
          date: task.dueDate,
          href: "/tasks",
        });
      }
    });

  announcements
    .filter(
      (item) =>
        ["URGENT", "HIGH"].includes(String(item.priority).toUpperCase()) &&
        !item.isRead,
    )
    .forEach((item) =>
      notifications.push({
        id: `announcement:${item.id}`,
        type: "announcement",
        title: item.title,
        date: item.publishedAt,
        href: "/announcements",
      }),
    );

  const nextClass = getNextClass(courses, now);
  if (alerts.events && nextClass && nextClass.dayOffset <= 1) {
    const classDate = new Date(now);
    classDate.setDate(classDate.getDate() + nextClass.dayOffset);
    notifications.push({
      id: `class:${nextClass.id}:${getLocalDateString(classDate)}`,
      type: "class",
      title: nextClass.name,
      date: getLocalDateString(classDate),
      time: nextClass.startTime,
      href: "/timetable",
    });
  }

  return notifications.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time || "").localeCompare(b.time || ""),
  );
}

export function getCampusAlerts({
  tasks,
  courses,
  exams,
  announcements,
  now = new Date(),
  preferences = {},
}) {
  const examLimit = new Date(now);
  examLimit.setDate(examLimit.getDate() + 7);
  const alerts = [
    ...getNotifications({ tasks, courses, announcements, now, preferences }),
    ...exams
      .filter(
        (exam) =>
          exam.examDate >= getLocalDateString(now) &&
          exam.examDate <= getLocalDateString(examLimit),
      )
      .map((exam) => ({
        id: `exam:${exam.id}`,
        type: "exam",
        title: exam.title,
        date: exam.examDate,
        time: exam.startTime,
        href: "/timetable",
      })),
  ];
  return alerts
    .map((alert) => ({ ...alert, isRead: false, derived: true }))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time || "").localeCompare(b.time || ""),
    );
}

export function searchCampus(
  query,
  { tasks, courses, announcements, resources },
) {
  const normalized = String(query || "")
    .trim()
    .toLocaleLowerCase();
  if (!normalized) return [];
  const matches = (value) =>
    String(value || "")
      .toLocaleLowerCase()
      .includes(normalized);

  return [
    ...tasks
      .filter((item) => matches(`${item.title} ${item.description || ""}`))
      .map((item) => ({
        type: "task",
        id: item.id,
        title: item.title,
        href: "/tasks",
      })),
    ...courses
      .filter((item) =>
        matches(`${item.name} ${item.teacher || ""} ${item.classroom || ""}`),
      )
      .map((item) => ({
        type: "course",
        id: item.id,
        title: item.name,
        href: "/timetable",
      })),
    ...announcements
      .filter((item) => matches(`${item.title} ${item.content || ""}`))
      .map((item) => ({
        type: "announcement",
        id: item.id,
        title: item.title,
        href: "/announcements",
      })),
    ...resources
      .filter((item) => matches(`${item.title} ${item.description || ""}`))
      .map((item) => ({
        type: "resource",
        id: item.id,
        title: item.title,
        href: "/resources",
      })),
  ];
}
