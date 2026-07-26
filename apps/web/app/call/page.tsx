import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/infrastructure/better-auth";
import { getAdminStats } from "@/modules/admin/application/usecases/get-admin-stats";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const result = await getAdminStats(session.user.id);

  if (!result.ok) {
    if (result.status === 403) {
      return <p>この画面を見る権限がありません。</p>;
    }
    return <p>エラーが発生しました(status: {result.status})</p>;
  }

  return (
    <div>
      <h1>Admin Stats</h1>
      <pre>{JSON.stringify(result.data, null, 2)}</pre>
    </div>
  );
}
