'use client';
import AdminAuthGuard from '@/app/components/admin/AdminAuthGuard';
import AdminLayout from '@/app/components/admin/AdminLayout';
import AuditLogs from '@/app/components/admin/AuditLogs';

export default function AuditLogsPage() {
  return (
    <AdminAuthGuard requiredPermissions={["logs:view"]}>
      <AdminLayout>
        <div className="space-y-4 py-6">
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">
            The AuditLogs component has been removed or is unavailable.
          </p>
          {/* Optional: add a button to navigate back or to another admin area */}
          <div>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded shadow-sm hover:opacity-90"
            >
              Go back
            </button>
          </div>
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
