import React, { useEffect, useState } from 'react';
import { dashboardApi } from '@/api/dashboard';
import { DashboardAdmin } from '@/types/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { DepartmentBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { GraduationCap, Stethoscope, UserCog, BookOpen } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await dashboardApi.getAdminDashboard();
      setData(stats);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to load Admin dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) return <LoadingState message="Loading department metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const courseColumns = [
    { header: 'Course Code', accessor: (row: any) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.course_code}</span> },
    { header: 'Course Name', accessor: (row: any) => row.course_name },
    { header: 'Enrolled Students', accessor: (row: any) => row.student_count ?? 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#EAF0FF' }}>Department Dashboard</h2>
          <p style={{ fontSize: '13px', color: '#9AA6C3', marginTop: '2px' }}>
            Administrative metrics for your assigned department
          </p>
        </div>
        <DepartmentBadge department={data.department} size="md" />
      </div>

      <div className="grid-container">
        <div className="col-3">
          <StatCard
            title="Department Students"
            value={data.total_students ?? 0}
            icon={<GraduationCap size={20} />}
            colorTheme="primary"
          />
        </div>
        <div className="col-3">
          <StatCard
            title="Department Doctors"
            value={data.total_doctors ?? 0}
            icon={<Stethoscope size={20} />}
            colorTheme="secondary"
          />
        </div>
        <div className="col-3">
          <StatCard
            title="Department TAs"
            value={data.total_tas ?? 0}
            icon={<UserCog size={20} />}
            colorTheme="info"
          />
        </div>
        <div className="col-3">
          <StatCard
            title="Total Courses"
            value={data.total_courses ?? 0}
            icon={<BookOpen size={20} />}
            colorTheme="warning"
          />
        </div>
      </div>

      {data.course_stats && data.course_stats.length > 0 && (
        <Card>
          <CardHeader title="Department Courses" subtitle="Enrollment breakdown by course" />
          <CardBody>
            <DataTable
              columns={courseColumns}
              data={data.course_stats}
              keyExtractor={(row) => row.course_id}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
};
