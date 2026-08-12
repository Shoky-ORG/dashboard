import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/api/dashboard';
import { DashboardDoctor } from '@/types/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookOpen, GraduationCap, FileText, ArrowRight } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardDoctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await dashboardApi.getDoctorDashboard();
      setData(stats);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to load Doctor dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) return <LoadingState message="Loading academic metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const courseColumns = [
    {
      header: 'Code',
      accessor: (row: any) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
          {row.code}
        </span>
      ),
    },
    { header: 'Title (Arabic)', accessor: (row: any) => row.title_ar },
    { header: 'Students Enrolled', accessor: (row: any) => row.student_count ?? 0 },
    { header: 'Assignments', accessor: (row: any) => row.assignment_count ?? 0 },
    {
      header: 'Action',
      accessor: (row: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/courses/${row.id}`)}
          rightIcon={<ArrowRight size={14} />}
        >
          View Workspace
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#EAF0FF' }}>Doctor Academic Dashboard</h2>
        <p style={{ fontSize: '13px', color: '#9AA6C3', marginTop: '2px' }}>
          Overview of your active courses, assignments, and enrolled students
        </p>
      </div>

      <div className="grid-container">
        <div className="col-4">
          <StatCard
            title="My Active Courses"
            value={data.active_courses ?? 0}
            icon={<BookOpen size={20} />}
            colorTheme="primary"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Enrolled Students"
            value={data.total_students ?? 0}
            icon={<GraduationCap size={20} />}
            colorTheme="secondary"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Active Assignments"
            value={data.recent_assignments ?? 0}
            icon={<FileText size={20} />}
            colorTheme="info"
          />
        </div>
      </div>

      {data.courses && data.courses.length > 0 && (
        <Card>
          <CardHeader title="My Assigned Courses" subtitle="Select a course to manage chapters, materials, and assignments" />
          <CardBody>
            <DataTable
              columns={courseColumns}
              data={data.courses}
              keyExtractor={(row) => row.id}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
};
