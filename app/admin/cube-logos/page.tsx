'use client';
import AdminAuthGuard from '@/app/components/admin/AdminAuthGuard';
import AdminLayout from '@/app/components/admin/AdminLayout';


export default function CubeLogosPage() {
  return (
    <AdminAuthGuard requiredPermissions={['settings:edit', 'settings:view']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Cube & Brand Logos</h1>
            <p className="text-gray-600 mt-1">Manage homepage cube logos and offers</p>
          </div>
          
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
