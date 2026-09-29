// app/page.tsx
// Root entrypoint — redirects to /dashboard (middleware redirects to /sign-in if unauthenticated)
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
