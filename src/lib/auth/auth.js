import { getSessionCookie } from "./cookies";
import { validateSession } from "./session";

export async function getCurrentUser() {
  const sessionToken = await getSessionCookie();

  if (!sessionToken) {
    return {
      session: null,
      user: null,
      companyId: null,
    };
  }

  return await validateSession(sessionToken);
}
