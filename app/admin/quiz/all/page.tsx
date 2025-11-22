'use client';
import AdminAuthGuard from '@/app/components/admin/AdminAuthGuard';
import AdminLayout from '@/app/components/admin/AdminLayout';

export default function AllQuizzesPage() {
  return (
    <AdminAuthGuard requiredPermissions={['quiz:view']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">All Quizzes</h1>
            <p className="text-gray-600 mt-1">View and manage all quizzes</p>
          </div>
          
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
