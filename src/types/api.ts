export type RoleEnum = 'super_admin' | 'admin' | 'doctor' | 'ta' | 'student';

export const ROLE_ID_MAP: Record<RoleEnum, number> = {
  super_admin: 1,
  admin: 2,
  doctor: 3,
  ta: 4,
  student: 5,
};

export const ROLE_NAME_MAP: Record<number, RoleEnum> = {
  1: 'super_admin',
  2: 'admin',
  3: 'doctor',
  4: 'ta',
  5: 'student',
};

export type Department = 'engineering' | 'computer_science' | 'business_administration';

export type Track = 'AI' | 'CyberSecurity' | 'WebDevelopment' | 'Flutter' | 'UiUX';

export type InstructorRole = 'doctor' | 'ta';

export type MaterialType = 'pdf' | 'link' | 'image' | 'document';

export type DeliveryMethod = 'in_lecture' | 'external_link';

export type NotificationType = 'general' | 'grade' | 'assignment' | 'course' | 'system' | 'announcement';

export type NotificationTargetType = 'all' | 'course_specific' | 'specific_users' | 'student_range';

export interface UserRole {
  id: number;
  name: RoleEnum;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  username?: string;
  role: UserRole;
  department?: Department;
  avatar_url?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: number;
  name?: string;
  code: string;
  title_ar: string;
  title_en?: string;
  department: Department;
  description?: string;
  credit_hours?: number;
  academic_year?: number;
  semester?: number;
  is_active?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  instructors?: CourseInstructor[];
  chapters?: Chapter[];
}

export interface CourseInstructor {
  id: number;
  course_id: number;
  user_id: number;
  role: InstructorRole;
  user?: User;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order: number;
  created_at?: string;
  updated_at?: string;
  materials?: Material[];
}

export interface Material {
  id: number;
  chapter_id: number;
  title: string;
  description?: string;
  type: MaterialType;
  file_url?: string;
  external_link?: string;
  created_at?: string;
}

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  due_date: string;
  max_score: number;
  delivery_method: DeliveryMethod;
  external_link?: string;
  file_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  student_number: string;
  department: Department;
  track: Track;
  gpa?: number;
  avatar_url?: string;
  user?: User;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  target_type: NotificationTargetType;
  is_read?: boolean;
  created_at?: string;
}

export interface DashboardSuperAdmin {
  total_users: number;
  total_courses: number;
  total_students: number;
  total_doctors: number;
  total_tas: number;
  total_admins: number;
  department_stats?: {
    department: Department;
    student_count: number;
    doctor_count: number;
    ta_count: number;
    course_count: number;
  }[];
}

export interface DashboardAdmin {
  department: Department;
  total_students: number;
  total_doctors: number;
  total_tas: number;
  total_courses: number;
  course_stats?: {
    course_id: number;
    course_code: string;
    course_name: string;
    student_count: number;
  }[];
}

export interface DashboardDoctor {
  active_courses: number;
  total_students: number;
  recent_assignments: number;
  courses?: {
    id: number;
    code: string;
    title_ar: string;
    student_count: number;
    assignment_count: number;
  }[];
}

export interface DashboardTA {
  assigned_courses_count: number;
  total_chapters_count: number;
  total_materials_count: number;
  total_assignments_count: number;
  courses: Course[];
}

export interface NormalizedPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: NormalizedPagination;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
}
