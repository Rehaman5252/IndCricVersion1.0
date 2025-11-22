"use client";

import AdminAuthGuard from "@/app/components/admin/AdminAuthGuard";
import AdminLayout from "@/app/components/admin/AdminLayout";

export default function QuizPage() {
  return (
    <AdminAuthGuard requiredPermissions={["quiz:view", "quiz:create"]}>
      <AdminLayout>
        <div className="space-y-4 py-6">
          <h1 className="text-3xl font-bold">Quiz Panel</h1>
          <p className="text-gray-600">
            The QuizManager component is missing or has been removed.
          </p>
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
