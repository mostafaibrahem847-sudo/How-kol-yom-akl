import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, typography, buttonSize } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';
import { toArabicNumerals } from '../i18n/numerals';

type FeatherName = keyof typeof Feather.glyphMap;

const SettingRow = ({ icon, label, note }: { icon: FeatherName; label: string; note?: string }) => (
  <TouchableOpacity style={styles.settingRow} activeOpacity={0.8}>
    <Feather name={icon} size={20} color={colors.neutralMuted} style={styles.settingIcon} />
    <View style={styles.settingContent}>
      <Text style={styles.settingLabel}>{label}</Text>
      {note && <Text style={styles.settingNote}>{note}</Text>}
    </View>
    <Feather name="chevron-left" size={20} color={colors.neutralLight} style={styles.settingArrow} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { favorites } = useFavorites();

  return (
    <View style={styles.root}>
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
            <Feather name="heart" size={18} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statLabel}>الوصفات المفضلة</Text>
            <Text style={styles.statValue}>{toArabicNumerals(favorites.size)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Feather name="check-circle" size={18} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statLabel}>أكلات مجربة</Text>
            <Text style={styles.statValue}>{toArabicNumerals(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Feather name="mic" size={18} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statLabel}>وصفات بصوت طنط منى</Text>
            <Text style={styles.statValue}>{toArabicNumerals(favorites.size)}</Text>
          </View>
        </View>

        {/* Settings section */}
        <Text style={styles.sectionTitle}>الإعدادات</Text>

        <View style={styles.settingsCard}>
          <SettingRow icon="bell" label="الإشعارات" note="قريباً" />
          <View style={styles.divider} />
          <SettingRow icon="volume-2" label="إعدادات الصوت" note="صوت طنط منى" />
          <View style={styles.divider} />
          <SettingRow icon="globe" label="اللغة" note="العربية" />
          <View style={styles.divider} />
          <SettingRow icon="info" label="عن التطبيق" note="الإصدار ١.٠.٠" />
        </View>

        {/* App info */}
        <Text style={styles.appTagline}>{t.app.tagline}</Text>
        <Text style={styles.version}>الإصدار 1.0.0</Text>
        <Text style={styles.version}>#هو_كل_يوم_أكل</Text>
      </ScrollView>
    </View>
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
  statIcon: { marginRight: spacing.md },
  statLabel: { ...typography.body, color: colors.neutralMid, flex: 1 },
  statValue: { ...typography.h2, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  sectionTitle: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.md },
  settingsCard: { backgroundColor: colors.neutralSurface, borderRadius: 12, marginBottom: spacing.xl, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  settingIcon: { marginRight: spacing.md },
  settingContent: { flex: 1 },
  settingLabel: { ...typography.body, color: colors.neutralDark },
  settingNote: { ...typography.bodySmall, color: colors.neutralMuted },
  settingArrow: { color: colors.neutralLight },
  appTagline: { ...typography.body, color: colors.neutralMuted, textAlign: 'center', marginBottom: spacing.xs },
  version: { ...typography.caption, color: colors.neutralLight, textAlign: 'center', marginBottom: 2 },
});
