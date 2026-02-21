import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEMO_LOGIN } from '../constants/auth';

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
  signIn: (email: string, password: string) => { ok: true } | { ok: false; message: string };
  signOut: () => void;
  createUser: (input: CreateUserInput) => { ok: true } | { ok: false; message: string };
  updateUserPassword: (userId: string, newPassword: string) => { ok: true } | { ok: false; message: string };
  updateUserCredit: (userId: string, credit: number) => { ok: true } | { ok: false; message: string };
  consumeCurrentUserCredit: (amount?: number) => { ok: true; remaining: number } | { ok: false; message: string };
  deleteUser: (userId: string) => { ok: true } | { ok: false; message: string };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialAdmin: ManagedUser = {
  id: 'usr_admin_1',
  fullName: DEMO_LOGIN.fullName,
  email: DEMO_LOGIN.email,
  password: DEMO_LOGIN.password,
  role: DEMO_LOGIN.role,
  credit: DEMO_LOGIN.credit,
  createdAt: new Date().toISOString(),
};

function sanitizeUser(user: ManagedUser): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    credit: user.credit,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>([initialAdmin]);
  const [user, setUser] = useState<AuthUser | null>(null);

  const signIn = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const matched = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail && u.password === password
    );

    if (!matched) {
      return { ok: false as const, message: 'E-posta veya şifre hatalı.' };
    }

    setUser(sanitizeUser(matched));
    return { ok: true as const };
  };

  const signOut = () => setUser(null);

  const createUser = (input: CreateUserInput) => {
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
    if (users.some((u) => u.email.trim().toLowerCase() === email)) {
      return { ok: false as const, message: 'Bu e-posta zaten kayıtlı.' };
    }

    const nextUser: ManagedUser = {
      id: `usr_${Date.now()}`,
      fullName,
      email,
      password,
      role: input.role,
      credit: Math.max(0, Math.floor(input.credit || 0)),
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [nextUser, ...prev]);
    return { ok: true as const };
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false as const, message: 'Yeni şifre en az 6 karakter olmalı.' };
    }

    let updated = false;
    setUsers((prev) =>
      prev.map((item) => {
        if (item.id !== userId) return item;
        updated = true;
        return { ...item, password: newPassword };
      })
    );

    if (!updated) {
      return { ok: false as const, message: 'Kullanıcı bulunamadı.' };
    }

    return { ok: true as const };
  };

  const updateUserCredit = (userId: string, credit: number) => {
    const safeCredit = Math.max(0, Math.floor(credit));
    let updatedUser: ManagedUser | null = null;

    setUsers((prev) =>
      prev.map((item) => {
        if (item.id !== userId) return item;
        const next = { ...item, credit: safeCredit };
        updatedUser = next;
        return next;
      })
    );

    if (!updatedUser) {
      return { ok: false as const, message: 'Kullanıcı bulunamadı.' };
    }

    if (user?.id === userId) {
      setUser(sanitizeUser(updatedUser));
    }

    return { ok: true as const };
  };

  const deleteUser = (userId: string) => {
    if (userId === initialAdmin.id) {
      return { ok: false as const, message: 'Varsayılan admin silinemez.' };
    }

    const exists = users.some((u) => u.id === userId);
    if (!exists) {
      return { ok: false as const, message: 'Kullanıcı bulunamadı.' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (user?.id === userId) {
      setUser(null);
    }

    return { ok: true as const };
  };

  const consumeCurrentUserCredit = (amount: number = 1) => {
    if (!user) {
      return { ok: false as const, message: 'Kullanıcı oturumu yok.' };
    }
    const safeAmount = Math.max(1, Math.floor(amount));
    if (user.credit < safeAmount) {
      return { ok: false as const, message: 'Yetersiz kredi.' };
    }

    const nextCredit = user.credit - safeAmount;
    const updateResult = updateUserCredit(user.id, nextCredit);
    if (!updateResult.ok) {
      return { ok: false as const, message: updateResult.message };
    }

    return { ok: true as const, remaining: nextCredit };
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
      consumeCurrentUserCredit,
      deleteUser,
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
