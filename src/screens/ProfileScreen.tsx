import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useAuth, useUser } from '@clerk/expo';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import AuthPrimaryButton from '../components/AuthPrimaryButton';
import LegalConsentLine from '../components/LegalConsentLine';

export default function ProfileScreen() {
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
              <LegalConsentLine />
            </View>
          )}
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
  cardStack: { alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.neutralDark },
  labelMuted: { ...typography.labelSm, color: colors.neutralMuted },
  email: { ...typography.bodyMedium, color: colors.neutralDark, textAlign: 'right', width: '100%' },
  bodyMuted: { ...typography.bodySmall, color: colors.neutralMuted, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  actionSlot: { flex: 1 },
  buttonStretch: { alignSelf: 'stretch' },
  footer: { ...typography.body, color: colors.neutralMuted, textAlign: 'center', marginBottom: spacing.xs },
  footerLight: { ...typography.caption, color: colors.neutralLight, textAlign: 'center' },
});
