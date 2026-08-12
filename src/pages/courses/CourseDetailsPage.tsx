import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi } from '@/api/courses';
import { instructorsApi } from '@/api/instructors';
import { chaptersApi, CreateChapterParams } from '@/api/chapters';
import { materialsApi, CreateMaterialParams } from '@/api/materials';
import { assignmentsApi, CreateAssignmentParams } from '@/api/assignments';
import { enrollmentApi } from '@/api/enrollment';
import { usersApi } from '@/api/users';
import {
  Course,
  CourseInstructor,
  Chapter,
  Material,
  Assignment,
  StudentProfile,
  InstructorRole,
  MaterialType,
  DeliveryMethod,
  User,
} from '@/types/api';
import { useAuth } from '@/auth/AuthContext';
import { can } from '@/auth/permissions';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge, DepartmentBadge, RoleBadge } from '@/components/ui/Badge';
import { FileUploader } from '@/components/ui/FileUploader';
import { Toast } from '@/components/ui/Toast';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  ArrowLeft,
  BookOpen,
  UserCheck,
  GraduationCap,
  Layers,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  File,
  Download,
  Calendar,
  Award,
} from 'lucide-react';
import './CourseDetailsPage.css';

export const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [course, setCourse] = useState<Course | null>(null);
  const [instructors, setInstructors] = useState<CourseInstructor[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState<InstructorRole>('ta');

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');
  const [chapterOrder, setChapterOrder] = useState('1');

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [chapterMaterials, setChapterMaterials] = useState<Record<number, Material[]>>({});

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [materialType, setMaterialType] = useState<MaterialType>('pdf');
  const [materialLink, setMaterialLink] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentMaxScore, setAssignmentMaxScore] = useState('100');
  const [assignmentDeliveryMethod, setAssignmentDeliveryMethod] = useState<DeliveryMethod>('external_link');
  const [assignmentLink, setAssignmentLink] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  // Calculate instructor role in course for current user
  const safeInstructors = Array.isArray(instructors) ? instructors : [];
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeStudents = Array.isArray(students) ? students : [];

  const isCourseInstructor = safeInstructors.some((inst) => inst?.user_id === currentUser?.id);
  const currentInstructorRole = safeInstructors.find((inst) => inst?.user_id === currentUser?.id)?.role;

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cData, instData, chapData, assignData] = await Promise.all([
        coursesApi.getCourseById(courseId),
        instructorsApi.getInstructors(courseId).catch(() => []),
        chaptersApi.getChapters(courseId).catch(() => []),
        assignmentsApi.getAssignments(courseId).catch(() => []),
      ]);

      setCourse(cData);
      setInstructors(Array.isArray(instData) ? instData : []);
      setChapters(Array.isArray(chapData) ? chapData : []);
      setAssignments(Array.isArray(assignData) ? assignData : []);

      // Load materials for chapters
      const matMap: Record<number, Material[]> = {};
      for (const chap of chapData) {
        try {
          const mats = await materialsApi.getMaterials(courseId, chap.id);
          matMap[chap.id] = mats;
        } catch (e) {
          matMap[chap.id] = [];
        }
      }
      setChapterMaterials(matMap);

      // Fetch enrolled students if permission allows
      if (can('students.view_course_students', { user: currentUser })) {
        try {
          const stRes = await enrollmentApi.getCourseStudents(courseId, { page: 1, limit: 100 });
          setStudents(stRes.items || []);
        } catch (e) {
          // ignore student fetch failures if forbidden
        }
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, currentUser]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Load available staff users for assignment modal
  const fetchStaffUsers = async () => {
    try {
      const res = await usersApi.getUsers({ limit: 100 });
      setStaffUsers(res.items || []);
    } catch (e) {
      // ignore
    }
  };

  const handleOpenAssignModal = () => {
    fetchStaffUsers();
    setAssignUserId('');
    setAssignRole(currentUser?.role?.name === 'doctor' ? 'ta' : 'doctor');
    setIsAssignModalOpen(true);
  };

  const handleAssignInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId) return;

    setIsSubmitting(true);
    try {
      await instructorsApi.assignInstructor(courseId, {
        userId: Number(assignUserId),
        role: assignRole,
      });
      setToast({ message: 'Instructor assigned successfully', type: 'success' });
      setIsAssignModalOpen(false);
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to assign instructor', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveInstructor = async (userId: number) => {
    if (!window.confirm('Remove instructor from this course?')) return;
    try {
      await instructorsApi.removeInstructor(courseId, userId);
      setToast({ message: 'Instructor removed', type: 'success' });
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to remove instructor', type: 'error' });
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle) return;

    setIsSubmitting(true);
    try {
      await chaptersApi.createChapter(courseId, {
        title: chapterTitle,
        description: chapterDesc,
        order: Number(chapterOrder) || 1,
      });
      setToast({ message: 'Chapter created successfully', type: 'success' });
      setIsChapterModalOpen(false);
      setChapterTitle('');
      setChapterDesc('');
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to create chapter', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chapId: number) => {
    if (!window.confirm('Delete this chapter and all associated materials?')) return;
    try {
      await chaptersApi.deleteChapter(courseId, chapId);
      setToast({ message: 'Chapter deleted', type: 'success' });
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to delete chapter', type: 'error' });
    }
  };

  const handleOpenMaterialModal = (chapId: number) => {
    setSelectedChapterId(chapId);
    setMaterialTitle('');
    setMaterialDesc('');
    setMaterialType('pdf');
    setMaterialLink('');
    setMaterialFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId || !materialTitle) return;

    setIsSubmitting(true);
    try {
      const payload: CreateMaterialParams = {
        title: materialTitle,
        description: materialDesc,
        type: materialType,
        external_link: materialLink,
        file: materialFile,
      };
      await materialsApi.createMaterial(courseId, selectedChapterId, payload);
      setToast({ message: 'Material uploaded successfully', type: 'success' });
      setIsMaterialModalOpen(false);
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to upload material', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (chapId: number, matId: number) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await materialsApi.deleteMaterial(courseId, chapId, matId);
      setToast({ message: 'Material deleted', type: 'success' });
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to delete material', type: 'error' });
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle || !assignmentDueDate) return;

    setIsSubmitting(true);
    try {
      const payload: CreateAssignmentParams = {
        title: assignmentTitle,
        description: assignmentDesc,
        due_date: new Date(assignmentDueDate).toISOString(),
        max_score: Number(assignmentMaxScore) || 100,
        delivery_method: assignmentDeliveryMethod,
        external_link: assignmentLink,
        file: assignmentFile,
      };
      await assignmentsApi.createAssignment(courseId, payload);
      setToast({ message: 'Assignment created successfully', type: 'success' });
      setIsAssignmentModalOpen(false);
      setAssignmentTitle('');
      setAssignmentDesc('');
      setAssignmentFile(null);
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to create assignment', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignId: number) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await assignmentsApi.deleteAssignment(courseId, assignId);
      setToast({ message: 'Assignment deleted', type: 'success' });
      fetchCourseData();
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to delete assignment', type: 'error' });
    }
  };

  if (isLoading) return <LoadingState message="Loading course workspace..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCourseData} />;
  if (!course) return null;

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen size={16} /> },
    { id: 'instructors', label: 'Instructors', badge: instructors.length, icon: <UserCheck size={16} /> },
    { id: 'students', label: 'Enrolled Students', badge: students.length, icon: <GraduationCap size={16} /> },
    { id: 'chapters', label: 'Chapters & Materials', badge: chapters.length, icon: <Layers size={16} /> },
    { id: 'assignments', label: 'Assignments', badge: assignments.length, icon: <FileText size={16} /> },
  ];

  const studentColumns: Column<StudentProfile>[] = [
    {
      header: 'Student Number',
      accessor: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
          {row.student_number}
        </span>
      ),
    },
    { header: 'Full Name', accessor: (row) => row.user?.fullName || 'N/A' },
    { header: 'Department', accessor: (row) => <DepartmentBadge department={row.department} size="sm" /> },
    { header: 'Track', accessor: (row) => <Badge variant="info" size="sm">{row.track || 'General'}</Badge> },
    { header: 'GPA', accessor: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.gpa ?? 'N/A'}</span> },
  ];

  return (
    <div className="course-details-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Bar */}
      <div className="course-details-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/courses')} leftIcon={<ArrowLeft size={16} />}>
          Back to Courses
        </Button>
        <div className="course-header-meta">
          <span className="course-code-badge">{course.code}</span>
          <h2 className="course-title">{course.title_ar}</h2>
          <DepartmentBadge department={course.department} size="md" />
        </div>
      </div>

      {/* Workspace Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid-container">
          <div className="col-8">
            <Card>
              <CardHeader title="Course Information" />
              <CardBody>
                <div className="course-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Course Code</span>
                    <span className="meta-val mono">{course.code}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Title (Arabic)</span>
                    <span className="meta-val">{course.title_ar}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Department</span>
                    <span className="meta-val"><DepartmentBadge department={course.department} /></span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Credit Hours</span>
                    <span className="meta-val mono">{course.credit_hours || 3} Hours</span>
                  </div>
                </div>

                {course.description && (
                  <div className="course-desc-box">
                    <h4>Course Description</h4>
                    <p>{course.description}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="col-4">
            <Card>
              <CardHeader title="Instructors Summary" />
              <CardBody>
                {instructors.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No assigned instructors yet.</p>
                ) : (
                  <div className="instructor-mini-list">
                    {instructors.map((inst) => (
                      <div key={inst.id} className="instructor-mini-item">
                        <div className="inst-avatar">{inst.user?.fullName?.charAt(0) || 'I'}</div>
                        <div>
                          <div className="inst-name">{inst.user?.fullName}</div>
                          <RoleBadge role={inst.role as any} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: INSTRUCTORS */}
      {activeTab === 'instructors' && (
        <Card>
          <CardHeader
            title="Course Instructors"
            subtitle="Doctors and Teaching Assistants assigned to this course"
            action={
              <PermissionGate
                action="instructors.assign_ta"
                context={{ isCourseInstructor, instructorRoleInCourse: currentInstructorRole }}
              >
                <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={handleOpenAssignModal}>
                  Assign Instructor
                </Button>
              </PermissionGate>
            }
          />
          <CardBody>
            {instructors.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No instructors assigned to this course.</p>
            ) : (
              <div className="instructors-grid">
                {instructors.map((inst) => (
                  <div key={inst.id} className="instructor-card glass-panel">
                    <div className="inst-avatar-large">{inst.user?.fullName?.charAt(0) || 'I'}</div>
                    <div className="inst-info">
                      <div className="inst-name-title">{inst.user?.fullName}</div>
                      <div className="inst-email">{inst.user?.email}</div>
                      <div style={{ marginTop: '6px' }}>
                        <RoleBadge role={inst.role as any} size="sm" />
                      </div>
                    </div>
                    <PermissionGate action="instructors.remove">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveInstructor(inst.user_id)}
                        leftIcon={<Trash2 size={14} />}
                      >
                        Remove
                      </Button>
                    </PermissionGate>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 3: STUDENTS */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader title="Enrolled Students Roster" subtitle={`Total ${students.length} students enrolled in ${course.code}`} />
          <CardBody>
            <DataTable
              columns={studentColumns}
              data={students}
              keyExtractor={(row) => row.id}
              emptyMessage="No students currently enrolled in this course"
            />
          </CardBody>
        </Card>
      )}

      {/* TAB 4: CHAPTERS & MATERIALS */}
      {activeTab === 'chapters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Course Chapters & Learning Materials</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Organize curriculum into chapters and upload files or links</p>
            </div>

            <PermissionGate action="chapters.create">
              <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsChapterModalOpen(true)}>
                Add Chapter
              </Button>
            </PermissionGate>
          </div>

          {chapters.length === 0 ? (
            <Card><CardBody><p style={{ color: 'var(--text-muted)' }}>No chapters created yet for this course.</p></CardBody></Card>
          ) : (
            chapters.map((chap) => (
              <Card key={chap.id} className="chapter-card">
                <CardHeader
                  title={`Chapter ${chap.order}: ${chap.title}`}
                  subtitle={chap.description}
                  action={
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <PermissionGate action="materials.create">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Plus size={14} />}
                          onClick={() => handleOpenMaterialModal(chap.id)}
                        >
                          Add Material
                        </Button>
                      </PermissionGate>

                      <PermissionGate action="chapters.delete">
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 size={14} />}
                          onClick={() => handleDeleteChapter(chap.id)}
                        />
                      </PermissionGate>
                    </div>
                  }
                />
                <CardBody>
                  {(!chapterMaterials[chap.id] || chapterMaterials[chap.id].length === 0) ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No materials in this chapter.</p>
                  ) : (
                    <div className="materials-list">
                      {chapterMaterials[chap.id].map((mat) => (
                        <div key={mat.id} className="material-item">
                          <div className="material-icon">
                            <File size={18} />
                          </div>
                          <div className="material-info">
                            <div className="material-title">{mat.title}</div>
                            {mat.description && <div className="material-desc">{mat.description}</div>}
                            <div className="material-meta">
                              <Badge variant="secondary" size="sm">{mat.type.toUpperCase()}</Badge>
                              {mat.external_link && (
                                <a href={mat.external_link} target="_blank" rel="noreferrer" className="mat-link">
                                  <ExternalLink size={12} /> Open Link
                                </a>
                              )}
                              {mat.file_url && (
                                <a href={mat.file_url} target="_blank" rel="noreferrer" className="mat-link">
                                  <Download size={12} /> Download File
                                </a>
                              )}
                            </div>
                          </div>
                          <PermissionGate action="materials.delete">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMaterial(chap.id, mat.id)}
                              leftIcon={<Trash2 size={14} style={{ color: 'var(--danger)' }} />}
                            />
                          </PermissionGate>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 5: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <Card>
          <CardHeader
            title="Course Assignments"
            subtitle="Manage student homework, lecture deliverables, and online submissions"
            action={
              <PermissionGate action="assignments.create">
                <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAssignmentModalOpen(true)}>
                  Create Assignment
                </Button>
              </PermissionGate>
            }
          />
          <CardBody>
            {assignments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No assignments created for this course.</p>
            ) : (
              <div className="assignments-grid">
                {assignments.map((assign) => (
                  <div key={assign.id} className="assignment-card glass-panel">
                    <div className="assign-header">
                      <h4 className="assign-title">{assign.title}</h4>
                      <Badge variant="warning" size="sm">
                        {assign.delivery_method === 'in_lecture' ? 'In Lecture' : 'External Link'}
                      </Badge>
                    </div>

                    {assign.description && <p className="assign-desc">{assign.description}</p>}

                    <div className="assign-details">
                      <div className="detail-item">
                        <Calendar size={14} /> Due: {new Date(assign.due_date).toLocaleDateString()}
                      </div>
                      <div className="detail-item">
                        <Award size={14} /> Max Score: {assign.max_score} pts
                      </div>
                    </div>

                    {(assign.file_url || assign.external_link) && (
                      <div className="assign-links">
                        {assign.file_url && (
                          <a href={assign.file_url} target="_blank" rel="noreferrer" className="assign-attachment-link">
                            <Download size={14} /> Attachment File
                          </a>
                        )}
                        {assign.external_link && (
                          <a href={assign.external_link} target="_blank" rel="noreferrer" className="assign-attachment-link">
                            <ExternalLink size={14} /> External Link
                          </a>
                        )}
                      </div>
                    )}

                    <div className="assign-footer">
                      <PermissionGate action="assignments.delete">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assign.id)}
                          leftIcon={<Trash2 size={14} />}
                        >
                          Delete
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Assign Instructor Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Instructor to Course">
        <form onSubmit={handleAssignInstructor} className="modal-form-stack">
          <div className="shoky-input-group">
            <label className="input-label">Select Staff Member</label>
            <select
              className="shoky-input"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              required
            >
              <option value="">-- Choose Staff User --</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role?.name?.toUpperCase()}) - {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="shoky-input-group">
            <label className="input-label">Course Role</label>
            <select
              className="shoky-input"
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value as InstructorRole)}
              disabled={currentUser?.role?.name === 'doctor'} // Doctor can ONLY assign TA role!
            >
              {currentUser?.role?.name !== 'doctor' && <option value="doctor">Doctor</option>}
              <option value="ta">Teaching Assistant (TA)</option>
            </select>
          </div>

          <div className="modal-actions-right">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Assign Instructor</Button>
          </div>
        </form>
      </Modal>

      {/* Create Chapter Modal */}
      <Modal isOpen={isChapterModalOpen} onClose={() => setIsChapterModalOpen(false)} title="Create New Chapter">
        <form onSubmit={handleCreateChapter} className="modal-form-stack">
          <Input label="Chapter Order / Number" type="number" value={chapterOrder} onChange={(e) => setChapterOrder(e.target.value)} required />
          <Input label="Chapter Title" placeholder="e.g. Introduction to Data Structures" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} required />
          <div className="shoky-input-group">
            <label className="input-label">Description (Optional)</label>
            <textarea className="shoky-input" rows={3} value={chapterDesc} onChange={(e) => setChapterDesc(e.target.value)} />
          </div>
          <div className="modal-actions-right">
            <Button type="button" variant="outline" onClick={() => setIsChapterModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Create Chapter</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Material Modal */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Upload Learning Material">
        <form onSubmit={handleUploadMaterial} className="modal-form-stack">
          <Input label="Material Title" placeholder="e.g. Lecture 1 PDF Notes" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} required />
          <div className="shoky-input-group">
            <label className="input-label">Material Type</label>
            <select className="shoky-input" value={materialType} onChange={(e) => setMaterialType(e.target.value as MaterialType)}>
              <option value="pdf">PDF Document</option>
              <option value="link">External Web Link</option>
              <option value="image">Image File</option>
              <option value="document">Office Document</option>
            </select>
          </div>
          {materialType === 'link' ? (
            <Input label="External URL" placeholder="https://..." value={materialLink} onChange={(e) => setMaterialLink(e.target.value)} required />
          ) : (
            <FileUploader label="Upload Material File" file={materialFile} onFileChange={setMaterialFile} />
          )}
          <div className="modal-actions-right">
            <Button type="button" variant="outline" onClick={() => setIsMaterialModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Upload Material</Button>
          </div>
        </form>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title="Create New Course Assignment">
        <form onSubmit={handleCreateAssignment} className="modal-form-stack">
          <Input label="Assignment Title" placeholder="e.g. Assignment 1: Binary Trees Implementation" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} required />
          <Input label="Due Date" type="datetime-local" value={assignmentDueDate} onChange={(e) => setAssignmentDueDate(e.target.value)} required />
          <Input label="Maximum Score Points" type="number" value={assignmentMaxScore} onChange={(e) => setAssignmentMaxScore(e.target.value)} required />
          <div className="shoky-input-group">
            <label className="input-label">Delivery Method</label>
            <select className="shoky-input" value={assignmentDeliveryMethod} onChange={(e) => setAssignmentDeliveryMethod(e.target.value as DeliveryMethod)}>
              <option value="external_link">Online / External Link</option>
              <option value="in_lecture">In Lecture Submission</option>
            </select>
          </div>
          {assignmentDeliveryMethod === 'external_link' && (
            <Input label="Submission Link (Optional)" placeholder="https://..." value={assignmentLink} onChange={(e) => setAssignmentLink(e.target.value)} />
          )}
          <FileUploader label="Attach Assignment Prompt File (Optional)" file={assignmentFile} onFileChange={setAssignmentFile} />
          <div className="modal-actions-right">
            <Button type="button" variant="outline" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Create Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
