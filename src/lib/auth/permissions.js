export const PERMISSIONS = [
  {
    key: "dashboard",
    module: "Dashboard",
    actions: ["view"],
  },

  {
    key: "companies",
    module: "Companies",
    actions: ["view", "create", "edit", "delete", "activate", "deactivate"],
  },
  {
    key: "users",
    module: "Users",
    actions: [
      "view",
      "create",
      "edit",
      "delete",
      "activate",
      "deactivate",
      "reset_password",
    ],
  },

  {
    key: "roles",
    module: "Roles",
    actions: ["view", "create", "edit", "delete", "assign_permissions"],
  },

  {
    key: "clients",
    module: "Clients",
    actions: ["view", "create", "edit", "delete", "import", "export"],
  },

  {
    key: "client_contacts",
    module: "Client Contacts",
    actions: ["view", "create", "edit", "delete"],
  },

  {
    key: "client_locations",
    module: "Client Locations",
    actions: ["view", "create", "edit", "delete"],
  },

  {
    key: "sub_clients",
    module: "Sub Clients",
    actions: ["view", "create", "edit", "delete"],
  },

  {
    key: "invoices",
    module: "Invoices",
    actions: [
      "view",
      "create",
      "edit",
      "delete",
      "import",
      "export",
      "download",
    ],
  },

  {
    key: "payments",
    module: "Payments",
    actions: ["view", "create", "edit", "delete", "export"],
  },

  {
    key: "followups",
    module: "Followups",
    actions: ["view", "create", "edit", "delete", "mark_complete"],
  },

  {
    key: "reports",
    module: "Reports",
    actions: ["view", "export"],
  },

  {
    key: "settings",
    module: "Settings",
    actions: ["view", "edit"],
  },

  {
    key: "email_templates",
    module: "Email Templates",
    actions: ["view", "create", "edit", "delete"],
  },

  {
    key: "smtp",
    module: "SMTP",
    actions: ["view", "edit", "test"],
  },

  {
    key: "actiity_logs",
    module: "Activity Logs",
    actions: ["view", "export"],
  },
];

export const PERMISSION_KEYS = PERMISSIONS.reduce((keys, module) => {
  const moduleKey = module.module.toUpperCase().replace(/\s+/g, "_");
  const moduleSlug = module.module.toLowerCase().replace(/\s+/g, "_");

  module.actions.forEach((action) => {
    keys[`${moduleKey}_${action.toUpperCase()}`] = `${moduleSlug}.${action}`;
  });

  return keys;
}, {});
