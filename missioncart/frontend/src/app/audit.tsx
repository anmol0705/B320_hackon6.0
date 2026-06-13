import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  cancelAnimation,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import { api } from '../lib/api'
import { Colors, Radius } from '../lib/constants'

type FlagSeverity = 'red' | 'amber' | 'blue'

interface CartProduct {
  id: string
  name: string
  quantity: number
  price: number
  sponsored?: boolean
}

interface AuditFlagDemo {
  id: string
  severity: FlagSeverity
  message: string
  ms: number
}

const CART_PRODUCTS: CartProduct[] = [
  { id: 'plates', name: 'Paper Plates 10pc', quantity: 1, price: 120 },
  { id: 'balloons', name: 'Balloon Set 20pc', quantity: 1, price: 180 },
  { id: 'streamers', name: 'Streamers 5pc', quantity: 2, price: 180 },
  {
    id: 'cups',
    name: 'Party Cups 10pc',
    quantity: 2,
    price: 190,
    sponsored: true,
  },
]

const FLAGS: AuditFlagDemo[] = [
  {
    id: 'f1',
    severity: 'red',
    message: '12 plates — you need 24',
    ms: 1500,
  },
  {
    id: 'f2',
    severity: 'red',
    message: 'Balloon set — no pump included',
    ms: 3000,
  },
  {
    id: 'f3',
    severity: 'amber',
    message: 'Streamers not on Amazon Now — swapping',
    ms: 4500,
  },
  {
    id: 'f4',
    severity: 'blue',
    message: 'Sponsored cups blocked — failed child_safe check',
    ms: 6000,
  },
]

const AUDIT_PAYLOAD = {
  goal: 'Birthday party for 12 kids tomorrow evening under 4000',
  existing_cart: [
    {
      asin: 'DEMO_PLATES_01',
      title: 'Paper Plates 10pc',
      price: 120,
      quantity: 1,
      category: 'plates',
      pack_size: 10,
      prime: true,
      amazon_now_eligible: true,
      delivery_eta: 'now_20min',
      rating: 4.1,
      return_risk: 0.05,
      safety_tags: ['child_safe', 'food_grade'],
      sponsored: false,
    },
    {
      asin: 'DEMO_BALLOONS_01',
      title: 'Balloon Set 20pc',
      price: 180,
      quantity: 1,
      category: 'balloon_set',
      pack_size: 20,
      prime: true,
      amazon_now_eligible: true,
      delivery_eta: 'now_20min',
      rating: 4.3,
      return_risk: 0.08,
      safety_tags: ['child_safe'],
      sponsored: false,
    },
    {
      asin: 'DEMO_STREAMERS_01',
      title: 'Streamers 5pc',
      price: 90,
      quantity: 2,
      category: 'decoration_streamers',
      pack_size: 5,
      prime: false,
      amazon_now_eligible: false,
      delivery_eta: '2_days',
      rating: 4,
      return_risk: 0.1,
      safety_tags: ['child_safe'],
      sponsored: false,
    },
    {
      asin: 'DEMO_CUPS_SPONSORED',
      title: 'Party Cups 10pc',
      price: 95,
      quantity: 2,
      category: 'disposable_cups',
      pack_size: 10,
      prime: true,
      amazon_now_eligible: true,
      delivery_eta: 'now_20min',
      rating: 3.8,
      return_risk: 0.06,
      safety_tags: [],
      sponsored: true,
    },
  ],
}

