import type { MiddlewareHandler } from "hono";
import { authenticateRequest } from "../../application/usecases/authenticate-request";
import { joseTokenVerifier } from "../../infrastructure/repositories/jose-token-verifier";
import { hasRole } from "../../domain/entities/token-payload";
import type { TokenPayload } from "../../domain/entities/token-payload";

export const requireAuth: MiddlewareHandler<{
  Variables: { jwtPayload: TokenPayload };
}> = async (c, next) => {
  const payload = await authenticateRequest({
    authorizationHeader: c.req.header("Authorization"),
    repository: joseTokenVerifier,
  });

  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("jwtPayload", payload);
  await next();
};

export const requireRole = (
  role: string,
): MiddlewareHandler<{ Variables: { jwtPayload: TokenPayload } }> => {
  return async (c, next) => {
    const payload = c.get("jwtPayload");
    if (!payload || !hasRole(payload, role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
};
