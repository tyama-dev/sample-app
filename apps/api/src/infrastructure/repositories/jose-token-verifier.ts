import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { TokenVerifier } from "../../domain/repositories/token-verifier";
import type { TokenPayload } from "../../domain/entities/token-payload";

let jwks: JWTVerifyGetKey | undefined;

function getJwks() {
  if (!jwks) {
    const issuer = process.env.KEYCLOAK_ISSUER!;
    jwks = createRemoteJWKSet(
      new URL(`${issuer}/protocol/openid-connect/certs`),
    );
  }
  return jwks;
}

export const joseTokenVerifier: TokenVerifier = {
  async verify(token) {
    const issuer = process.env.KEYCLOAK_ISSUER!;
    const { payload } = await jwtVerify(token, getJwks(), { issuer });
    return payload as TokenPayload;
  },
};
