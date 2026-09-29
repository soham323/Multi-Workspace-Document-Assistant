import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Header from "@/components/dashboard/Header";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <WorkspaceProvider>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header userEmail={user.email ?? "User"} />
        <main style={{ flex: 1, padding: "32px 28px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}

