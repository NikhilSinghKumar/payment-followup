"use client";

import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Input from "@/app/components/ui/Input";

export default function UserForm({
  mode = "create",
  companies = [],
  roles = [],
  initialData = {},
  action,
}) {
  return (
    <form action={action} className="space-y-6">
      {/* ===================================== */}
      {/* PERSONAL INFORMATION */}
      {/* ===================================== */}

      <Card
        title="Personal Information"
        subtitle="Basic information about the user."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            required
            defaultValue={initialData.firstName}
          />

          <Input
            label="Last Name"
            name="lastName"
            defaultValue={initialData.lastName}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={initialData.email}
          />

          <Input
            label="Mobile"
            name="mobile"
            defaultValue={initialData.mobile}
          />
        </div>
      </Card>

      {/* ===================================== */}
      {/* COMPANY & ACCESS */}
      {/* ===================================== */}

      <Card
        title="Company Information"
        subtitle="Assign the user to a company."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {/* Company */}

          <div>
            <label className="mb-2 block text-sm font-medium">Company</label>

            <select
              name="companyId"
              required
              defaultValue={initialData.companyId ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Company</option>

              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="mb-2 block text-sm font-medium">Role</label>

            <select
              name="roleId"
              required
              defaultValue={initialData.roleId ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Role</option>

              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </div>
          {/* Designation */}

          <Input
            label="Designation"
            name="designation"
            defaultValue={initialData.designation}
          />

          {/* Active */}

          <div className="flex items-center gap-3 pt-8">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              defaultChecked={initialData.isActive ?? true}
              className="h-4 w-4"
            />

            <label htmlFor="isActive" className="text-sm font-medium">
              Active User
            </label>
          </div>
        </div>
      </Card>

      {/* ===================================== */}
      {/* SECURITY */}
      {/* ===================================== */}

      <Card
        title="Security"
        subtitle={
          mode === "edit"
            ? "Leave password blank to keep the current password."
            : "Create a secure password."
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Password"
            name="password"
            type="password"
            required={mode === "create"}
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required={mode === "create"}
          />
        </div>
      </Card>

      {/* ===================================== */}
      {/* ACTIONS */}
      {/* ===================================== */}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Cancel
        </Button>

        <Button type="submit">
          {mode === "create" ? "Create User" : "Update User"}
        </Button>
      </div>
    </form>
  );
}
