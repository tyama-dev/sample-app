export interface AccountRepository {
  getKeycloakIdToken(userId: string): Promise<string | undefined>;
}
