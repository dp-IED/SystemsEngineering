// app/page.tsx
"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import ExpenseDashboard from "@/components/dashboard/page";

export default function Home() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    // Redirect to the Clerk sign-in page
    return <RedirectToSignIn />;
  }

  return <ExpenseDashboard />;
}
