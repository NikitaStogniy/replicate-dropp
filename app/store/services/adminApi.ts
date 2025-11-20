import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types
export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  usage_limit: number | null;
  created_at: string;
  generation_count: number;
}

export interface InviteCode {
  code: string;
  type: string;
  user_email: string | null;
  used: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface UsageStats {
  total_generations: number;
  unique_users: number;
  total_today: number;
}

export interface Team {
  id: number;
  name: string;
  created_at: string;
}

export interface ApiKeyInfo {
  configured: boolean;
  maskedKey: string | null;
}

// Request types
export interface UpdateUserRequest {
  userId: string;
  isActive?: boolean;
  usageLimit?: number | null;
  role?: string;
}

export interface UpdateApiKeyRequest {
  apiKey: string;
}

export interface CreateInviteCodeRequest {
  type: string;
  expiresInDays: number;
}

export interface UpdateTeamLimitRequest {
  teamLimit: number | null;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/admin' }),
  tagTypes: ['Users', 'InviteCodes', 'UsageStats', 'Team', 'TeamLimit', 'ApiKey'],
  endpoints: (builder) => ({
    // Queries
    getUsers: builder.query<{ users: User[] }, void>({
      query: () => '/users',
      providesTags: ['Users'],
    }),

    getInviteCodes: builder.query<{ inviteCodes: InviteCode[] }, void>({
      query: () => '/invite-codes',
      providesTags: ['InviteCodes'],
    }),

    getUsageStats: builder.query<{ teamStats: UsageStats }, void>({
      query: () => '/usage',
      providesTags: ['UsageStats'],
    }),

    getTeam: builder.query<{ team: Team }, void>({
      query: () => '/team',
      providesTags: ['Team'],
    }),

    getTeamLimit: builder.query<{ teamLimit: number | null }, void>({
      query: () => '/limits',
      providesTags: ['TeamLimit'],
    }),

    getApiKey: builder.query<ApiKeyInfo, void>({
      query: () => '/api-key',
      providesTags: ['ApiKey'],
    }),

    // Mutations
    updateUser: builder.mutation<void, UpdateUserRequest>({
      query: (body) => ({
        url: '/users',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Users', 'UsageStats'],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/users?userId=${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users', 'UsageStats'],
    }),

    updateApiKey: builder.mutation<void, UpdateApiKeyRequest>({
      query: (body) => ({
        url: '/api-key',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ApiKey'],
    }),

    createInviteCode: builder.mutation<void, CreateInviteCodeRequest>({
      query: (body) => ({
        url: '/invite-codes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['InviteCodes'],
    }),

    updateTeamLimit: builder.mutation<void, UpdateTeamLimitRequest>({
      query: (body) => ({
        url: '/limits',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['TeamLimit'],
    }),
  }),
});

export const {
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
} = adminApi;
