import PermissionForm from "@/app/components/permission/PermissionForm";

export const metadata = {
  title: "New Permission | PAFEX",
  description: "Create a new system permission key.",
};

export default function NewPermissionPage() {
  return (
    <div className="py-4">
      <PermissionForm mode="create" />
    </div>
  );
}
