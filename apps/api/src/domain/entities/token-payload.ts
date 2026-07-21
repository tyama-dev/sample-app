export interface TokenPayload {
  sub: string;
  realm_access?: {
    roles?: string[];
  };
  [key: string]: unknown;
}

export function hasRole(payload: TokenPayload, role: string): boolean {
  return payload.realm_access?.roles?.includes(role) ?? false;
}
