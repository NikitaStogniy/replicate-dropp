"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Session } from "next-auth";

interface HeaderProps {
  session: Session | null;
}

export default function Header({ session }: HeaderProps) {
  if (!session) return null;

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            {session.user.email}
          </span>
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
