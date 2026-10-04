import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSSO } from '@clerk/expo';
// Email/password uses the legacy Clerk hook contract (`{ isLoaded, signUp,
// setActive }`) provided by this SDK generation. The top-level hooks return the
// newer signal value, which this screen's flow is not written against.
import { useSignUp } from '@clerk/expo/legacy';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import AuthTextInput from '../components/AuthTextInput';
import AuthPrimaryButton from '../components/AuthPrimaryButton';
import { clerkErrorMessage } from '../lib/clerkErrors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t.auth.emailRequired);
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(t.auth.emailInvalid);
      return;
    }
    if (!password) {
      setError(t.auth.passwordRequired);
      return;
    }
    if (!isLoaded || !signUp || !setActive) return;

    setError(null);
    setSubmitting(true);
    try {
      const completeSignUp = await signUp.create({
        emailAddress: trimmedEmail,
        password,
      });
      if (completeSignUp.createdSessionId) {
        await setActive({ session: completeSignUp.createdSessionId });
        navigation.replace('Tabs');
      } else {
        // No session created yet → the instance requires email verification.
        setError(t.auth.emailVerification);
      }
    } catch (err) {
      setError(clerkErrorMessage(err, 'signUp'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setError(null);
    setGoogleLoading(true);
    try {
      // Clerk's supported Expo browser SSO flow (expo-web-browser + expo-auth-session).
      // Google handles both sign-in and sign-up; Clerk transfers to sign-up when no
      // account exists, so the same action is correct on this screen.
      const { createdSessionId, setActive: activateSession, authSessionResult } =
        await startSSOFlow({ strategy: 'oauth_google' });

      if (createdSessionId && activateSession) {
        await activateSession({ session: createdSessionId });
        navigation.replace('Tabs');
        return;
      }

      // User closed/dismissed the browser sheet — a cancellation, not an error.
      if (authSessionResult && authSessionResult.type !== 'success') return;

      setError(t.auth.genericError);
    } catch (err) {
      setError(clerkErrorMessage(err, 'signUp'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          hitSlop={8}
        >
          <Feather name="arrow-right" size={24} color={colors.neutralDark} />
        </TouchableOpacity>

        <Text style={styles.title}>{t.auth.signUpTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.signUpSubtitle}</Text>

        <View style={styles.form}>
          <AuthTextInput
            label={t.auth.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={t.auth.emailPlaceholder}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            align="left"
            returnKeyType="next"
          />
          <AuthTextInput
            label={t.auth.passwordLabel}
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.passwordPlaceholder}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AuthPrimaryButton
            label={t.auth.submitSignUp}
            loadingLabel={t.auth.submittingSignUp}
            loading={submitting}
            onPress={handleSubmit}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t.auth.orDivider}</Text>
            <View style={styles.dividerLine} />
          </View>

          <AuthPrimaryButton
            label={t.auth.continueWithGoogle}
            loadingLabel={t.auth.submittingGoogle}
            loading={googleLoading}
            onPress={handleGoogle}
            variant="outline"
            icon={<MaterialCommunityIcons name="google" size={20} color={colors.primary} />}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchPrompt}>{t.auth.haveAccountPrompt}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.switchLink}>{t.auth.signInLink}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutralSurface,
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.neutralDark, textAlign: 'left' },
  subtitle: {
    ...typography.body,
    color: colors.neutralMuted,
    textAlign: 'left',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.lg },
  error: { ...typography.bodySmall, color: colors.error, textAlign: 'left' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.bodySmall, color: colors.neutralMuted },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  switchPrompt: { ...typography.bodySmall, color: colors.neutralMuted },
  switchLink: {
    ...typography.label,
    color: colors.primaryDeep,
    textDecorationLine: 'underline',
  },
});
