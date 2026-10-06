import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';

/**
 * Placeholder terms of use. The body text lives in `t.legal.termsSections`;
 * the note at the top makes clear it has not been legally reviewed yet.
 */
export default function TermsScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          hitSlop={8}
        >
          <Feather name="arrow-right" size={24} color={colors.neutralDark} />
        </TouchableOpacity>

        <Text style={styles.title}>{t.legal.pageTitleTerms}</Text>

        <View style={styles.noteBox}>
          <Feather
            name="alert-triangle"
            size={16}
            color={colors.primaryDeep}
            style={styles.noteIcon}
          />
          <Text style={styles.noteText}>{t.legal.placeholderNote}</Text>
        </View>

        {t.legal.termsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scroll: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutralSurface,
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.neutralDark, textAlign: 'right' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  noteIcon: { marginTop: 1 },
  noteText: { ...typography.bodySmall, color: colors.neutralMid, flex: 1, textAlign: 'right' },
  section: { marginBottom: spacing.lg, gap: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.neutralDark, textAlign: 'right' },
  sectionBody: { ...typography.body, color: colors.neutralMid, textAlign: 'right' },
});
