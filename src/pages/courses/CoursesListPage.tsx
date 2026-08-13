import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi, CreateCourseParams, UpdateCourseParams } from '@/api/courses';
import { Course, Department, NormalizedPagination } from '@/types/api';
import { useAuth } from '@/auth/AuthContext';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DepartmentBadge, Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { Plus, Search, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import './CoursesListPage.css';

export const CoursesListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formDepartment, setFormDepartment] = useState<Department>('computer_science');
  const [formCreditHours, setFormCreditHours] = useState('3');
  const [formAcademicYear, setFormAcademicYear] = useState('1');
  const [formSemester, setFormSemester] = useState('1');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourses = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await coursesApi.getCourses({
        page,
        limit: 10,
        search: search.trim() || undefined,
        department: departmentFilter || undefined,
      });
      setCourses(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to fetch courses', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [search, departmentFilter]);

  useEffect(() => {
    fetchCourses(1);
  }, [fetchCourses]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormCode('');
    setFormTitleAr('');
    setFormTitleEn('');
    setFormDepartment('computer_science');
    setFormCreditHours('3');
    setFormAcademicYear('1');
    setFormSemester('1');
    setFormDescription('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormCode(course.code);
    setFormTitleAr(course.title_ar);
    setFormTitleEn(course.title_en || (course as any).name || '');
    setFormDepartment(course.department);
    setFormCreditHours(String(course.credit_hours || 3));
    setFormAcademicYear(String(course.academic_year || 1));
    setFormSemester(String(course.semester || 1));
    setFormDescription(course.description || '');
    setFormIsActive(course.is_active !== false);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitleAr || !formCode) {
      setToast({ message: 'Course Code and Arabic Title are required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCourse) {
        const updatePayload: UpdateCourseParams = {
          code: formCode,
          title_ar: formTitleAr,
          title_en: formTitleEn || undefined,
          department: formDepartment,
          credit_hours: Number(formCreditHours) || 3,
          academic_year: Number(formAcademicYear) || 1,
          semester: Number(formSemester) || 1,
          description: formDescription || undefined,
          is_active: formIsActive,
        };
        await coursesApi.updateCourse(editingCourse.id, updatePayload);
        setToast({ message: 'Course updated successfully', type: 'success' });
      } else {
        const createPayload: CreateCourseParams = {
          code: formCode,
          title_ar: formTitleAr,
          title_en: formTitleEn || undefined,
          department: formDepartment,
          credit_hours: Number(formCreditHours) || 3,
          academic_year: Number(formAcademicYear) || 1,
          semester: Number(formSemester) || 1,
          description: formDescription || undefined,
          is_active: formIsActive,
        };
        await coursesApi.createCourse(createPayload);
        setToast({ message: 'Course created successfully', type: 'success' });
      }
      setIsModalOpen(false);
      fetchCourses(pagination.page);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Operation failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: number, code: string) => {
    if (!window.confirm(`Are you sure you want to delete course ${code}?`)) return;

    try {
      await coursesApi.deleteCourse(id);
      setToast({ message: `Course ${code} deleted successfully`, type: 'success' });
      fetchCourses(pagination.page);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to delete course', type: 'error' });
    }
  };

  const columns: Column<Course>[] = [
    {
      header: 'Code',
      accessor: (row) => (
        <span className="course-code-cell">{row.code}</span>
      ),
      width: '100px',
    },
    {
      header: 'Course Titles',
      accessor: (row) => (
        <div>
          <div className="course-title-cell">{row.title_ar}</div>
          {(row.title_en || (row as any).name) && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {row.title_en || (row as any).name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: (row) => <DepartmentBadge department={row.department} size="sm" />,
    },
    {
      header: 'Year & Semester',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Badge variant="info" size="sm">Year {row.academic_year || 1}</Badge>
          <Badge variant="secondary" size="sm">Sem {row.semester || 1}</Badge>
        </div>
      ),
    },
    {
      header: 'Credit Hours',
      accessor: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.credit_hours || 3} hrs</span>,
      width: '110px',
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.is_active !== false ? 'success' : 'danger'} size="sm">
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
      width: '90px',
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/courses/${row.id}`)}
            leftIcon={<ExternalLink size={14} />}
          >
            Manage
          </Button>

          <PermissionGate action="courses.update" context={{ course: row }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal(row)}
              leftIcon={<Edit2 size={14} />}
            />
          </PermissionGate>

          <PermissionGate action="courses.delete" context={{ course: row }}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteCourse(row.id, row.code)}
              leftIcon={<Trash2 size={14} />}
            />
          </PermissionGate>
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="courses-list-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-action-header">
        <div>
          <h2 className="page-header-title">Academic Courses</h2>
          <p className="page-header-desc">Directory of all HTI courses, chapters, and academic materials</p>
        </div>

        <PermissionGate action="courses.create">
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleOpenCreateModal}>
            Create New Course
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader
          title="Course Directory"
          action={
            <div className="table-filter-bar">
              <div className="search-input-wrapper">
                <Input
                  placeholder="Search course code or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <div className="select-filter-wrapper">
                <select
                  className="shoky-select"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value as Department | '')}
                >
                  <option value="">All Departments</option>
                  <option value="engineering">Engineering</option>
                  <option value="computer_science">Computer Science</option>
                  <option value="business_administration">Business Administration</option>
                </select>
              </div>
            </div>
          }
        />
        <CardBody>
          <DataTable
            columns={columns}
            data={courses}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No courses matching search or filter criteria"
          />
          <Pagination
            pagination={pagination}
            onPageChange={(page) => fetchCourses(page)}
          />
        </CardBody>
      </Card>

      {/* Create / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? `Edit Course ${editingCourse.code}` : 'Create New Academic Course'}
        size="lg"
      >
        <form onSubmit={handleSaveCourse} className="modal-form-stack">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Course Code *"
              placeholder="e.g. CS301 or ENG202"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              required
            />

            <div className="shoky-input-group">
              <label className="input-label">Academic Department *</label>
              <select
                className="shoky-input"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value as Department)}
              >
                <option value="computer_science">Computer Science</option>
                <option value="engineering">Engineering</option>
                <option value="business_administration">Business Administration</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Course Title (Arabic) *"
              placeholder="e.g. هندسة البرمجيات"
              value={formTitleAr}
              onChange={(e) => setFormTitleAr(e.target.value)}
              required
            />

            <Input
              label="Course Title (English)"
              placeholder="e.g. Software Engineering"
              value={formTitleEn}
              onChange={(e) => setFormTitleEn(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Input
              label="Credit Hours *"
              type="number"
              value={formCreditHours}
              onChange={(e) => setFormCreditHours(e.target.value)}
              required
            />

            <div className="shoky-input-group">
              <label className="input-label">Academic Year *</label>
              <select
                className="shoky-input"
                value={formAcademicYear}
                onChange={(e) => setFormAcademicYear(e.target.value)}
              >
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div className="shoky-input-group">
              <label className="input-label">Semester *</label>
              <select
                className="shoky-input"
                value={formSemester}
                onChange={(e) => setFormSemester(e.target.value)}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
          </div>

          <div className="shoky-input-group">
            <label className="input-label">Course Status</label>
            <select
              className="shoky-input"
              value={formIsActive ? 'active' : 'inactive'}
              onChange={(e) => setFormIsActive(e.target.value === 'active')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="shoky-input-group">
            <label className="input-label">Course Description (Optional)</label>
            <textarea
              className="shoky-input"
              rows={3}
              style={{ height: 'auto', paddingTop: '8px' }}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions-right">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
