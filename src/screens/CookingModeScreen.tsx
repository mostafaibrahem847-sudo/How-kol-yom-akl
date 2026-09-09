import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  StatusBar,
} from 'react-native';
import { colors, spacing, typography, buttonSize, radius } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { t } from '../i18n/strings';
import { toArabicNumerals } from '../i18n/numerals';

const { width } = Dimensions.get('window');

type RoutePropType = never;

export default function CookingModeScreen() {
  const navigation = useNavigation();
  const [stepIndex, setStepIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Placeholder steps for demo
  const steps = [
    { title: 'تجهيز المكونات', body: 'جهزي كل المقادير على الرخام، اغسلي الخضار وصفيها كويس، وقطعي اللحمة قطع متوسطة.' },
    { title: 'التشويح', body: 'في حلة سخنة، شوحي اللحمة في السمنة البلدي لحد ما تاخد لون ذهبي.' },
    { title: 'التسبيكة والطبخ', body: 'ضيفي الصلصة وسيبيها تتسبك ١٥ دقيقة، بعدين نزلي بالخضار وقلبي برقة.' },
    { title: 'التقديم', body: 'قدميها سخنة مع الرز المفلفل، وزيني بقرن شطة وليمونة معصفة فوق الوش.' },
  ];

  const current = steps[stepIndex];
  const totalSteps = steps.length;
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const nextStep = () => {
    if (stepIndex < totalSteps - 1) setStepIndex((i) => i + 1);
  };
  const prevStep = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  return (
    <SafeAreaProvider>
      {/* The App-level SafeAreaView already insets top/left/right for the whole
          navigator; here we only add the bottom inset so this fullscreen screen
          doesn't double-pad the top/left/right edges on Android. */}
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.secondary} />

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{`${toArabicNumerals(stepIndex + 1)} من ${toArabicNumerals(totalSteps)}`}</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Step number circle */}
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{toArabicNumerals(stepIndex + 1)}</Text>
        </View>

        <Text style={styles.stepTitle}>{current.title}</Text>
        <Text style={styles.stepBody}>{current.body}</Text>

        {/* Voice command chips */}
        <View style={styles.voiceChips}>
          <TouchableOpacity style={styles.voiceChip} onPress={nextStep} activeOpacity={0.8}>
            <Text style={styles.voiceChipText}>"التالي"</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.voiceChip} onPress={() => {}} activeOpacity={0.8}>
            <Text style={styles.voiceChipText}>"عيدي تاني"</Text>
          </TouchableOpacity>
        </View>

        {/* Timer chip */}
        <TouchableOpacity
          style={[styles.timerChip, timerActive ? styles.timerChipActive : {}]}
          onPress={() => setTimerActive((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.timerChipText}>
            {timerActive ? '🔔 خلصت الطشة!' : '⏱️ دقيقتين (٠٠:٠٢)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={prevStep} disabled={stepIndex === 0}>
          <Text style={[styles.navBtnText, stepIndex === 0 && styles.navBtnDisabled]}>{t.cooking.prevCta}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtnPrimary} onPress={nextStep} disabled={stepIndex === totalSteps - 1}>
          <Text style={styles.navBtnPrimaryText}>{t.cooking.nextCta}</Text>
        </TouchableOpacity>
      </View>

      {/* Exit */}
      <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Text style={styles.exitText}>{t.cooking.exit}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryDark,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.neutralMuted,
    marginLeft: spacing.md,
    minWidth: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  stepNumber: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...{
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  stepNumberText: {
    ...typography.display,
    fontSize: 28,
    color: colors.white,
    fontWeight: 'bold',
  },
  stepTitle: {
    ...typography.h2,
    color: colors.neutralDark,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepBody: {
    ...typography.bodyLarge,
    color: colors.neutralMid,
    textAlign: 'center',
    lineHeight: 30,
  },
  voiceChips: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  voiceChip: {
    backgroundColor: colors.accent,
    borderRadius: 9999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  voiceChipText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
  timerChip: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 9999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  timerChipText: {
    ...typography.bodyLarge,
    color: colors.neutralDark,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  navBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    ...typography.button,
    color: colors.primary,
  },
  navBtnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navBtnPrimaryText: {
    ...typography.button,
    color: colors.white,
  },
  exitBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.neutralMuted,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  exitText: {
    ...typography.button,
    color: colors.neutralMuted,
  },
});
