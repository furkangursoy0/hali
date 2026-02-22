import React, { createContext, useContext, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants/env';

export type UserRole = 'ADMIN' | 'STAFF';

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  credit: number;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  credit: number;
}

interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  credit: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  users: ManagedUser[];
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => void;
  createUser: (input: CreateUserInput) => Promise<{ ok: true } | { ok: false; message: string }>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  updateUserCredit: (userId: string, credit: number) => Promise<{ ok: true } | { ok: false; message: string }>;
  deleteUser: (userId: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  refreshCurrentUser: () => Promise<void>;
  syncCurrentUserCredit: (credit: number) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function sanitizeUser(user: ManagedUser): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    credit: user.credit,
  };
}

function toManagedUser(input: any): ManagedUser {
  return {
    id: String(input?.id || ''),
    fullName: String(input?.fullName || ''),
    email: String(input?.email || ''),
    password: '',
    role: input?.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
    credit: Number(input?.credit || 0),
    createdAt: String(input?.createdAt || new Date().toISOString()),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);

  const loadAdminUsers = async () => {
    try {
      if (!axios.defaults.headers.common.Authorization) return;
      const response = await axios.get(`${API_BASE_URL}/admin/users`);
      const list = Array.isArray(response.data) ? response.data : [];
      setUsers(list.map(toManagedUser));
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setUsers([]);
      }
    }
  };

  const refreshCurrentUser = async () => {
    try {
      if (!axios.defaults.headers.common.Authorization) return;
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      const apiUser = response.data;
      setUser({
        id: String(apiUser?.id || ''),
        fullName: String(apiUser?.fullName || ''),
        email: String(apiUser?.email || ''),
        role: apiUser?.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        credit: Number(apiUser?.credit || 0),
      });
    } catch {
      // session invalid or backend unavailable; keep current state.
    }
  };

  const syncCurrentUserCredit = (credit: number) => {
    const safeCredit = Math.max(0, Math.floor(Number(credit || 0)));
    let currentUserId: string | null = null;
    setUser((prev) => {
      if (!prev) return prev;
      currentUserId = prev.id;
      if (prev.credit === safeCredit) return prev;
      return { ...prev, credit: safeCredit };
    });
    setUsers((prev) => {
      if (!currentUserId) return prev;
      return prev.map((item) => (item.id === currentUserId ? { ...item, credit: safeCredit } : item));
    });
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: normalizedEmail,
        password,
      });

      const token = String(response.data?.token || '');
      const apiUser = response.data?.user;
      if (!token || !apiUser?.id) {
        return { ok: false as const, message: 'Sunucu yaniti gecersiz.' };
      }

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const nextUser = {
        id: String(apiUser.id),
        fullName: String(apiUser.fullName || ''),
        email: String(apiUser.email || normalizedEmail),
        role: apiUser.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        credit: Number(apiUser.credit || 0),
      } as AuthUser;
      setUser(nextUser);
      if (nextUser.role === 'ADMIN') {
        await loadAdminUsers();
      } else {
        setUsers([]);
      }
      return { ok: true as const };
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      if (apiMessage) {
        return { ok: false as const, message: String(apiMessage) };
      }
      return { ok: false as const, message: 'Backend baglantisi kurulamadi.' };
    }
  };

  const signOut = () => {
    setUser(null);
    setUsers([]);
    delete axios.defaults.headers.common.Authorization;
  };

  const createUser = async (input: CreateUserInput) => {
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!fullName || !email || !password) {
      return { ok: false as const, message: 'Ad soyad, e-posta ve şifre zorunlu.' };
    }
    if (!email.includes('@')) {
      return { ok: false as const, message: 'Geçerli bir e-posta girin.' };
    }
    if (password.length < 6) {
      return { ok: false as const, message: 'Şifre en az 6 karakter olmalı.' };
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/users`, {
        fullName,
        email,
        password,
        role: input.role,
        credit: Math.max(0, Math.floor(input.credit || 0)),
      });
      const created = toManagedUser(response.data);
      setUsers((prev) => [created, ...prev]);
      return { ok: true as const };
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Kullanıcı oluşturulamadı.';
      return { ok: false as const, message: String(message) };
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false as const, message: 'Yeni şifre en az 6 karakter olmalı.' };
    }

    try {
      await axios.patch(`${API_BASE_URL}/admin/users/${userId}/password`, { password: newPassword });
      return { ok: true as const };
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Şifre güncellenemedi.';
      return { ok: false as const, message: String(message) };
    }
  };

  const updateUserCredit = async (userId: string, credit: number) => {
    const safeCredit = Math.max(0, Math.floor(credit));

    try {
      const response = await axios.patch(`${API_BASE_URL}/admin/users/${userId}/credit`, {
        credit: safeCredit,
      });
      const updatedCredit = Number(response?.data?.credit ?? safeCredit);
      setUsers((prev) =>
        prev.map((item) => (item.id === userId ? { ...item, credit: updatedCredit } : item))
      );
      if (user?.id === userId) {
        syncCurrentUserCredit(updatedCredit);
      }
      return { ok: true as const };
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Kredi güncellenemedi.';
      return { ok: false as const, message: String(message) };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (user?.id === userId) {
        signOut();
      }
      return { ok: true as const };
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Kullanıcı silinemedi.';
      return { ok: false as const, message: String(message) };
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isAdmin: user?.role === 'ADMIN',
      users,
      signIn,
      signOut,
      createUser,
      updateUserPassword,
      updateUserCredit,
      deleteUser,
      refreshCurrentUser,
      syncCurrentUserCredit,
    }),
    [user, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
