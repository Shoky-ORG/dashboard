import React, { useState, useEffect, useCallback } from 'react';
import { studentProfilesApi } from '@/api/studentProfiles';
import { StudentProfile, Department, Track, NormalizedPagination } from '@/types/api';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { DepartmentBadge, Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { Search } from 'lucide-react';

export const StudentProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | ''>('');
  const [trackFilter, setTrackFilter] = useState<Track | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProfiles = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await studentProfilesApi.findAllStudentProfiles({
        page,
        limit: 10,
        search: search.trim() || undefined,
        department: departmentFilter || undefined,
        track: trackFilter || undefined,
      });
      setProfiles(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to fetch student profiles', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [search, departmentFilter, trackFilter]);

  useEffect(() => {
    fetchProfiles(1);
  }, [fetchProfiles]);

  const columns: Column<StudentProfile>[] = [
    {
      header: 'Student Number',
      accessor: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
          {row.student_number}
        </span>
      ),
      width: '160px',
    },
    {
      header: 'Student Name',
      accessor: (row) => row.user?.fullName || 'N/A',
    },
    {
      header: 'Department',
      accessor: (row) => <DepartmentBadge department={row.department} size="sm" />,
    },
    {
      header: 'Track',
      accessor: (row) => <Badge variant="info" size="sm">{row.track || 'General'}</Badge>,
    },
    {
      header: 'GPA',
      accessor: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.gpa ?? 'N/A'}</span>,
      width: '100px',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#EAF0FF' }}>Student Profiles Directory</h2>
        <p style={{ fontSize: '13px', color: '#9AA6C3', marginTop: '2px' }}>
          Inspect academic records, tracks, student numbers, and GPAs
        </p>
      </div>

      <Card>
        <CardHeader
          title="All Enrolled Students"
          action={
            <div className="table-filter-bar">
              <div className="search-input-wrapper">
                <Input
                  placeholder="Search student number or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <select
                className="shoky-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value as Department | '')}
              >
                <option value="">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="computer_science">Computer Science</option>
                <option value="business_administration">Business Admin</option>
              </select>

              <select
                className="shoky-select"
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value as Track | '')}
              >
                <option value="">All Tracks</option>
                <option value="AI">AI</option>
                <option value="CyberSecurity">CyberSecurity</option>
                <option value="WebDevelopment">Web Development</option>
                <option value="Flutter">Flutter</option>
                <option value="UiUX">Ui/UX</option>
              </select>
            </div>
          }
        />
        <CardBody>
          <DataTable
            columns={columns}
            data={profiles}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No student profiles match your search criteria"
          />
          <Pagination pagination={pagination} onPageChange={(page) => fetchProfiles(page)} />
        </CardBody>
      </Card>
    </div>
  );
};
