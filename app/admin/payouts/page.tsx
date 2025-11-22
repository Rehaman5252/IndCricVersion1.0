'use client';
import AdminAuthGuard from '@/app/components/admin/AdminAuthGuard';
import AdminLayout from '@/app/components/admin/AdminLayout';


export default function PayoutsPage() {
  return (
    <AdminAuthGuard requiredPermissions={['payouts:view', 'payouts:process']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Payouts Management</h1>
            <p className="text-gray-600 mt-1">Process and manage user payouts</p>
          </div>
          
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
