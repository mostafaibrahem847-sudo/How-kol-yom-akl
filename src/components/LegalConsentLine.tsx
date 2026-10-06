import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import { t } from '../i18n/strings';

/**
 * Inline legal consent line: a prefix followed by two tappable links (terms and
 * privacy policy) that open the matching stack screen. The sentence itself is
 * assembled from `t.legal.*` only. Shared by the Welcome screen and the
 * signed-out Profile account card.
 */
export default function LegalConsentLine() {
  const navigation = useNavigation<any>();

  return (
    <Text style={styles.text}>
      {t.legal.consentPrefix}{' '}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate('Terms')}
        accessibilityRole="link"
      >
        {t.legal.termsLink}
      </Text>{' '}
      {t.legal.consentConjunction}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate('PrivacyPolicy')}
        accessibilityRole="link"
      >
        {t.legal.privacyLink}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...typography.bodySmall,
    color: colors.neutralMuted,
    textAlign: 'center',
    includeFontPadding: false,
  },
  link: {
    ...typography.label,
    color: colors.primaryDeep,
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },
});
