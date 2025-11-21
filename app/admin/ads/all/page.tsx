'use client';
import AdminAuthGuard from '@/app/components/admin/AdminAuthGuard';
import AdminLayout from '@/app/components/admin/AdminLayout';


export default function AllAdsPage() {
  return (
    <AdminAuthGuard requiredPermissions={['ads:view']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">All Advertisements</h1>
            <p className="text-gray-600 mt-1">Manage all advertisements</p>
          </div>
          <AdsManager />
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
