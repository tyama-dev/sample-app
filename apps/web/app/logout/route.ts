import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { logout } from "@/modules/auth/application/usecases/logout-use-case";
import { accountRepository } from "@/modules/auth/infrastructure/account-repository";

export async function GET() {
  const redirectUrl = await logout({
    requestHeaders: await headers(),
    repository: accountRepository,
  });

  if (!redirectUrl) {
    return NextResponse.redirect(process.env.BETTER_AUTH_URL!);
  }

  return NextResponse.redirect(redirectUrl);
}
