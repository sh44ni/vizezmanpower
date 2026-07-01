import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LandingPage from "@/components/LandingPage";

/**
 * Root route — server-side auth gate.
 * - Session present  → redirect to /dashboard (no flash, no client JS needed)
 * - No session       → render the marketing landing page
 */
export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <LandingPage />;
}
