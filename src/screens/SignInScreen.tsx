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
import { useSignIn } from '@clerk/expo';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, typography } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import AuthTextInput from '../components/AuthTextInput';
import AuthPrimaryButton from '../components/AuthPrimaryButton';
import { clerkErrorMessage } from '../lib/clerkErrors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const navigation = useNavigation<any>();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!isLoaded || !signIn || !setActive) return;

    setError(null);
    setSubmitting(true);
    try {
      const completeSignIn = await signIn.create({
        strategy: 'password',
        identifier: trimmedEmail,
        password,
      });
      await setActive({ session: completeSignIn.createdSessionId });
      navigation.replace('Tabs');
    } catch (err) {
      setError(clerkErrorMessage(err, 'signIn'));
    } finally {
      setSubmitting(false);
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

        <Text style={styles.title}>{t.auth.signInTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.signInSubtitle}</Text>

        <View style={styles.form}>
          <AuthTextInput
            label={t.auth.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={t.auth.emailPlaceholder}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            align="right"
            returnKeyType="next"
          />
          <AuthTextInput
            label={t.auth.passwordLabel}
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.passwordPlaceholder}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AuthPrimaryButton
            label={t.auth.submitSignIn}
            loadingLabel={t.auth.submittingSignIn}
            loading={submitting}
            onPress={handleSubmit}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchPrompt}>{t.auth.noAccountPrompt}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.switchLink}>{t.auth.signUpLink}</Text>
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
  error: { ...typography.bodySmall, color: colors.error, textAlign: 'right' },
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
