import React, { useState, useEffect } from 'react';
import { notificationsApi, SendNotificationParams } from '@/api/notifications';
import { coursesApi } from '@/api/courses';
import { Course, NotificationType, NotificationTargetType } from '@/types/api';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { Bell, Send, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('general');
  const [targetType, setTargetType] = useState<NotificationTargetType>('all');
  const [courseId, setCourseId] = useState<string>('');
  const [studentNumbersInput, setStudentNumbersInput] = useState('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    coursesApi.getCourses({ limit: 100 }).then((res) => setCourses(res.items || [])).catch(() => {});
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setToast({ message: 'Notification Title and Message are required.', type: 'error' });
      return;
    }

    const parsedStudentNumbers = studentNumbersInput
      ? studentNumbersInput.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    setIsSubmitting(true);
    try {
      const payload: SendNotificationParams = {
        title,
        message,
        type,
        target_type: targetType,
        course_id: courseId ? Number(courseId) : undefined,
        studentNumbers: parsedStudentNumbers,
      };

      await notificationsApi.sendNotification(payload);
      setToast({ message: 'Push notification broadcasted successfully!', type: 'success' });
      setTitle('');
      setMessage('');
      setStudentNumbersInput('');
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to send notification', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#EAF0FF' }}>Push Notification Dispatcher</h2>
        <p style={{ fontSize: '13px', color: '#9AA6C3', marginTop: '2px' }}>
          Broadcast announcements and updates to students and staff mobile devices
        </p>
      </div>

      <Card>
        <CardHeader title="Broadcast New Notification" subtitle="Configure notification content, target audience, and type" />
        <CardBody>
          <form onSubmit={handleSendNotification} className="modal-form-stack">
            <Input
              label="Notification Title"
              placeholder="e.g. Midterm Exam Schedule Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="shoky-input-group">
              <label className="input-label">Message Content</label>
              <textarea
                className="shoky-input"
                rows={4}
                style={{ height: 'auto', paddingTop: '8px' }}
                placeholder="Enter detailed message text..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="shoky-input-group">
                <label className="input-label">Notification Type</label>
                <select
                  className="shoky-input"
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                >
                  <option value="general">General</option>
                  <option value="announcement">Announcement</option>
                  <option value="course">Course Update</option>
                  <option value="assignment">Assignment Alert</option>
                  <option value="grade">Grade Release</option>
                  <option value="system">System Notice</option>
                </select>
              </div>

              <div className="shoky-input-group">
                <label className="input-label">Target Audience</label>
                <select
                  className="shoky-input"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as NotificationTargetType)}
                >
                  <option value="all">All System Users</option>
                  <option value="course_specific">Enrolled Course Students</option>
                  <option value="specific_users">Specific Student Numbers</option>
                </select>
              </div>
            </div>

            {targetType === 'course_specific' && (
              <div className="shoky-input-group">
                <label className="input-label">Select Course</label>
                <select
                  className="shoky-input"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title_ar}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'specific_users' && (
              <Input
                label="Student Numbers (Comma-Separated)"
                placeholder="e.g. 2024001, 2024002, 2024015"
                value={studentNumbersInput}
                onChange={(e) => setStudentNumbersInput(e.target.value)}
                helperText="Enter exact student numbers separated by commas"
                required
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} leftIcon={<Send size={18} />}>
                Broadcast Notification
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
