"use client";

import { useEffect, useState } from "react";
import { Nav, NavLink } from "@/components/Nav";
import { useRouter } from "next/navigation";
import { getSession, signOut, SessionProvider } from 'next-auth/react';
import { Session } from "next-auth"; // Import Session type from next-auth

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<Session | null>(null); // Specify type here
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSession(); // Fetch the session
        console.log("Session:", sessionData);
        if (!sessionData) {
          router.push('/enter'); // Redirect to sign-in page if not authenticated
        } else {
          setSession(sessionData); // Set session if authenticated
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        router.push('/enter'); // Redirect to sign-in page on error
      } finally {
        setLoading(false); // Ensure loading state is cleared
      }
    };

    fetchSession();
  }, [router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false }); // Sign out without redirecting
    router.push('/enter'); // Redirect to sign-in page
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>; // A centered loading state
  }

  return (
    <>
      <Nav>
        <NavLink href="/home">Home</NavLink>
        <NavLink href="/products">Products</NavLink>
        <NavLink href="/orders">My Orders</NavLink>
        <NavLink href="/cart">Cart</NavLink>
        {session && (
          <button onClick={handleSignOut} className="btn-signout text-red-500">
            Sign Out
          </button>
        )}
      </Nav>
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        <div className="container mx-auto my-6 p-6 bg-white/90 shadow-lg rounded-lg">
          <SessionProvider session={session}>{children}</SessionProvider> {/* Pass the session here */}
        </div>
      </div>
    </>
  );
}
