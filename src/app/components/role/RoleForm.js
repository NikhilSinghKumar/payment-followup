"use client";

import Card from "@/app/components/ui/Card";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";

export default function RoleForm({
  mode = "create",
  companies = [],
  permissions = [],
  initialData = {},
  action,
}) {
  const isEdit = mode === "edit";

  // -----------------------------------------
  // Group permissions by module
  // -----------------------------------------

  const groupedPermissions = permissions.reduce((groups, permission) => {
    if (!groups[permission.module]) {
      groups[permission.module] = [];
    }

    groups[permission.module].push(permission);

    return groups;
  }, {});

  return (
    <form action={action} className="space-y-6">
      {/* ===================================== */}
      {/* ROLE INFORMATION */}
      {/* ===================================== */}

      <Card
        title="Role Information"
        subtitle="Basic information about the role."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Role Name"
            name="roleName"
            required
            defaultValue={initialData.roleName}
          />

          <div>
            <label className="mb-2 block text-sm font-medium">Company</label>

            <select
              name="companyId"
              required
              defaultValue={initialData.companyId ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            >
              <option value="">Select Company</option>

              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Description"
            name="description"
            defaultValue={initialData.description}
          />

          <div className="flex items-center gap-3 pt-8">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              defaultChecked={initialData.isActive ?? true}
              className="h-4 w-4"
            />

            <label htmlFor="isActive" className="text-sm font-medium">
              Active Role
            </label>
          </div>
        </div>
      </Card>

      {/* ===================================== */}
      {/* PERMISSIONS */}
      {/* ===================================== */}

      <Card
        title="Permissions"
        subtitle="Select permissions assigned to this role."
      >
        <div className="space-y-8">
          {Object.entries(groupedPermissions).map(
            ([module, modulePermissions]) => (
              <div key={module}>
                <h3 className="mb-4 border-b pb-2 text-base font-semibold">
                  {module}
                </h3>

                <div className="grid gap-3 md:grid-cols-4">
                  {modulePermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        name="permissionIds"
                        value={permission.id}
                        defaultChecked={
                          initialData.permissionIds?.includes(permission.id) ??
                          false
                        }
                      />

                      <span className="capitalize">
                        {permission.action.replaceAll("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </Card>

      {/* ===================================== */}
      {/* ACTIONS */}
      {/* ===================================== */}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Cancel
        </Button>

        <Button type="submit">{isEdit ? "Update Role" : "Create Role"}</Button>
      </div>
    </form>
  );
}
