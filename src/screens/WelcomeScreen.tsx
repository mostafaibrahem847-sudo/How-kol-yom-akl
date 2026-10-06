import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  colors,
  typography,
  fontWeight,
  fontFamilyFor,
  useResponsive,
  DESIGN_REFERENCE,
} from '../theme';
import { t } from '../i18n/strings';
import LegalConsentLine from '../components/LegalConsentLine';

type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

// Welcome composition tokens. They are authored in the shared 390x844 design
// reference (see DESIGN_REFERENCE) and are consumed as real dp/pt on both
// platforms — never multiplied by a platform viewport scale, so typography and
// spacing stay identical between Web and Native.
const REF_HEIGHT = DESIGN_REFERENCE.height;
const REF_HERO_HEIGHT = 407;
const CARD_PADDING_TOP = 24;
const CARD_PADDING_BOTTOM = 20;
// Measured at the 390x844 reference: eyebrow top -> blessing bottom is 456dp
// after the closing blessing moved to the 12/17 body-small step. The feature
// note deliberately stays at 11/14: at 12px "مضمونة ومجربة" wraps to a second
// line inside the narrow card, which desyncs the three notes and grows the row.
// (It was 453dp before the blessing bump, and 429 before that, which
// under-counted the card and let the closing note fall off the viewport.)
const REF_CARD_CONTENT = 456;
const REF_CARD_HEIGHT = REF_CARD_CONTENT + CARD_PADDING_TOP + CARD_PADDING_BOTTOM; // 497
const REF_CARD_SPACING = 90; // total vertical margins/gaps inside the card
const HERO_RATIO = REF_HERO_HEIGHT / REF_HEIGHT;

const CARD_OVERLAP = 36;
const CARD_TOP_RADIUS = 36;
const HERO_BOTTOM_RADIUS = 40;
const MIN_HERO_HEIGHT = 160;

// One icon scale for the whole screen, so the dock, the feature row and the CTA
// cannot drift into ad-hoc sizes.
const ICON = { badge: 14, feature: 20, cta: 20, sprout: 26 } as const;

// Feature icons use one brand tone at 3.8:1 on the warm card surface (the 3:1
// floor for meaningful graphics). The previous tri-tone mixed an amber that sat
// at 2.0:1 with two oranges too close to tell apart, so it read as a mistake
// rather than as differentiation.
const FEATURE_ICON_COLOR = colors.primary;

const cairoWeight = (weight: (typeof fontWeight)[keyof typeof fontWeight]) => ({
  fontFamily: fontFamilyFor(weight),
  fontWeight: 'normal' as const,
});

