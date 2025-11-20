"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useGetUsersQuery,
  useGetInviteCodesQuery,
  useGetUsageStatsQuery,
  useGetTeamQuery,
  useGetTeamLimitQuery,
  useGetApiKeyQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateApiKeyMutation,
  useCreateInviteCodeMutation,
  useUpdateTeamLimitMutation,
} from "@/app/store/services/adminApi";
import ConfirmModal from "@/app/components/Modals/ConfirmModal";
import AlertModal from "@/app/components/Modals/AlertModal";
import PromptModal from "@/app/components/Modals/PromptModal";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"users" | "invites" | "usage">("users");
  const [newInviteExpiry, setNewInviteExpiry] = useState("7");

  // Modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', message: '', variant: 'info' });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmVariant?: 'danger' | 'primary';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmVariant: 'primary' });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onSubmit: (value: string) => void;
    inputType?: 'text' | 'number';
  }>({ isOpen: false, title: '', message: '', defaultValue: '', onSubmit: () => {}, inputType: 'text' });

  // RTK Query hooks
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(undefined, {
    skip: status !== "authenticated" || session?.user?.role !== "admin",
  });
  const { data: inviteCodesData, isLoading: inviteCodesLoading } = useGetInviteCodesQuery(undefined, {
    skip: status !== "authenticated" || session?.user?.role !== "admin",
  });
  const { data: usageStatsData, isLoading: usageStatsLoading } = useGetUsageStatsQuery(undefined, {
    skip: status !== "authenticated" || session?.user?.role !== "admin",
  });
  const { data: teamData, isLoading: teamLoading } = useGetTeamQuery(undefined, {
    skip: status !== "authenticated" || session?.user?.role !== "admin",
  });
  const { data: teamLimitData, isLoading: teamLimitLoading } = useGetTeamLimitQuery(undefined, {
    skip: status !== "authenticated" || session?.user?.role !== "admin",
  });
  const { data: apiKeyData, isLoading: apiKeyLoading } = useGetApiKeyQuery(undefined, {
    skip: status !== "authenticated" || session?.user?.role !== "admin",
  });

  // Mutations
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [updateApiKeyMutation] = useUpdateApiKeyMutation();
  const [createInviteCode] = useCreateInviteCodeMutation();
  const [updateTeamLimitMutation] = useUpdateTeamLimitMutation();

  // Extract data with defaults
  const users = usersData?.users || [];
  const inviteCodes = inviteCodesData?.inviteCodes || [];
  const usageStats = usageStatsData?.teamStats || null;
  const team = teamData?.team || null;
  const teamLimit = teamLimitData?.teamLimit || null;
  const apiKeyConfigured = apiKeyData?.configured || false;
  const maskedApiKey = apiKeyData?.maskedKey || null;

  const loading =
    usersLoading ||
    inviteCodesLoading ||
    usageStatsLoading ||
    teamLoading ||
    teamLimitLoading ||
    apiKeyLoading;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

  const handleUpdateApiKey = () => {
    setPromptModal({
      isOpen: true,
      title: 'Update API Key',
      message: 'Enter Replicate API key (starts with r8_):\n\nGet your API key from: https://replicate.com/account/api-tokens',
      defaultValue: '',
      inputType: 'text',
      onSubmit: async (newKey: string) => {
        if (!newKey.trim()) {
          setAlertModal({
            isOpen: true,
            title: 'Validation Error',
            message: 'API key cannot be empty',
            variant: 'error',
          });
          return;
        }

        if (!newKey.startsWith('r8_')) {
          setAlertModal({
            isOpen: true,
            title: 'Validation Error',
            message: "Invalid API key format. Key should start with 'r8_'",
            variant: 'error',
          });
          return;
        }

        try {
          await updateApiKeyMutation({ apiKey: newKey }).unwrap();
          setAlertModal({
            isOpen: true,
            title: 'Success',
            message: 'API key updated successfully!',
            variant: 'success',
          });
        } catch (error: any) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: `Failed to update API key: ${error.data?.error || error.message}`,
            variant: 'error',
          });
        }
      },
    });
  };

  const handleCreateInviteCode = async () => {
    try {
      await createInviteCode({
        type: "invite",
        expiresInDays: parseInt(newInviteExpiry),
      }).unwrap();
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to create invite code',
        variant: 'error',
      });
    }
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUser({
        userId,
        isActive: !currentStatus,
      }).unwrap();
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update user status',
        variant: 'error',
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteUser(userId).unwrap();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete user',
            variant: 'error',
          });
        }
      },
    });
  };

  const handleUpdateTeamLimit = () => {
    setPromptModal({
      isOpen: true,
      title: 'Update Team Limit',
      message: 'Enter new team limit (or empty for unlimited):',
      defaultValue: teamLimit?.toString() || '',
      inputType: 'number',
      onSubmit: async (value: string) => {
        try {
          await updateTeamLimitMutation({
            teamLimit: value === '' ? null : parseInt(value),
          }).unwrap();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to update team limit',
            variant: 'error',
          });
        }
      },
    });
  };

  const handleUpdateUserLimit = (userId: string, currentLimit: number | null) => {
    setPromptModal({
      isOpen: true,
      title: 'Update User Limit',
      message: 'Enter new user limit (or empty for unlimited):',
      defaultValue: currentLimit?.toString() || '',
      inputType: 'number',
      onSubmit: async (value: string) => {
        try {
          await updateUser({
            userId,
            usageLimit: value === '' ? null : parseInt(value),
          }).unwrap();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to update user limit',
            variant: 'error',
          });
        }
      },
    });
  };

  const handleToggleUserRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const message = currentRole === "admin"
      ? "Are you sure you want to remove admin privileges from this user?"
      : "Are you sure you want to grant admin privileges to this user?";

    setConfirmModal({
      isOpen: true,
      title: 'Change User Role',
      message,
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          await updateUser({
            userId,
            role: newRole,
          }).unwrap();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to update user role',
            variant: 'error',
          });
        }
      },
    });
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
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            {team && (
              <div className="mt-2 text-sm text-gray-400">
                <span className="font-medium">{team.name}</span>
                <span className="mx-2">•</span>
                <span className="font-mono">Team ID: {team.id}</span>
              </div>
            )}
          </div>
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
              onClick={handleUpdateTeamLimit}
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
              onClick={handleUpdateApiKey}
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
                        onClick={() => handleUpdateUserLimit(user.id, user.usage_limit)}
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
                        onClick={() => handleToggleUserActive(user.id, user.is_active)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                      >
                        {user.is_active ? "Disable" : "Enable"}
                      </button>
                      {user.id !== session.user.id && (
                        <>
                          <button
                            onClick={() => handleToggleUserRole(user.id, user.role)}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </>
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
                  onClick={handleCreateInviteCode}
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

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmVariant={confirmModal.confirmVariant}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onSubmit={promptModal.onSubmit}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        inputType={promptModal.inputType}
      />
    </div>
  );
}
