export default function UsersTab({ users }) {
  if (!users.length) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
        No users assigned.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Name</th>

            <th>Email</th>

            <th>User Type</th>

            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map(({ user }) => (
            <tr key={user.id}>
              <td>{user.name}</td>

              <td>{user.email}</td>

              <td>{user.userType}</td>

              <td>{user.isActive ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
