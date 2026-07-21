import type { TokenVerifier } from "../../domain/repositories/token-verifier";
import type { TokenPayload } from "../../domain/entities/token-payload";

export interface AuthenticateRequestProps {
  authorizationHeader: string | undefined;
  repository: TokenVerifier;
}

export async function authenticateRequest({
  authorizationHeader,
  repository,
}: AuthenticateRequestProps): Promise<TokenPayload | null> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    return await repository.verify(token);
  } catch {
    return null;
  }
}
