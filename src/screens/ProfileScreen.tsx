import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, buttonSize } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';
import { toArabicNumerals } from '../i18n/numerals';

const SettingRow = ({ icon, label, note }: { icon: string; label: string; note?: string }) => (
  <TouchableOpacity style={styles.settingRow} activeOpacity={0.8}>
    <Text style={styles.settingIcon}>{icon}</Text>
    <View style={styles.settingContent}>
      <Text style={styles.settingLabel}>{label}</Text>
      {note && <Text style={styles.settingNote}>{note}</Text>}
    </View>
    <Text style={styles.settingArrow}>←</Text>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { favorites } = useFavorites();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>س</Text>
          </View>
          <Text style={styles.name}>{t.app.name}</Text>
          <Text style={styles.subtitle}>{t.app.tagline}</Text>
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statLabel}>الوصفات المفضلة</Text>
            <Text style={styles.statValue}>{toArabicNumerals(favorites.size)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statLabel}>أكلات مجربة</Text>
            <Text style={styles.statValue}>{toArabicNumerals(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🎙️</Text>
            <Text style={styles.statLabel}>وصفات بصوت طنط منى</Text>
            <Text style={styles.statValue}>{toArabicNumerals(favorites.size)}</Text>
          </View>
        </View>

        {/* Settings section */}
        <Text style={styles.sectionTitle}>الإعدادات</Text>

        <View style={styles.settingsCard}>
          <SettingRow icon="🔔" label="الإشعارات" note="قريباً" />
          <View style={styles.divider} />
          <SettingRow icon="🔊" label="إعدادات الصوت" note="صوت طنط منى" />
          <View style={styles.divider} />
          <SettingRow icon="🌐" label="اللغة" note="العربية" />
          <View style={styles.divider} />
          <SettingRow icon="📱" label="عن التطبيق" note="الإصدار ١.٠.٠" />
        </View>

        {/* App info */}
        <Text style={styles.appTagline}>{t.app.tagline}</Text>
        <Text style={styles.version}>الإصدار 1.0.0</Text>
        <Text style={styles.version}>#هو_كل_يوم_أكل</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scroll: { paddingHorizontal: screenPadding.horizontal, paddingVertical: spacing.xl, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarLetter: { ...typography.display, fontSize: 36, color: colors.white },
  name: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.neutralMuted },
  statsCard: { backgroundColor: colors.neutralSurface, borderRadius: 12, marginBottom: spacing.xl, overflow: 'hidden' },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  statIcon: { fontSize: 18, marginRight: spacing.md },
  statLabel: { ...typography.body, color: colors.neutralMid, flex: 1 },
  statValue: { ...typography.h2, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  sectionTitle: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.md },
  settingsCard: { backgroundColor: colors.neutralSurface, borderRadius: 12, marginBottom: spacing.xl, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  settingIcon: { fontSize: 20, marginRight: spacing.md },
  settingContent: { flex: 1 },
  settingLabel: { ...typography.body, color: colors.neutralDark },
  settingNote: { ...typography.bodySmall, color: colors.neutralMuted },
  settingArrow: { fontSize: 16, color: colors.neutralLight },
  appTagline: { ...typography.body, color: colors.neutralMuted, textAlign: 'center', marginBottom: spacing.xs },
  version: { ...typography.caption, color: colors.neutralLight, textAlign: 'center', marginBottom: 2 },
});
