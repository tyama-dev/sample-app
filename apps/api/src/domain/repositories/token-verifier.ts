import type { TokenPayload } from "../entities/token-payload";

export interface TokenVerifier {
  verify(token: string): Promise<TokenPayload>;
}
