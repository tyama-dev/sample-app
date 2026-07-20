export function buildKeycloakLogoutUrl(
  idToken: string | undefined,
  postLogoutRedirectUri: string,
): URL {
  const url = new URL(
    `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
  );
  if (idToken) {
    url.searchParams.set("id_token_hint", idToken);
  }
  url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  return url;
}