function PulseIndicator() {
  const dotOne = useSharedValue(0.25)
  const dotTwo = useSharedValue(0.25)
  const dotThree = useSharedValue(0.25)

  useEffect(() => {
    const pulse = () =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: 280 }),
          withTiming(0.25, { duration: 280 }),
          withTiming(0.25, { duration: 280 }),
        ),
        -1,
      )

    dotOne.value = pulse()
    dotTwo.value = withDelay(180, pulse())
    dotThree.value = withDelay(360, pulse())

    return () => {
      cancelAnimation(dotOne)
      cancelAnimation(dotTwo)
      cancelAnimation(dotThree)
    }
  }, [dotOne, dotThree, dotTwo])

  const dotOneStyle = useAnimatedStyle(() => ({
    opacity: dotOne.value,
    transform: [{ scale: 0.8 + dotOne.value * 0.2 }],
  }))
  const dotTwoStyle = useAnimatedStyle(() => ({
    opacity: dotTwo.value,
    transform: [{ scale: 0.8 + dotTwo.value * 0.2 }],
  }))
  const dotThreeStyle = useAnimatedStyle(() => ({
    opacity: dotThree.value,
    transform: [{ scale: 0.8 + dotThree.value * 0.2 }],
  }))

  return (
    <View style={styles.pulseDots}>
      <Animated.View style={[styles.pulseDot, dotOneStyle]} />
      <Animated.View style={[styles.pulseDot, dotTwoStyle]} />
      <Animated.View style={[styles.pulseDot, dotThreeStyle]} />
    </View>
  )
}

const MATH_EXPLANATIONS: Record<string, string> = {
  f1: '2 plates per child × 12 kids = 24 plates. You have 1 pack of 12. Need 2 packs.',
  f2: 'This balloon set requires a pump to inflate. No pump found in cart.',
  f3: 'Streamers arrive in 2 days. Party is tomorrow (18hrs). Swapped to Now-eligible.',
  f4: 'Sponsored product — no child_safe certification. Blocked per MissionCart policy.',
}

