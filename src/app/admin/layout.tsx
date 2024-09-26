"use client";

import { getSession, signOut, useSession } from 'next-auth/react';
import { useEffect } from "react";
import { Nav, NavLink } from "@/components/Nav";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  console.log("SESSION LAYOUT", session);
  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect when the status is 'unauthenticated', not when loading
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, router]);

  // While loading the session
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false }); // Sign out without redirecting
    router.push("/login"); // Redirect to sign-in page
  };

  // If session exists and user is an admin, render the content
  if (session && session.user && session.user.isAdmin === true) {
    return (
      <div>
        <Nav>
          <NavLink href="/admin">Dashboard</NavLink>
          <NavLink href="/admin/products">Products</NavLink>
          <NavLink href="/admin/users">Customers</NavLink>
          <NavLink href="/admin/orders">Sales</NavLink>
          {session && (
            <button onClick={handleSignOut} className="btn-signout text-red-500">
              Sign Out
            </button>
          )}
        </Nav>
        <div className="container my-6">{children}</div>
      </div>
    );
  } else {
    return (
      <div className="container my-6">
        <h1 className="text-2xl font-bold text-red-500">Unauthorized</h1>
        <p>You do not have permission to access this area.</p>
        <button onClick={handleSignOut} className="mt-4 btn-signout text-blue-500">
          Return to Login
        </button>
      </div>
    );
  }

  // If session doesn't exist, return null (shouldn't happen due to the redirect)
  return null;
}

export default AdminLayoutContent;
