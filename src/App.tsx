import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/routeGuards';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CoursesListPage } from '@/pages/courses/CoursesListPage';
import { CourseDetailsPage } from '@/pages/courses/CourseDetailsPage';
import { UsersListPage } from '@/pages/users/UsersListPage';
import { StudentProfilesPage } from '@/pages/students/StudentProfilesPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:sessionId" element={<ResetPasswordPage />} />

        {/* Protected Dashboard Shell Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesListPage />} />
          <Route path="/courses/:id" element={<CourseDetailsPage />} />
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/student-profiles" element={<StudentProfilesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
