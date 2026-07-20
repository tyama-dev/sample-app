import { AccountRepository } from "../../domain/repository/account-repository";
import { auth } from "../../infrastructure/better-auth";
import { buildKeycloakLogoutUrl } from "../../infrastructure/keycloak-session";

export interface LogoutProps {
  requestHeaders: Headers;
  repository: AccountRepository;
}
export async function logout({ requestHeaders, repository }: LogoutProps) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }
  const idToken = await repository.getKeycloakIdToken(session.user.id);
  await auth.api.signOut({ headers: requestHeaders });

  return buildKeycloakLogoutUrl(idToken, process.env.BETTER_AUTH_URL!);
}
