import { auth } from "@/modules/auth/infrastructure/better-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const response = await auth.api.signInWithOAuth2({
    body: {
      providerId: "keycloak",
      callbackURL: "/",
    },
  });

  return NextResponse.redirect(response.url);
}
