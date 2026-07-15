import { getSessionCookie } from "./cookies";
import { validateSession } from "./session";

export async function getCurrentUser() {
  const sessionToken = await getSessionCookie();

  if (!sessionToken) {
    return null;
  }

  const auth = await validateSession(sessionToken);

  return auth.user;
}