function FlagCard({
  flag,
  isExpanded,
  onToggle,
}: {
  flag: AuditFlagDemo
  isExpanded: boolean
  onToggle: () => void
}) {
  const isRed = flag.severity === 'red'
  const isAmber = flag.severity === 'amber'
  const cardStyle = isRed
    ? styles.redFlagCard
    : isAmber
      ? styles.amberFlagCard
      : styles.blueFlagCard
  const textStyle = isRed
    ? styles.redFlagText
    : isAmber
      ? styles.amberFlagText
      : styles.blueFlagText
  const label = isRed
    ? 'ISSUE FOUND'
    : isAmber
      ? 'SWAPPING'
      : 'SPONSORED BLOCKED'
  const fixText = isRed
    ? 'Tap to fix →'
    : isAmber
      ? 'Finding Now-eligible replacement...'
      : 'Protected from biased recommendation'

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.flagCard, cardStyle]}
      >
        <View style={styles.flagIcon}>
          <Ionicons
            name={
              flag.severity === 'blue'
                ? 'shield-checkmark'
                : flag.severity === 'amber'
                  ? 'swap-horizontal'
                  : 'warning'
            }
            size={21}
            color={
              flag.severity === 'blue'
                ? Colors.sponsoredBlue
                : flag.severity === 'amber'
                  ? Colors.primaryDark
                  : Colors.errorRed
            }
          />
        </View>
        <View style={styles.flagContent}>
          <Text
            style={[
              styles.flagLabel,
              textStyle,
              flag.severity === 'blue' && styles.blueFlagLabel,
            ]}
          >
            {label}
          </Text>
          <Text style={[styles.flagMessage, textStyle]}>{flag.message}</Text>
          <Text
            style={[
              styles.flagFixText,
              textStyle,
              isRed && styles.flagFixUnderline,
            ]}
          >
            {fixText}
          </Text>
          {isExpanded && MATH_EXPLANATIONS[flag.id] && (
            <View style={styles.mathContainer}>
              <Text style={styles.mathText}>
                📐 {MATH_EXPLANATIONS[flag.id]}
              </Text>
            </View>
          )}
        </View>
        {flag.severity === 'blue' && (
          <View style={styles.trustCheck}>
            <Ionicons name="checkmark" size={13} color={Colors.white} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

export default function AuditScreen() {
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const [visibleFlagCount, setVisibleFlagCount] = useState(0)
  const [isChecking, setIsChecking] = useState(true)
  const [showRepair, setShowRepair] = useState(false)
  const [showPrice, setShowPrice] = useState(false)
  const [showCoverage, setShowCoverage] = useState(false)
  const [showCta, setShowCta] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null)
  const progress = useSharedValue(0)

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }))

  useEffect(() => {
    void api.post('/api/mission/audit', AUDIT_PAYLOAD).catch(() => {
      // The deterministic demo sequence continues without the API response.
    })

    const timers: Array<ReturnType<typeof setTimeout>> = FLAGS.map(
      (flag, index) =>
        setTimeout(() => setVisibleFlagCount(index + 1), flag.ms),
    )

    timers.push(
      setTimeout(() => {
        setIsChecking(false)
        setShowRepair(true)
        progress.value = withTiming(1, { duration: 1500 })
      }, 6500),
      setTimeout(() => setShowPrice(true), 8000),
      setTimeout(() => setShowCoverage(true), 8200),
      setTimeout(() => setShowCta(true), 8400),
    )

    return () => timers.forEach(clearTimeout)
  }, [progress])

  useEffect(() => {
    if (visibleFlagCount === 0 && !showRepair) {
      return
    }

    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      showCta ? 450 : 100,
    )
    return () => clearTimeout(timer)
  }, [showCoverage, showCta, showPrice, showRepair, visibleFlagCount])

  const handleOrder = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
      // Haptics are unavailable on some browser and simulator environments.
    })
    setOrderPlaced(true)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.nowBlue} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Cart Audit</Text>
          <Text style={styles.headerSubtitle}>Sneha's Birthday Party</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cartSection}>
          <View style={styles.cartSectionHeader}>
            <Text style={styles.cartEyebrow}>YOUR CART</Text>
            <Text style={styles.cartSummary}>4 items • ₹4,340</Text>
          </View>

          <View style={styles.cartRows}>
            {CART_PRODUCTS.map((product, index) => (
              <View
                key={product.id}
                style={[
                  styles.cartRow,
                  index < CART_PRODUCTS.length - 1 && styles.cartRowDivider,
                ]}
              >
                <View style={styles.productImage}>
                  <Ionicons
                    name="cube-outline"
                    size={22}
                    color={Colors.textSecondary}
                  />
                </View>
                <View style={styles.productCopy}>
                  <View style={styles.productNameRow}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.sponsored && (
                      <View style={styles.sponsoredPill}>
                        <Text style={styles.sponsoredText}>Sponsored</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productQuantity}>
                    Qty: {product.quantity}
                  </Text>
                </View>
                <Text style={styles.productPrice}>₹{product.price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalText}>₹4,340</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.auditSection}>
          <View style={styles.auditHeaderRow}>
            <Text style={styles.auditTitle}>🔍 MissionCart Audit</Text>
            <Text style={styles.poweredText}>
              Powered by <Text style={styles.bedrockText}>Bedrock</Text>
            </Text>
          </View>

          {isChecking && (
            <View style={styles.checkingRow}>
              <PulseIndicator />
              <Text style={styles.checkingText}>Checking your cart...</Text>
            </View>
          )}

          <View style={styles.flagsList}>
            {FLAGS.slice(0, visibleFlagCount).map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                isExpanded={expandedFlag === flag.id}
                onToggle={() =>
                  setExpandedFlag((prev) =>
                    prev === flag.id ? null : flag.id,
                  )
                }
              />
            ))}
          </View>

          {showRepair && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={styles.repairSection}
            >
              <Text style={styles.repairTitle}>✨ Repairing your cart</Text>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
              </View>

              {showPrice && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={styles.priceBlock}
                >
                  <View style={styles.priceRow}>
                    <Text style={styles.oldPrice}>₹4,340</Text>
                    <Text style={styles.newPrice}>₹3,850</Text>
                  </View>
                  <View style={styles.savingsPill}>
                    <Text style={styles.savingsText}>You save ₹490</Text>
                  </View>
                </Animated.View>
              )}

              {showCoverage && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={styles.coverageBlock}
                >
                  <Text style={styles.coverageTitle}>Coverage: 9/9 ✓</Text>
                  <Text style={styles.coverageSubtitle}>
                    All items available on Amazon Now ⚡
                  </Text>
                </Animated.View>
              )}

              {showCta && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={styles.ctaBlock}
                >
                  <Pressable
                    onPress={handleOrder}
                    style={styles.orderButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.orderButtonText}>
                      Order Repaired Cart via Amazon Now ⚡
                    </Text>
                  </Pressable>
                  {orderPlaced && (
                    <Text style={styles.orderPlacedText}>
                      ✓ Order placed! Arriving in 12 mins
                    </Text>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.nowBlue,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nowBlue,
  },
  backButton: {
    width: 40,
    height: 40,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 1,
    color: Colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 28,
  },
  cartSection: {
    paddingTop: 13,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
  },
  cartSectionHeader: {
    paddingBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartEyebrow: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cartSummary: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
  },
  cartRows: {
    backgroundColor: Colors.background,
  },
  cartRow: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productImage: {
    width: 40,
    height: 40,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondaryBg,
    borderRadius: Radius.md,
  },
  productCopy: {
    flex: 1,
    paddingRight: 8,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    flexShrink: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  productQuantity: {
    marginTop: 3,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 15,
  },
  productPrice: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  sponsoredPill: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.secondaryBg,
    borderRadius: 10,
  },
  sponsoredText: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 12,
  },
  totalRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  totalText: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  sectionDivider: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.secondaryBg,
  },
  auditSection: {
    paddingTop: 15,
    paddingBottom: 22,
    backgroundColor: Colors.background,
  },
  auditHeaderRow: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  poweredText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  bedrockText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  checkingRow: {
    minHeight: 38,
    marginHorizontal: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDots: {
    width: 38,
    marginRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulseDot: {
    width: 8,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  checkingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  flagsList: {
    marginTop: 2,
  },
  flagCard: {
    minHeight: 88,
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderRadius: Radius.md,
  },
  redFlagCard: {
    backgroundColor: '#FFF5F5',
    borderLeftColor: Colors.errorRed,
  },
  amberFlagCard: {
    backgroundColor: '#FFFBF0',
    borderLeftColor: Colors.primaryDark,
  },
  blueFlagCard: {
    backgroundColor: Colors.trustBg,
    borderLeftColor: Colors.sponsoredBlue,
  },
  flagIcon: {
    width: 30,
    marginRight: 3,
    paddingTop: 2,
  },
  flagContent: {
    flex: 1,
    paddingRight: 7,
  },
  flagLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  flagMessage: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  flagFixText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 16,
  },
  flagFixUnderline: {
    textDecorationLine: 'underline',
  },
  redFlagText: {
    color: Colors.errorRed,
  },
  amberFlagText: {
    color: Colors.primaryDark,
  },
  blueFlagText: {
    color: Colors.sponsoredBlue,
  },
  blueFlagLabel: {
    letterSpacing: 1.5,
  },
  trustCheck: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sponsoredBlue,
    borderRadius: 10,
  },
  repairSection: {
    marginHorizontal: 12,
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  repairTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    marginTop: 12,
    overflow: 'hidden',
    backgroundColor: Colors.secondaryBg,
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  priceBlock: {
    marginTop: 17,
    alignItems: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  oldPrice: {
    color: Colors.textSecondary,
    fontSize: 20,
    lineHeight: 28,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    color: Colors.successGreen,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  savingsPill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.successGreen,
    borderRadius: 10,
  },
  savingsText: {
    color: Colors.white,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },
  coverageBlock: {
    marginTop: 15,
  },
  coverageTitle: {
    color: Colors.successGreen,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  coverageSubtitle: {
    marginTop: 3,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  orderButton: {
    width: '100%',
    height: 52,
    marginTop: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  ctaBlock: {
    width: '100%',
    paddingBottom: 4,
  },
  orderButtonText: {
    color: Colors.white,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    textAlign: 'center',
  },
  orderPlacedText: {
    marginTop: 10,
    color: Colors.successGreen,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  mathContainer: {
    marginTop: 4,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderRadius: 4,
  },
  mathText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
})
