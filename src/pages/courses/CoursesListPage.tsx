import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi, CreateCourseParams, UpdateCourseParams } from '@/api/courses';
import { Course, Department, NormalizedPagination } from '@/types/api';
import { can } from '@/auth/permissions';
import { useAuth } from '@/auth/AuthContext';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DepartmentBadge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { Plus, Search, Filter, BookOpen, ExternalLink, Edit2, Trash2 } from 'lucide-react';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDepartment, setFormDepartment] = useState<Department>('computer_science');
  const [formDescription, setFormDescription] = useState('');
  const [formCreditHours, setFormCreditHours] = useState('3');
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
    setFormTitleAr('');
    setFormCode('');
    setFormDepartment('computer_science');
    setFormDescription('');
    setFormCreditHours('3');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormTitleAr(course.title_ar);
    setFormCode(course.code);
    setFormDepartment(course.department);
    setFormDescription(course.description || '');
    setFormCreditHours(String(course.credit_hours || 3));
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
          title_ar: formTitleAr,
          code: formCode,
          department: formDepartment,
          description: formDescription,
          credit_hours: Number(formCreditHours),
        };
        await coursesApi.updateCourse(editingCourse.id, updatePayload);
        setToast({ message: 'Course updated successfully', type: 'success' });
      } else {
        const createPayload: CreateCourseParams = {
          title_ar: formTitleAr,
          code: formCode,
          department: formDepartment,
          description: formDescription,
          credit_hours: Number(formCreditHours),
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
      width: '120px',
    },
    {
      header: 'Title (Arabic)',
      accessor: (row) => <span className="course-title-cell">{row.title_ar}</span>,
    },
    {
      header: 'Department',
      accessor: (row) => <DepartmentBadge department={row.department} size="sm" />,
    },
    {
      header: 'Credit Hours',
      accessor: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.credit_hours || 3} hrs</span>,
      width: '120px',
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
      >
        <form onSubmit={handleSaveCourse} className="modal-form-stack">
          <Input
            label="Course Code"
            placeholder="e.g. CS101 or ENG202"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            required
          />

          <Input
            label="Course Title (Arabic)"
            placeholder="e.g. مقدمة في علوم الحاسب"
            value={formTitleAr}
            onChange={(e) => setFormTitleAr(e.target.value)}
            required
          />

          <div className="shoky-input-group">
            <label className="input-label">Academic Department</label>
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

          <Input
            label="Credit Hours"
            type="number"
            value={formCreditHours}
            onChange={(e) => setFormCreditHours(e.target.value)}
          />

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
