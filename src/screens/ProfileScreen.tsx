import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useAuth, useUser } from '@clerk/expo';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';
import { toArabicNumerals } from '../i18n/numerals';
import AuthPrimaryButton from '../components/AuthPrimaryButton';

type FeatherName = keyof typeof Feather.glyphMap;

type SettingRowProps = {
  icon: FeatherName;
  label: string;
  note?: string;
  iconColor?: string;
  /** Only rows that actually do something get a chevron and a pressed state. */
  onPress?: () => void;
};

const SettingRow = ({
  icon,
  label,
  note,
  iconColor = colors.neutralMuted,
  onPress,
}: SettingRowProps) => {
  const row = (
    <View style={styles.settingRow}>
      <Feather name={icon} size={20} color={iconColor} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {note ? <Text style={styles.settingNote}>{note}</Text> : null}
      </View>
      {onPress ? (
        <Feather name="chevron-left" size={20} color={colors.neutralLight} style={styles.settingArrow} />
      ) : null}
    </View>
  );

  if (!onPress) return row;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
      {row}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { favorites } = useFavorites();
  const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const [signingOut, setSigningOut] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const displayName = user?.fullName?.trim() || user?.firstName?.trim() || '';
  const initials = (displayName || email)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // Sign-out failures are not surfaced; the user can retry.
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identity header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            {initials ? (
              <Text style={styles.avatarInitials}>{initials}</Text>
            ) : (
              <Feather name="user" size={32} color={colors.white} />
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {displayName || t.app.name}
          </Text>
          <Text style={styles.status} numberOfLines={1}>
            {isSignedIn ? email || t.profile.statusSignedIn : t.profile.statusSignedOut}
          </Text>
        </View>

        {/* Account / auth card */}
        <View style={styles.card}>
          {!authLoaded ? (
            <ActivityIndicator color={colors.primary} />
          ) : isSignedIn ? (
            <View style={styles.cardStack}>
              <Text style={styles.labelMuted}>{t.auth.signedInLabel}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
              <View style={styles.buttonStretch}>
                <AuthPrimaryButton
                  label={t.auth.signOut}
                  variant="outline"
                  loading={signingOut}
                  onPress={handleSignOut}
                />
              </View>
            </View>
          ) : (
            <View style={styles.cardStack}>
              <Text style={styles.cardTitle}>{t.auth.signedOutTitle}</Text>
              <Text style={styles.bodyMuted}>{t.auth.signedOutBody}</Text>
              <View style={styles.actions}>
                <View style={styles.actionSlot}>
                  <AuthPrimaryButton
                    label={t.auth.signIn}
                    onPress={() => navigation.navigate('SignIn')}
                  />
                </View>
                <View style={styles.actionSlot}>
                  <AuthPrimaryButton
                    label={t.auth.signUp}
                    variant="outline"
                    onPress={() => navigation.navigate('SignUp')}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section list */}
        <Text style={styles.sectionTitle}>{t.profile.settingsTitle}</Text>

        <View style={[styles.card, styles.sectionCard]}>
          <SettingRow
            icon="heart"
            iconColor={colors.primaryDeep}
            label={t.profile.favorites}
            note={t.profile.favoritesCount(favorites.size)}
            onPress={() => navigation.navigate('Favorites')}
          />
          <View style={styles.divider} />
          <SettingRow icon="bell" label={t.profile.notifications} note={t.profile.comingSoon} />
          <View style={styles.divider} />
          <SettingRow icon="volume-2" label={t.profile.soundSettings} note={t.profile.soundNote} />
          <View style={styles.divider} />
          <SettingRow icon="globe" label={t.profile.language} note={t.profile.languageValue} />
          <View style={styles.divider} />
          <SettingRow icon="info" label={t.profile.about} note={t.profile.version} />
        </View>

        <Text style={styles.footer}>{t.app.tagline}</Text>
        <Text style={styles.footerLight}>{t.profile.hashtag}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scroll: {
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: spacing.xl,
    paddingBottom: 100,
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarInitials: { ...typography.h1, color: colors.white },
  name: { ...typography.h3, color: colors.neutralDark, marginBottom: spacing.xs },
  status: { ...typography.bodySmall, color: colors.neutralMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionCard: { padding: 0, overflow: 'hidden' },
  cardStack: { alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.neutralDark },
  labelMuted: { ...typography.labelSm, color: colors.neutralMuted },
  email: { ...typography.bodyMedium, color: colors.neutralDark, textAlign: 'right', width: '100%' },
  bodyMuted: { ...typography.bodySmall, color: colors.neutralMuted, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  actionSlot: { flex: 1 },
  buttonStretch: { alignSelf: 'stretch' },
  sectionTitle: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.md },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingIcon: { marginRight: spacing.md },
  settingContent: { flex: 1 },
  settingLabel: { ...typography.body, color: colors.neutralDark },
  settingNote: { ...typography.bodySmall, color: colors.neutralMuted },
  settingArrow: { color: colors.neutralLight },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  footer: { ...typography.body, color: colors.neutralMuted, textAlign: 'center', marginBottom: spacing.xs },
  footerLight: { ...typography.caption, color: colors.neutralLight, textAlign: 'center' },
});
