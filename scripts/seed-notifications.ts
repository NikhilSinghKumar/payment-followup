import { seedNotificationTemplates } from "./seed-notification-templates";

async function main() {
  await seedNotificationTemplates();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