// The photo is the hero, so the scrim only does two jobs: seat the cream pills
// at the top, and give the card's rounded top edge something to land on. The
// middle stays clear so the food keeps its colour and contrast.
const SCRIM_COLORS = [
  'rgba(0, 0, 0, 0.60)',
  'rgba(0, 0, 0, 0.22)',
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0.12)',
] as const;
const SCRIM_LOCATIONS = [0, 0.22, 0.5, 1] as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },

  hero: {
    overflow: 'hidden',
    borderBottomLeftRadius: HERO_BOTTOM_RADIUS,
    borderBottomRightRadius: HERO_BOTTOM_RADIUS,
    backgroundColor: colors.secondaryDark,
  },
  // `width/height: 100%` is required, not cosmetic: react-native-web falls back
  // to the asset's intrinsic size (2048x2048 here) whenever the style only
  // declares insets, which blew the photo up to a blurry 5x-zoomed corner crop.
  heroImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  // Everything that labels the hero is anchored to the top of the photo, so the
  // subject of the shot is never covered by chrome.
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    gap: 12,
    alignItems: 'flex-start',
    zIndex: 20,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },

  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(252, 249, 248, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  brandLogo: { width: 28, height: 28 },
  brandName: {
    ...typography.label,
    color: colors.primaryDeep,
    ...cairoWeight(fontWeight.bold),
    includeFontPadding: false,
  },
  freshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(252, 249, 248, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  freshBadgeText: {
    ...typography.labelSm,
    color: colors.accentDark,
    ...cairoWeight(fontWeight.bold),
    includeFontPadding: false,
  },

  // The caption carries its own near-opaque fill so its contrast never depends
  // on whatever part of the photo happens to sit behind it.
  recipeTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 20, 16, 0.78)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    maxWidth: '82%',
  },
  recipeTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },
  recipeTagText: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.96)',
    ...cairoWeight(fontWeight.semibold),
    flexShrink: 1,
    includeFontPadding: false,
  },

  card: {
    flex: 1,
    marginTop: -CARD_OVERLAP,
    backgroundColor: colors.secondary,
    borderTopLeftRadius: CARD_TOP_RADIUS,
    borderTopRightRadius: CARD_TOP_RADIUS,
    shadowColor: '#D4A781',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  cardBody: { flexGrow: 1, paddingTop: CARD_PADDING_TOP, paddingHorizontal: 24 },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  eyebrowBar: { width: 20, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  eyebrowText: {
    ...typography.label,
    color: colors.primaryDeep,
    ...cairoWeight(fontWeight.bold),
    includeFontPadding: false,
  },

  headlineLead: {
    ...cairoWeight(fontWeight.medium),
    fontSize: 26,
    lineHeight: 33,
    color: colors.neutralMid,
    textAlign: 'left',
    includeFontPadding: false,
  },
  headlineBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  headlineBrand: {
    ...cairoWeight(fontWeight.bold),
    fontSize: 30,
    lineHeight: 37,
    color: colors.primary,
    includeFontPadding: false,
  },
  headlineSprout: { marginTop: 4 },

  description: {
    marginTop: 12,
    ...cairoWeight(fontWeight.medium),
    fontSize: 17,
    lineHeight: 28,
    color: colors.neutralMuted,
    textAlign: 'left',
    includeFontPadding: false,
  },

  featuresRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  // Warm surface + hairline border instead of the near-invisible grey-on-cream
  // it used to be, so the three cards read as distinct surfaces.
  featureCard: {
    flex: 1,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    borderRadius: 16,
    alignItems: 'flex-start',
    gap: 5,
  },
  // Two lines are reserved for the title and the note is pinned to the card
  // floor. Without the reservation a title wraps below ~370dp, which silently
  // made the whole card 18dp taller and pushed the closing note off-screen.
  featureTitle: {
    ...typography.label,
    color: colors.neutralDark,
    ...cairoWeight(fontWeight.bold),
    textAlign: 'left',
    width: '100%',
    minHeight: 15,
    includeFontPadding: false,
  },
  featureNote: {
    ...typography.labelSm,
    color: colors.neutralMuted,
    textAlign: 'left',
    width: '100%',
    marginTop: 'auto',
    includeFontPadding: false,
  },

  actions: { marginTop: 22, gap: 14 },
  cta: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 1.50,
    shadowRadius: 10,
    elevation: 7,
  },
  ctaPressed: { backgroundColor: colors.primaryDark, transform: [{ scale: 0.99 }] },
  ctaText: {
    ...typography.headlineSm,
    color: colors.white,
    ...cairoWeight(fontWeight.bold),
    includeFontPadding: false,
  },
  ctaIcon: {
    width: 60,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(235, 221, 221, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  loginPrompt: { ...typography.bodySmall, color: colors.neutralMuted, includeFontPadding: false },
  // The action used to be bare 15px text with a ~18dp tap area; the 44dp floor
  // and horizontal padding bring it up to the platform minimum.
  loginAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  loginActionPressed: { opacity: 0.6 },
  loginActionText: {
    ...typography.buttonLarge,
    color: colors.primaryDeep,
    ...cairoWeight(fontWeight.bold),
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },

  blessing: {
    marginTop: 16,
    ...typography.bodySmallOblique,
    color: colors.neutralMid,
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  // One shared, platform-normalized frame. This replaces the previous mix of
  // useWindowDimensions + useSafeAreaInsets + a private onLayout measurement,
  // which is what let Web and Native drift apart. `fullHeight` already accounts
  // for the shell's top safe-area padding on both platforms.
  const { fullHeight, insets } = useResponsive();

  // Deterministic hero: a fixed share of the frame, capped so the fixed-height
  // editorial card always fits. No text measurement participates, so a
  // platform's font metrics cannot resize the hero. The cap deliberately does
  // NOT include the bottom inset — the safe area must not change the hero's
  // proportion; the card absorbs it by compressing its own spacing below.
  const preferredHero = Math.round(fullHeight * HERO_RATIO);
  const maxHeroForCard = Math.round(fullHeight - REF_CARD_HEIGHT + CARD_OVERLAP);
  const heroHeight = Math.max(MIN_HERO_HEIGHT, Math.min(preferredHero, maxHeroForCard));

  // Bottom safe-area padding shrinks the card's content area. Compress only the
  // card's vertical rhythm (never fonts, CTA or feature-card dimensions) by just
  // enough to keep the bottom note inside the safe area. At the 390x844
  // reference this is exactly 1, so the approved spacing is preserved.
  const cardHeight = fullHeight - heroHeight + CARD_OVERLAP;
  const contentAvailable =
    cardHeight - CARD_PADDING_TOP - CARD_PADDING_BOTTOM - insets.bottom;
  const contentDeficit = REF_CARD_CONTENT - contentAvailable;
  const vSpacing = Math.min(1, Math.max(0.4, 1 - contentDeficit / REF_CARD_SPACING));

  const handleStart = () => navigation.replace('Tabs');
  // Clerk is the active auth provider; the login action now opens the real
  // Sign In screen (see src/screens/SignInScreen.tsx).
  const handleLogin = () => navigation.navigate('SignIn');

  return (
    <View style={styles.root}>
      {/* Food photography is the visual hero: full-bleed, tucked behind the
          status bar, sharp and untouched. The scrim below is the only overlay
          that touches it. The image is decorative — the recipe caption carries
          the meaning — so it is hidden from assistive tech. */}
      <View style={[styles.hero, { height: heroHeight, marginTop: -insets.top }]}>
        <Image
          source={require('../../assets/images/welcome-hero.webp')}
          style={styles.heroImage}
          resizeMode="cover"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <LinearGradient
          colors={SCRIM_COLORS}
          locations={SCRIM_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroScrim}
          pointerEvents="none"
          accessible={false}
        />

        <View style={[styles.heroOverlay, { top: insets.top + 14 }]}>
          <View style={styles.dockRow}>
            <View style={styles.brandPill}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
              <Text style={styles.brandName} maxFontSizeMultiplier={1.3}>
                {t.app.name}
              </Text>
            </View>

            <View style={styles.freshBadge}>
              <MaterialCommunityIcons
                name="pot-steam-outline"
                size={ICON.badge}
                color={colors.accentDark}
              />
              <Text style={styles.freshBadgeText} maxFontSizeMultiplier={1.3}>
                {t.welcome.freshBadge}
              </Text>
            </View>
          </View>

          {/* Wraps to a second line instead of truncating the recipe name: the
              dish is the point of the caption, so it must stay readable. */}
          <View style={styles.recipeTag}>
            <View style={styles.recipeTagDot} />
            <Text style={styles.recipeTagText} numberOfLines={2} maxFontSizeMultiplier={1.3}>
              {t.welcome.recipeTag}
            </Text>
          </View>
        </View>
      </View>

      {/* Editorial card occupies the remaining canvas and overlaps the hero.
          It scrolls rather than clips, so a very short screen or a large
          Dynamic Type setting can never cut the CTA off. */}
      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={[
            styles.cardBody,
            { paddingBottom: CARD_PADDING_BOTTOM + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.eyebrowRow, { marginBottom: 8 * vSpacing }]}>
            <View style={styles.eyebrowBar} />
            <Text style={styles.eyebrowText}>{t.welcome.eyebrow}</Text>
          </View>

          <Text style={styles.headlineLead}>{t.welcome.headlineLead}</Text>
          <View style={styles.headlineBrandRow}>
            <Text style={styles.headlineBrand}>{t.app.name}</Text>
            <MaterialCommunityIcons
              name="sprout"
              size={ICON.sprout}
              color={colors.accent}
              style={styles.headlineSprout}
              accessible={false}
            />
          </View>

          <Text style={[styles.description, { marginTop: 12 * vSpacing }]}>
            {t.welcome.description}
          </Text>

          <View style={[styles.featuresRow, { marginTop: 18 * vSpacing }]}>
            {t.welcome.features.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <MaterialCommunityIcons
                  name={feature.icon as MciName}
                  size={ICON.feature}
                  color={FEATURE_ICON_COLOR}
                />
                <Text style={styles.featureTitle} numberOfLines={2}>
                  {feature.title}
                </Text>
                <Text style={styles.featureNote} numberOfLines={2}>
                  {feature.note}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.actions, { marginTop: 22 * vSpacing, gap: 14 * vSpacing }]}>
            <Pressable
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel={t.welcome.cta}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.24)' }}
            >
              <Text style={styles.ctaText}>{t.welcome.cta}</Text>
              <View
                style={styles.ctaIcon}
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={ICON.cta}
                  color={colors.white}
                />
              </View>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>{t.welcome.loginPrompt}</Text>
              <Pressable
                style={({ pressed }) => [styles.loginAction, pressed && styles.loginActionPressed]}
                onPress={handleLogin}
                accessibilityRole="button"
                accessibilityLabel={t.welcome.loginAction}
                hitSlop={8}
              >
                <Text style={styles.loginActionText}>{t.welcome.loginAction}</Text>
              </Pressable>
            </View>

            <LegalConsentLine />
          </View>

          <Text style={[styles.blessing, { marginTop: 16 * vSpacing }]}>{t.welcome.blessing}</Text>
        </ScrollView>
      </View>
    </View>
  );
}
