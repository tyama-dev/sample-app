import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { db, schema } from "@repo/db";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "keycloak",
          clientId: process.env.KEYCLOAK_CLIENT_ID!,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
          authorizationUrl: `${process.env.KEYCLOAK_ISSUER_PUBLIC}/protocol/openid-connect/auth`,
          tokenUrl: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
          userInfoUrl: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
          scopes: ["openid", "profile", "email"],
          pkce: true,
        },
      ],
    }),
    nextCookies(),
  ],
});
