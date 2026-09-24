import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, headerHeight } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';

type AppHeaderProps = {
  /** Small label under the app name that indicates the current screen. */
  indicator: string;
};

/**
 * Shared top app bar. Authored in LOGICAL RTL order (start = right): the brand
 * block (logo at the far start, app name beside it) leads on the right, and
 * the profile/notification actions trail on the left. The global RTL layout
 * (I18nManager on native, dir="rtl" on web) renders it as the design intends:
 * logo + name on the right, avatar + bell on the left. Renders only the bar
 * itself — each screen decides whether it is fixed (absolute overlay) or
 * scrolls with its content.
 */
export default function AppHeader({ indicator }: AppHeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.header}>
      {/* Start group (right in RTL): circular logo at the far start, then the
          app name block (title + screen indicator) beside it. */}
      <View style={styles.headerBrand}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t.app.name}
          </Text>
          <Text style={styles.headerIndicator}>{indicator}</Text>
        </View>
      </View>

      {/* End group (left in RTL): notification button, then profile avatar at
          the far end. */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          accessibilityLabel={t.common.notifications}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={24} color={colors.neutralMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfileBtn}
          accessibilityLabel={t.nav.account}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.headerAvatar}>
            <Feather name="user" size={16} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPadding.horizontal,
    backgroundColor: colors.headerBg,
    shadowColor: '#D4A781',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerProfileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  // The brand block sits immediately to the LEFT of the fixed right-side logo,
  // so its texts are pinned right (full width + textAlign right) on every
  // platform/engine.
  headerTitleBlock: { flexShrink: 1, minWidth: 0 },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'right',
    width: '100%',
  },
  headerIndicator: {
    ...typography.labelSm,
    color: colors.accent,
    marginTop: 1,
    textAlign: 'left',
    width: '100%',
  },
  // Official app logo (assets/images/logo.png). Square source displayed in a
  // square box with `contain`, so proportions are preserved. No background,
  // border, tint, or crop is applied — the PNG's transparency shows through.
  logo: {
    width: 44,
    height: 44,
  },
});
