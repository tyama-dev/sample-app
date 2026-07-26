import { auth } from "../../../auth/infrastructure/better-auth";
import {
  honoApiClient,
  type ApiResult,
} from "../../../../shared/client/api-client";

export async function getAdminStats(
  userId: string,
): Promise<ApiResult<unknown>> {
  const { accessToken } = await auth.api.getAccessToken({
    body: { providerId: "keycloak", userId },
  });

  return honoApiClient.get("/admin/stats", accessToken);
}
