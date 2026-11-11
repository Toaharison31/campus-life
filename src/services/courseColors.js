export function getCourseColorIndex(course) {
  const identity = String(course?.id || course?.name || "course");
  let hash = 0;
  for (const character of identity) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % 8;
}

export function getCourseColorClass(course) {
  return `course-color-${getCourseColorIndex(course) + 1}`;
}
