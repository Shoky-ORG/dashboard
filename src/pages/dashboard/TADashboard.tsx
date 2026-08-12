import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '@/api/courses';
import { chaptersApi } from '@/api/chapters';
import { assignmentsApi } from '@/api/assignments';
import { Course } from '@/types/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookOpen, Layers, FileText, ArrowRight } from 'lucide-react';

export const TADashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalChapters, setTotalChapters] = useState<number>(0);
  const [totalAssignments, setTotalAssignments] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTAData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch accessible courses
      const courseRes = await coursesApi.getCourses({ page: 1, limit: 100 });
      const accessibleCourses = courseRes.items || [];
      setCourses(accessibleCourses);

      // Aggregate real chapter & assignment counts across accessible courses
      let chaptersCount = 0;
      let assignmentsCount = 0;

      for (const course of accessibleCourses.slice(0, 10)) {
        try {
          const chapters = await chaptersApi.getChapters(course.id);
          chaptersCount += chapters.length;

          const assignments = await assignmentsApi.getAssignments(course.id);
          assignmentsCount += assignments.length;
        } catch (e) {
          // ignore individual course sub-fetches
        }
      }

      setTotalChapters(chaptersCount);
      setTotalAssignments(assignmentsCount);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to load TA workspace courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTAData();
  }, []);

  if (isLoading) return <LoadingState message="Calculating TA course metrics from live backend data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchTAData} />;

  const courseColumns = [
    {
      header: 'Code',
      accessor: (row: Course) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
          {row.code}
        </span>
      ),
    },
    { header: 'Title (Arabic)', accessor: (row: Course) => row.title_ar },
    {
      header: 'Department',
      accessor: (row: Course) => (
        <span style={{ textTransform: 'capitalize' }}>
          {row.department?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: (row: Course) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/courses/${row.id}`)}
          rightIcon={<ArrowRight size={14} />}
        >
          Manage Content
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#EAF0FF' }}>Teaching Assistant Dashboard</h2>
        <p style={{ fontSize: '13px', color: '#9AA6C3', marginTop: '2px' }}>
          Real-time content management workspace for assigned courses
        </p>
      </div>

      <div className="grid-container">
        <div className="col-4">
          <StatCard
            title="Accessible Courses"
            value={courses.length}
            icon={<BookOpen size={20} />}
            colorTheme="primary"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Active Course Chapters"
            value={totalChapters}
            icon={<Layers size={20} />}
            colorTheme="secondary"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Active Assignments"
            value={totalAssignments}
            icon={<FileText size={20} />}
            colorTheme="info"
          />
        </div>
      </div>

      <Card>
        <CardHeader title="Accessible Academic Courses" subtitle="Manage course chapters, upload materials, and handle assignments" />
        <CardBody>
          <DataTable
            columns={courseColumns}
            data={courses}
            keyExtractor={(row) => row.id}
            emptyMessage="No accessible courses found for your account"
          />
        </CardBody>
      </Card>
    </div>
  );
};
