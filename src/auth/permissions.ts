import { RoleEnum, User, Course, StudentProfile } from '@/types/api';

export type PermissionAction =
  // Users Management
  | 'users.view'
  | 'users.create_admin'
  | 'users.create_doctor'
  | 'users.create_ta'
  | 'users.update'
  | 'users.delete'
  // Courses Management
  | 'courses.view'
  | 'courses.create'
  | 'courses.update'
  | 'courses.delete'
  // Instructors Assignment
  | 'instructors.assign_doctor'
  | 'instructors.assign_ta'
  | 'instructors.remove'
  // Chapters
  | 'chapters.view'
  | 'chapters.create'
  | 'chapters.update'
  | 'chapters.delete'
  // Materials
  | 'materials.view'
  | 'materials.create'
  | 'materials.update'
  | 'materials.delete'
  // Assignments
  | 'assignments.view'
  | 'assignments.create'
  | 'assignments.update'
  | 'assignments.delete'
  // Student Profiles
  | 'students.view_all'
  | 'students.view_all_profiles'
  | 'students.view_course_students'
  // Notifications
  | 'notifications.send'
  // Dashboards
  | 'dashboard.super_admin'
  | 'dashboard.admin'
  | 'dashboard.doctor'
  | 'dashboard.ta';

export type Action = PermissionAction;

export interface PermissionContext {
  user?: User | null;
  targetUser?: User;
  course?: Course;
  isCourseInstructor?: boolean;
  instructorRoleInCourse?: 'doctor' | 'ta';
}

export function can(action: PermissionAction, context: PermissionContext = {}): boolean {
  const { user, targetUser, isCourseInstructor } = context;

  if (!user || !user.role) return false;
  const role: string = user.role.name;

  // SUPER_ADMIN has full system bypass
  if (role === 'super_admin') return true;

  switch (action) {
    // ── USERS ───────────────────────────────────────────────────────
    case 'users.view':
      return ['admin'].includes(role);

    case 'users.create_admin':
    case 'users.create_doctor':
    case 'users.create_ta':
      return false; // Handled strictly by super_admin bypass

    case 'users.update':
    case 'users.delete':
      if (role !== 'admin') return false;
      if (!targetUser || !targetUser.role) return false;
      // ADMIN cannot edit/delete super_admin or other admin users
      if (['super_admin', 'admin'].includes(targetUser.role.name)) return false;
      // ADMIN cannot edit/delete users outside their department
      if (user.department && targetUser.department && user.department !== targetUser.department) return false;
      return true;

    // ── COURSES ─────────────────────────────────────────────────────
    case 'courses.view':
      return true;

    case 'courses.create':
      return ['admin', 'doctor'].includes(role);

    case 'courses.update':
    case 'courses.delete':
      if (role === 'admin') return true;
      if (role === 'doctor') return isCourseInstructor === true;
      return false;

    // ── INSTRUCTORS ─────────────────────────────────────────────────
    case 'instructors.assign_doctor':
      return role === 'admin';

    case 'instructors.assign_ta':
      if (role === 'admin') return true;
      if (role === 'doctor') return isCourseInstructor === true;
      return false;

    case 'instructors.remove':
      return role === 'admin';

    // ── CHAPTERS ──────────────────────────────────────────────────
    case 'chapters.view':
      return ['admin', 'doctor', 'ta'].includes(role);

    case 'chapters.create':
    case 'chapters.update':
      return ['admin', 'doctor', 'ta'].includes(role);

    case 'chapters.delete':
      return ['admin', 'doctor'].includes(role);

    // ── MATERIALS ─────────────────────────────────────────────────
    case 'materials.view':
      return ['admin', 'doctor', 'ta'].includes(role);

    case 'materials.create':
    case 'materials.update':
      return ['admin', 'doctor', 'ta'].includes(role);

    case 'materials.delete':
      return ['admin', 'doctor'].includes(role);

    // ── ASSIGNMENTS ───────────────────────────────────────────────
    case 'assignments.view':
    case 'assignments.create':
    case 'assignments.update':
    case 'assignments.delete':
      return ['doctor', 'ta'].includes(role);

    // ── STUDENTS ──────────────────────────────────────────────────
    case 'students.view_course_students':
      return ['admin', 'doctor'].includes(role);

    case 'students.view_all':
    case 'students.view_all_profiles':
      return ['admin'].includes(role);

    // ── NOTIFICATIONS ──────────────────────────────────────────────
    case 'notifications.send':
      return ['admin', 'doctor'].includes(role);

    // ── DASHBOARDS ─────────────────────────────────────────────────
    case 'dashboard.super_admin':
      return role === 'super_admin';
    case 'dashboard.admin':
      return role === 'admin';
    case 'dashboard.doctor':
      return role === 'doctor';
    case 'dashboard.ta':
      return role === 'ta';

    default:
      return false;
  }
}
