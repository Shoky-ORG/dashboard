import { User, RoleEnum, Department, Course, InstructorRole } from '@/types/api';

export type PermissionAction =
  | 'users.view'
  | 'users.create_admin'
  | 'users.create_doctor'
  | 'users.create_ta'
  | 'users.update'
  | 'users.delete'
  | 'courses.view'
  | 'courses.create'
  | 'courses.update'
  | 'courses.delete'
  | 'instructors.view'
  | 'instructors.assign_doctor'
  | 'instructors.assign_ta'
  | 'instructors.remove'
  | 'chapters.view'
  | 'chapters.create'
  | 'chapters.update'
  | 'chapters.delete'
  | 'materials.view'
  | 'materials.create'
  | 'materials.update'
  | 'materials.delete'
  | 'assignments.view'
  | 'assignments.create'
  | 'assignments.update'
  | 'assignments.delete'
  | 'students.view_course_students'
  | 'students.view_all_profiles'
  | 'notifications.send'
  | 'dashboard.super_admin'
  | 'dashboard.admin'
  | 'dashboard.doctor'
  | 'dashboard.ta';

export interface PermissionContext {
  user?: User | null;
  targetUser?: User;
  course?: Course;
  isCourseInstructor?: boolean;
  instructorRoleInCourse?: InstructorRole;
}

export function can(action: PermissionAction, context?: PermissionContext): boolean {
  const currentUser = context?.user;
  if (!currentUser || !currentUser.role) return false;

  const role: RoleEnum = currentUser.role.name;

  // SUPER_ADMIN bypass: complete access to all features
  if (role === 'super_admin') return true;

  switch (action) {
    // ── DASHBOARD ACCESS ──────────────────────────────────────────
    case 'dashboard.super_admin':
      return false; // already checked super_admin above
    case 'dashboard.admin':
      return role === 'admin';
    case 'dashboard.doctor':
      return role === 'doctor';
    case 'dashboard.ta':
      return role === 'ta';

    // ── USER MANAGEMENT ───────────────────────────────────────────
    case 'users.view':
      return role === 'admin';
    
    case 'users.create_admin':
    case 'users.create_doctor':
    case 'users.create_ta':
      return false;

    case 'users.update':
    case 'users.delete': {
      if (role !== 'admin') return false;
      if (!context?.targetUser) return true;
      
      const targetUser = context.targetUser;
      const targetRole = targetUser.role?.name;
      
      // Admin cannot update/delete other admins or super_admins
      if (targetRole === 'admin' || targetRole === 'super_admin') return false;

      // Admin can only manage users in their own department
      if (currentUser.department && targetUser.department) {
        return currentUser.department === targetUser.department;
      }
      return true;
    }

    // ── COURSES ───────────────────────────────────────────────────
    case 'courses.view':
      return ['admin', 'doctor', 'ta'].includes(role);

    case 'courses.create':
      return ['admin', 'doctor'].includes(role);

    case 'courses.update':
    case 'courses.delete': {
      if (role === 'admin') return true;
      if (role === 'doctor') {
        if (context?.course && context.course.created_by) {
          return context.course.created_by === currentUser.id || context.isCourseInstructor === true;
        }
        return true;
      }
      return false;
    }

    // ── INSTRUCTORS MANAGEMENT ─────────────────────────────────────
    case 'instructors.view':
      return ['admin', 'doctor', 'ta'].includes(role);

    case 'instructors.assign_doctor':
      return role === 'admin';

    case 'instructors.assign_ta':
      if (role === 'admin') return true;
      if (role === 'doctor') {
        return context?.isCourseInstructor === true && context?.instructorRoleInCourse === 'doctor';
      }
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
      return ['admin', 'doctor', 'ta'].includes(role);

    case 'materials.update':
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

    case 'students.view_all_profiles':
      return ['admin', 'doctor'].includes(role);

    // ── NOTIFICATIONS ──────────────────────────────────────────────
    case 'notifications.send':
      return ['admin', 'doctor'].includes(role);

    default:
      return false;
  }
}
