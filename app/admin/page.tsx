"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  usage_limit: number | null;
  created_at: string;
  generation_count: number;
}

interface InviteCode {
  code: string;
  type: string;
  user_email: string | null;
  used: boolean;
  created_at: string;
  expires_at: string | null;
}

interface UsageStats {
  total_generations: number;
  unique_users: number;
  total_today: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [teamLimit, setTeamLimit] = useState<number | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "invites" | "usage">("users");
  const [loading, setLoading] = useState(true);
  const [newInviteExpiry, setNewInviteExpiry] = useState("7");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "admin") {
        router.push("/");
      } else {
        loadData();
      }
    }
  }, [status, session, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadInviteCodes(), loadUsageStats(), loadTeamLimit(), loadApiKey()]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  };

  const loadInviteCodes = async () => {
    const res = await fetch("/api/admin/invite-codes");
    if (res.ok) {
      const data = await res.json();
      setInviteCodes(data.inviteCodes);
    }
  };

  const loadUsageStats = async () => {
    const res = await fetch("/api/admin/usage");
    if (res.ok) {
      const data = await res.json();
      setUsageStats(data.teamStats);
    }
  };

  const loadTeamLimit = async () => {
    const res = await fetch("/api/admin/limits");
    if (res.ok) {
      const data = await res.json();
      setTeamLimit(data.teamLimit);
    }
  };

  const loadApiKey = async () => {
    const res = await fetch("/api/admin/api-key");
    if (res.ok) {
      const data = await res.json();
      setApiKeyConfigured(data.configured);
      setMaskedApiKey(data.maskedKey);
    }
  };

  const updateApiKey = async () => {
    const newKey = prompt(
      "Enter Replicate API key (starts with r8_):\n\nGet your API key from: https://replicate.com/account/api-tokens",
      ""
    );

    if (newKey === null) return;

    if (!newKey.trim()) {
      alert("API key cannot be empty");
      return;
    }

    if (!newKey.startsWith("r8_")) {
      alert("Invalid API key format. Key should start with 'r8_'");
      return;
    }

    const res = await fetch("/api/admin/api-key", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: newKey }),
    });

    if (res.ok) {
      alert("API key updated successfully!");
      await loadApiKey();
    } else {
      const data = await res.json();
      alert(`Failed to update API key: ${data.error}`);
    }
  };

  const createInviteCode = async () => {
    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "invite",
        expiresInDays: parseInt(newInviteExpiry),
      }),
    });

    if (res.ok) {
      await loadInviteCodes();
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        isActive: !currentStatus,
      }),
    });

    if (res.ok) {
      await loadUsers();
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const res = await fetch(`/api/admin/users?userId=${userId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await loadUsers();
    }
  };

  const updateTeamLimit = async () => {
    const newLimit = prompt("Enter new team limit (or empty for unlimited):", teamLimit?.toString() || "");
    if (newLimit === null) return;

    const res = await fetch("/api/admin/limits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamLimit: newLimit === "" ? null : parseInt(newLimit),
      }),
    });

    if (res.ok) {
      await loadTeamLimit();
    }
  };

  const updateUserLimit = async (userId: string, currentLimit: number | null) => {
    const newLimit = prompt(
      "Enter new user limit (or empty for unlimited):",
      currentLimit?.toString() || ""
    );
    if (newLimit === null) return;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        usageLimit: newLimit === "" ? null : parseInt(newLimit),
      }),
    });

    if (res.ok) {
      await loadUsers();
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Back to App
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm">Total Generations</h3>
            <p className="text-3xl font-bold">{usageStats?.total_generations || 0}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm">Active Users</h3>
            <p className="text-3xl font-bold">{usageStats?.unique_users || 0}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm">Generations Today</h3>
            <p className="text-3xl font-bold">{usageStats?.total_today || 0}</p>
          </div>
        </div>

        {/* Team Limit */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Team Generation Limit</h3>
              <p className="text-gray-400">
                {teamLimit ? `${teamLimit} generations` : "Unlimited"}
              </p>
            </div>
            <button
              onClick={updateTeamLimit}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Update Limit
            </button>
          </div>
        </div>

        {/* API Key Settings */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Replicate API Key</h3>
              {apiKeyConfigured ? (
                <div>
                  <p className="text-green-400 text-sm mb-1">✓ Configured</p>
                  <p className="text-gray-400 text-xs font-mono">{maskedApiKey}</p>
                </div>
              ) : (
                <div>
                  <p className="text-red-400 text-sm mb-1">✗ Not configured</p>
                  <p className="text-gray-500 text-xs">
                    Image generation will not work until API key is set
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={updateApiKey}
              className={`px-4 py-2 rounded ${
                apiKeyConfigured
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {apiKeyConfigured ? "Update API Key" : "Set API Key"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded ${
              activeTab === "users" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            className={`px-4 py-2 rounded ${
              activeTab === "invites" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            Invite Codes ({inviteCodes.filter((c) => !c.used).length})
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-4 py-2 rounded ${
              activeTab === "usage" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            Usage Details
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Generations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{user.name || "No name"}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.role === "admin"
                            ? "bg-purple-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{user.generation_count}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateUserLimit(user.id, user.usage_limit)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {user.usage_limit || "Unlimited"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.is_active
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                      >
                        {user.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => toggleUserActive(user.id, user.is_active)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                      >
                        {user.is_active ? "Disable" : "Enable"}
                      </button>
                      {user.id !== session.user.id && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invite Codes Tab */}
        {activeTab === "invites" && (
          <div className="space-y-4">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Invite Code</h3>
              <div className="flex gap-4">
                <select
                  value={newInviteExpiry}
                  onChange={(e) => setNewInviteExpiry(e.target.value)}
                  className="px-4 py-2 bg-gray-700 rounded"
                >
                  <option value="7">Expires in 7 days</option>
                  <option value="30">Expires in 30 days</option>
                  <option value="0">Never expires</option>
                </select>
                <button
                  onClick={createInviteCode}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Generate Code
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {inviteCodes.map((code) => (
                    <tr key={code.code}>
                      <td className="px-6 py-4 font-mono text-sm">{code.code}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            code.used ? "bg-gray-600" : "bg-green-600"
                          }`}
                        >
                          {code.used ? "Used" : "Available"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {code.expires_at
                          ? new Date(code.expires_at).toLocaleDateString()
                          : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === "usage" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Per-User Usage Breakdown</h3>
            <div className="space-y-4">
              {users
                .sort((a, b) => b.generation_count - a.generation_count)
                .map((user) => (
                  <div key={user.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-sm text-gray-400">
                        Limit: {user.usage_limit || "Unlimited"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{user.generation_count}</div>
                      <div className="text-sm text-gray-400">generations</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
