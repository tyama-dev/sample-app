import { and, eq } from "drizzle-orm";
import { db, schema } from "@repo/db";
import type { AccountRepository } from "../domain/repository/account-repository";

export const accountRepository: AccountRepository = {
  async getKeycloakIdToken(userId: string) {
    const [account] = await db
      .select({ idToken: schema.account.idToken })
      .from(schema.account)
      .where(
        and(
          eq(schema.account.userId, userId),
          eq(schema.account.providerId, "keycloak"),
        ),
      );

    return account?.idToken ?? undefined;
  },
};
