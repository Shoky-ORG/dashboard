import React, { useEffect, useState } from 'react';
import { dashboardApi } from '@/api/dashboard';
import { DashboardSuperAdmin } from '@/types/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Users, BookOpen, GraduationCap, Stethoscope, UserCog, ShieldCheck } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await dashboardApi.getSuperAdminDashboard();
      setData(stats);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to load Super Admin dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) return <LoadingState message="Loading system dashboard metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const departmentColumns = [
    {
      header: 'Department',
      accessor: (row: any) => (
        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
          {row.department?.replace('_', ' ')}
        </span>
      ),
    },
    { header: 'Students', accessor: (row: any) => row.student_count ?? 0 },
    { header: 'Doctors', accessor: (row: any) => row.doctor_count ?? 0 },
    { header: 'TAs', accessor: (row: any) => row.ta_count ?? 0 },
    { header: 'Courses', accessor: (row: any) => row.course_count ?? 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#EAF0FF' }}>System Overview</h2>
        <p style={{ fontSize: '13px', color: '#9AA6C3', marginTop: '2px' }}>
          Global metrics across all Higher Technological Institute departments
        </p>
      </div>

      <div className="grid-container">
        <div className="col-4">
          <StatCard
            title="Total System Users"
            value={data.total_users ?? 0}
            icon={<Users size={20} />}
            colorTheme="primary"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Total Courses"
            value={data.total_courses ?? 0}
            icon={<BookOpen size={20} />}
            colorTheme="secondary"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Enrolled Students"
            value={data.total_students ?? 0}
            icon={<GraduationCap size={20} />}
            colorTheme="info"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Active Doctors"
            value={data.total_doctors ?? 0}
            icon={<Stethoscope size={20} />}
            colorTheme="warning"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="Teaching Assistants"
            value={data.total_tas ?? 0}
            icon={<UserCog size={20} />}
            colorTheme="primary"
          />
        </div>
        <div className="col-4">
          <StatCard
            title="System Admins"
            value={data.total_admins ?? 0}
            icon={<ShieldCheck size={20} />}
            colorTheme="secondary"
          />
        </div>
      </div>

      {data.department_stats && data.department_stats.length > 0 && (
        <Card>
          <CardHeader title="Department Breakdown" subtitle="Student, staff, and course distribution by department" />
          <CardBody>
            <DataTable
              columns={departmentColumns}
              data={data.department_stats}
              keyExtractor={(row) => row.department}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
};
