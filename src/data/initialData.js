import { getLocalDateString } from '../services/dates'

const dateOffset = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return getLocalDateString(date)
}

export const initialData = {
  tasks: [
    { id: 'task-1', title: 'Submit database normalization report', description: 'Document the first three normal forms and include the revised schema.', dueDate: dateOffset(1), priority: 'High', status: 'Pending', createdAt: dateOffset(-2) },
    { id: 'task-2', title: 'Complete Calculus II problem set', description: 'Solve the integration exercises from chapter seven and show your working.', dueDate: dateOffset(3), priority: 'Medium', status: 'Pending', createdAt: dateOffset(-1) },
    { id: 'task-3', title: 'Review network protocols', description: 'Revise TCP, UDP, and the application layer before Friday’s lab.', dueDate: dateOffset(4), priority: 'Low', status: 'Pending', createdAt: dateOffset(-3) },
    { id: 'task-4', title: 'Read software design patterns', description: 'Review the Observer and Strategy patterns for the team discussion.', dueDate: dateOffset(-1), priority: 'Medium', status: 'Completed', createdAt: dateOffset(-5) },
    { id: 'task-5', title: 'Submit data structures quiz', description: 'Complete the online quiz on trees, heaps, and graph traversal.', dueDate: dateOffset(0), priority: 'High', status: 'Completed', createdAt: dateOffset(-4) },
  ],
  courses: [
    { id: 'course-1', name: 'Data Structures & Algorithms', day: 'Monday', startTime: '09:00', endTime: '10:30', classroom: 'Engineering B204', teacher: 'Dr. Sarah Chen' },
    { id: 'course-2', name: 'Calculus II', day: 'Monday', startTime: '13:00', endTime: '14:30', classroom: 'Science A112', teacher: 'Prof. James Wilson' },
    { id: 'course-3', name: 'Database Systems', day: 'Tuesday', startTime: '10:00', endTime: '11:30', classroom: 'Computing Lab C301', teacher: 'Dr. Amina Yusuf' },
    { id: 'course-4', name: 'Computer Networks', day: 'Wednesday', startTime: '09:30', endTime: '11:00', classroom: 'Engineering B108', teacher: 'Prof. Daniel Kim' },
    { id: 'course-5', name: 'Database Systems Lab', day: 'Thursday', startTime: '14:00', endTime: '16:00', classroom: 'Computing Lab C305', teacher: 'Dr. Amina Yusuf' },
    { id: 'course-6', name: 'Software Engineering', day: 'Friday', startTime: '11:00', endTime: '12:30', classroom: 'Technology D205', teacher: 'Dr. Elena Garcia' },
  ],
  announcements: [
    { id: 'announcement-1', title: 'Midterm examination timetable published', content: 'The midterm timetable is available through the student portal. Please check your room assignment and contact the Academic Office promptly if you find a scheduling conflict.', category: 'Academic', publishedAt: dateOffset(0), author: 'Academic Office' },
    { id: 'announcement-2', title: 'Library open until midnight during exams', content: 'From next Monday, the main library and designated study rooms will remain open until midnight. Bring your campus ID for after-hours entry.', category: 'Campus', publishedAt: dateOffset(-1), author: 'University Library' },
    { id: 'announcement-3', title: 'Student research showcase — Friday', content: 'Explore undergraduate research projects, meet faculty mentors, and hear short talks from this year’s student researchers in the Innovation Hall.', category: 'Events', publishedAt: dateOffset(-3), author: 'Student Affairs' },
    { id: 'announcement-4', title: 'Peer tutoring sign-ups are open', content: 'Book a free peer tutoring session in mathematics, programming, or writing through the Learning Centre. New appointments are added every week.', category: 'Academic', publishedAt: dateOffset(-5), author: 'Learning Centre' },
  ],
  resources: [
    { id: 'resource-1', title: 'MDN JavaScript Guide', description: 'A practical reference for JavaScript language features, objects, and browser APIs.', category: 'Programming', type: 'Documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', createdAt: dateOffset(-12) },
    { id: 'resource-2', title: 'Khan Academy: Integral Calculus', description: 'Short lessons and exercises on integration techniques and applications.', category: 'Mathematics', type: 'Course', url: 'https://www.khanacademy.org/math/calculus-1', createdAt: dateOffset(-11) },
    { id: 'resource-3', title: 'Computer Networking: A Top-Down Approach', description: 'Publisher resources and chapter materials for understanding internet protocols.', category: 'Networking', type: 'Book', url: 'https://gaia.cs.umass.edu/kurose_ross/index.php', createdAt: dateOffset(-9) },
    { id: 'resource-4', title: 'PostgreSQL Tutorial', description: 'Start with relational database concepts, SQL queries, and PostgreSQL examples.', category: 'Database', type: 'Documentation', url: 'https://www.postgresql.org/docs/current/tutorial.html', createdAt: dateOffset(-8) },
    { id: 'resource-5', title: 'Git Reference Manual', description: 'Official command reference for everyday version control and collaboration.', category: 'Documentation', type: 'Documentation', url: 'https://git-scm.com/docs', createdAt: dateOffset(-7) },
    { id: 'resource-6', title: 'MIT OpenCourseWare: Algorithms', description: 'Lecture notes, problem sets, and course materials on introductory algorithms.', category: 'Programming', type: 'Course', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/', createdAt: dateOffset(-6) },
    { id: 'resource-7', title: '3Blue1Brown: Essence of Linear Algebra', description: 'Visual explanations that build intuition for vectors, matrices, and transformations.', category: 'Mathematics', type: 'Video', url: 'https://www.3blue1brown.com/topics/linear-algebra', createdAt: dateOffset(-4) },
    { id: 'resource-8', title: 'Purdue Online Writing Lab', description: 'Guides for citation styles, research writing, and clear academic communication.', category: 'Other', type: 'Other', url: 'https://owl.purdue.edu/', createdAt: dateOffset(-2) },
  ],
}
