import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface AdminScreenProps {
  navigation: any;
}

const isWeb = Platform.OS === 'web';

export default function AdminScreen({ navigation }: AdminScreenProps) {
  const { user, isAdmin, users, createUser, updateUserPassword, updateUserCredit, deleteUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credit, setCredit] = useState('20');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [creditDrafts, setCreditDrafts] = useState<Record<string, string>>({});

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [users]);

  const handleCreateUser = () => {
    const parsedCredit = Number(credit);
    const result = createUser({
      fullName,
      email,
      password,
      role,
      credit: Number.isFinite(parsedCredit) ? parsedCredit : 0,
    });

    if (!result.ok) {
      Alert.alert('Hata', result.message);
      return;
    }

    setFullName('');
    setEmail('');
    setPassword('');
    setCredit('20');
    setRole('STAFF');
    Alert.alert('Başarılı', 'Kullanıcı eklendi.');
  };

  const handlePasswordUpdate = (userId: string) => {
    const nextPassword = (passwordDrafts[userId] || '').trim();
    const result = updateUserPassword(userId, nextPassword);
    if (!result.ok) {
      Alert.alert('Hata', result.message);
      return;
    }

    setPasswordDrafts((prev) => ({ ...prev, [userId]: '' }));
    Alert.alert('Başarılı', 'Şifre güncellendi.');
  };

  const handleCreditUpdate = (userId: string) => {
    const nextCredit = Number(creditDrafts[userId] || '0');
    const result = updateUserCredit(userId, Number.isFinite(nextCredit) ? nextCredit : 0);
    if (!result.ok) {
      Alert.alert('Hata', result.message);
      return;
    }

    Alert.alert('Başarılı', 'Kredi güncellendi.');
  };

  const handleDelete = (userId: string) => {
    const result = deleteUser(userId);
    if (!result.ok) {
      Alert.alert('Hata', result.message);
      return;
    }
    Alert.alert('Silindi', 'Kullanıcı kaldırıldı.');
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.blockedWrap}>
          <Text style={styles.blockedTitle}>Bu sayfa sadece admin için</Text>
          <Pressable style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Geri Dön</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={[styles.scroll, isWeb && ({ overflowY: 'auto', maxHeight: '100vh' } as any)]}
        contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Geri</Text>
        </Pressable>

        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Kullanıcı oluştur, şifre belirle, kredi yönet.</Text>
        <Text style={styles.adminMeta}>Giriş: {user?.fullName} ({user?.email})</Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Yeni Kullanıcı</Text>
          <TextInput style={styles.input} placeholder="Ad Soyad" placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={setFullName} />
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Başlangıç kredi"
            placeholderTextColor={COLORS.textMuted}
            value={credit}
            onChangeText={setCredit}
            keyboardType="number-pad"
          />

          <View style={styles.roleRow}>
            <Pressable style={[styles.roleBtn, role === 'STAFF' && styles.roleBtnActive]} onPress={() => setRole('STAFF')}>
              <Text style={[styles.roleBtnText, role === 'STAFF' && styles.roleBtnTextActive]}>STAFF</Text>
            </Pressable>
            <Pressable style={[styles.roleBtn, role === 'ADMIN' && styles.roleBtnActive]} onPress={() => setRole('ADMIN')}>
              <Text style={[styles.roleBtnText, role === 'ADMIN' && styles.roleBtnTextActive]}>ADMIN</Text>
            </Pressable>
          </View>

          <Pressable style={styles.primaryBtn} onPress={handleCreateUser}>
            <Text style={styles.primaryBtnText}>Kullanıcı Ekle</Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Kullanıcılar ({sortedUsers.length})</Text>
          {sortedUsers.map((item) => (
            <View key={item.id} style={styles.userCard}>
              <View style={styles.userTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.fullName}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={styles.roleChip}><Text style={styles.roleChipText}>{item.role}</Text></View>
              </View>

              <Text style={styles.userMeta}>Aktif Şifre: {item.password}</Text>
              <Text style={styles.userMeta}>Kredi: {item.credit}</Text>

              <TextInput
                style={styles.input}
                placeholder="Yeni şifre"
                placeholderTextColor={COLORS.textMuted}
                value={passwordDrafts[item.id] || ''}
                onChangeText={(val) => setPasswordDrafts((prev) => ({ ...prev, [item.id]: val }))}
              />

              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.input, styles.creditInput]}
                  placeholder="Kredi"
                  placeholderTextColor={COLORS.textMuted}
                  value={creditDrafts[item.id] ?? String(item.credit)}
                  onChangeText={(val) => setCreditDrafts((prev) => ({ ...prev, [item.id]: val }))}
                  keyboardType="number-pad"
                />
                <Pressable style={styles.inlineBtn} onPress={() => handleCreditUpdate(item.id)}>
                  <Text style={styles.inlineBtnText}>Kredi Güncelle</Text>
                </Pressable>
              </View>

              <View style={styles.inlineRow}>
                <Pressable style={styles.inlineBtn} onPress={() => handlePasswordUpdate(item.id)}>
                  <Text style={styles.inlineBtnText}>Şifre Güncelle</Text>
                </Pressable>
                <Pressable style={[styles.inlineBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.inlineBtnText}>Kullanıcı Sil</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxl + SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  contentWeb: {
    paddingBottom: SPACING.xxl + 80,
    maxWidth: 980,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  adminMeta: {
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    fontSize: 12,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  roleBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  roleBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(200, 134, 10, 0.15)',
  },
  roleBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  roleBtnTextActive: {
    color: COLORS.primaryLight,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    marginTop: SPACING.xs,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  userCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceElevated,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  userName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  roleChip: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleChipText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  userMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  creditInput: {
    flex: 1,
  },
  inlineBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  inlineBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    borderColor: '#6A2A2A',
    backgroundColor: '#2A1717',
  },
  blockedWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  blockedTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
});
