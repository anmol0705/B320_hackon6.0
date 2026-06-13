import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { demoAPI } from '../../lib/api'
import { Colors, Radius } from '../../lib/constants'
import { scheduleTestNotification } from '../../lib/notifications'
import type { OccasionCard } from '../../lib/types'

interface Category {
  id: string
  label: string
  emoji: string
}

interface ReorderProduct {
  id: string
  name: string
  quantity: string
  price: number
}

const categories: Category[] = [
  { id: 'beverages', label: 'Beverages', emoji: '🥤' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'ice-cream', label: 'Ice cream', emoji: '🍨' },
  { id: 'bath-body', label: 'Bath & body', emoji: '🧴' },
  { id: 'cleaners', label: 'Cleaners', emoji: '🧽' },
  { id: 'grocery', label: 'Grocery', emoji: '🛒' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'health', label: 'Health', emoji: '🩹' },
]

const reorderProducts: ReorderProduct[] = [
  {
    id: 'tata-salt',
    name: 'Tata Salt 1kg',
    quantity: '2 packs',
    price: 42,
  },
  {
    id: 'surf-excel',
    name: 'Surf Excel 1kg',
    quantity: '1 pack',
    price: 189,
  },
  {
    id: 'parle-g',
    name: 'Parle-G 800g',
    quantity: '3 packs',
    price: 105,
  },
]

const fallbackOccasions: OccasionCard[] = [
  {
    id: 'diwali',
    title: 'Diwali',
    days_until: 24,
    emoji: '🪔',
    category: 'festival',
    estimated_budget: 2400,
    tap_action: '/missions/diwali',
  },
  {
    id: 'moms-birthday',
    title: "Mom's Birthday",
    days_until: 6,
    emoji: '🎂',
    category: 'birthday',
    estimated_budget: 1800,
    tap_action: '/missions/moms-birthday',
  },
  {
    id: 'coorg-trek',
    title: 'Trek to Coorg',
    days_until: 12,
    emoji: '🥾',
    category: 'travel',
    estimated_budget: 3200,
    tap_action: '/missions/coorg-trek',
  },
  {
    id: 'office-potluck',
    title: 'Office Potluck',
    days_until: 3,
    emoji: '🍲',
    category: 'event',
    estimated_budget: 800,
    tap_action: '/missions/office-potluck',
  },
]

function formatInr(value: number) {
  return value.toLocaleString('en-IN')
}

export default function HomeScreen() {
  const router = useRouter()
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [search, setSearch] = useState('')
  const [goal, setGoal] = useState('')
  const [goalFocused, setGoalFocused] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showOrderStatus, setShowOrderStatus] = useState(false)
  const [occasions, setOccasions] = useState<OccasionCard[]>(fallbackOccasions)

  useEffect(() => {
    demoAPI.getOccasions().then((res) => {
      if (res.data?.data && Array.isArray(res.data.data)) {
        setOccasions(res.data.data)
      }
    }).catch(() => {
      // Keep fallback occasions
    })
  }, [])

  useEffect(
    () => () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    },
    [],
  )

  const openBuilding = (missionGoal: string) => {
    router.push({
      pathname: '/cart/building',
      params: { goal: missionGoal, budget: '3000' },
    })
  }

  const handleCategoryPress = (category: Category) => {
    if (category.id === 'party') {
      openBuilding('Party supplies')
    }
  }

  const handleApprove = () => {
    if (isApproving) {
      return
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
      // Haptics are unavailable on some browser and simulator environments.
    })
    setIsApproving(true)
    setShowOrderStatus(true)

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
    }
    successTimerRef.current = setTimeout(() => setIsApproving(false), 800)
  }

  const handleBuildCart = () => {
    openBuilding(goal.trim() || 'Birthday party for 20 people under ₹3000')
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.nowHeader}>
          <View style={styles.topHeaderRow}>
            <Pressable style={styles.headerIconButton} accessibilityRole="button">
              <Ionicons name="person-circle" size={30} color={Colors.white} />
            </Pressable>

            <View style={styles.logo}>
              <Text style={styles.amazonLogoText}>amazon</Text>
              <Text style={styles.logoBolt}>⚡</Text>
              <Text style={styles.nowLogoText}>now</Text>
            </View>

            <Pressable style={styles.headerIconButton} accessibilityRole="button">
              <Ionicons name="close" size={27} color={Colors.white} />
            </Pressable>
          </View>

          <Pressable style={styles.deliveryRow} accessibilityRole="button">
            <View style={styles.deliveryPill}>
              <Text style={styles.deliveryPillText}>⚡ 10 mins</Text>
            </View>
            <Text style={styles.deliveryAddress}>Bangalore, 560001</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.discoverySection}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={21}
              color={Colors.textSecondary}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search for groceries, snacks..."
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
              returnKeyType="search"
              accessibilityLabel="Search products"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category)}
                style={styles.categoryItem}
                accessibilityRole="button"
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryLabel} numberOfLines={2}>
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.reorderCard}>
          <Pressable onPress={handleApprove} style={styles.reorderTopBar}>
            <Text style={styles.reorderTopTitle}>
              ⚡ Your daily reorder is ready
            </Text>
            <Text style={styles.reorderTopAction}>Tap to approve →</Text>
          </Pressable>

          <View style={styles.reorderRows}>
            {reorderProducts.map((product, index) => (
              <View
                key={product.id}
                style={[
                  styles.productRow,
                  index < reorderProducts.length - 1 &&
                    styles.productRowDivider,
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
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productQuantity}>{product.quantity}</Text>
                </View>
                <View style={styles.productMeta}>
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                  <View style={styles.nowPill}>
                    <Text style={styles.nowPillText}>NOW</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.reorderFooter}>
            <View style={styles.actionButtons}>
              <Pressable
                onPress={handleApprove}
                style={[
                  styles.approveButton,
                  isApproving && styles.approveButtonSuccess,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.approveButtonText}>Approve & Order</Text>
              </Pressable>
              <Pressable
                onPress={() => console.log('Review daily reorder')}
                style={styles.reviewButton}
                accessibilityRole="button"
              >
                <Text style={styles.reviewButtonText}>Review</Text>
              </Pressable>
            </View>
            {showOrderStatus && (
              <Text style={styles.orderStatus}>
                ⚡ Ordering via Amazon Now...
              </Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={scheduleTestNotification}
          style={styles.testNotifLink}
          accessibilityRole="button"
        >
          <Text style={styles.testNotifText}>
            Demo: Test morning notification (fires in 5s)
          </Text>
        </Pressable>

        <View style={styles.missionSection}>
          <Text style={styles.missionTitle}>
            ✨ What's your mission today?
          </Text>
          <Text style={styles.missionSubtitle}>
            Tell us your goal — we'll build the perfect cart
          </Text>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            onFocus={() => setGoalFocused(true)}
            onBlur={() => setGoalFocused(false)}
            placeholder="e.g. Birthday party for 20 people under ₹3000"
            placeholderTextColor={Colors.textSecondary}
            style={[
              styles.goalInput,
              goalFocused && styles.goalInputFocused,
            ]}
            returnKeyType="done"
            accessibilityLabel="Mission goal"
          />
          <View style={styles.missionActions}>
            <Pressable accessibilityRole="button">
              <Text style={styles.budgetText}>Budget: ₹3,000</Text>
            </Pressable>
            <Pressable
              onPress={handleBuildCart}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.buildCartText}>Build Cart →</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/audit')}
          style={styles.auditBanner}
          accessibilityRole="button"
        >
          <View style={styles.auditIcon}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={Colors.sponsoredBlue}
            />
          </View>
          <View style={styles.auditCopy}>
            <Text style={styles.auditTitle}>Cart Audit</Text>
            <Text style={styles.auditSubtitle}>
              We'll find what's wrong with your cart
            </Text>
          </View>
          <Text style={styles.auditAction}>Try →</Text>
        </Pressable>

        <View style={styles.comingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coming up ✨</Text>
            <Pressable accessibilityRole="button">
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.occasionList}
          >
            {occasions.map((occasion) => (
              <Pressable
                key={occasion.id}
                onPress={() => console.log('Plan occasion:', occasion.id)}
                style={styles.occasionCard}
                accessibilityRole="button"
              >
                <Text style={styles.occasionEmoji}>{occasion.emoji}</Text>
                <Text style={styles.occasionTitle} numberOfLines={2}>
                  {occasion.title}
                </Text>
                <Text style={styles.occasionDays}>
                  In {occasion.days_until} days
                </Text>
                <Text style={styles.occasionBudget}>
                  ~₹{formatInr(occasion.estimated_budget)}
                </Text>
                <Text style={styles.planText}>Plan →</Text>
              </Pressable>
            ))}
          </ScrollView>
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
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 24,
  },
  nowHeader: {
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 12,
    backgroundColor: Colors.nowBlue,
  },
  topHeaderRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amazonLogoText: {
    color: Colors.white,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  logoBolt: {
    marginHorizontal: 2,
    color: Colors.deliveryYellow,
    fontSize: 16,
    lineHeight: 22,
  },
  nowLogoText: {
    color: Colors.white,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  deliveryRow: {
    alignSelf: 'center',
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: Colors.deliveryYellow,
    borderRadius: 14,
  },
  deliveryPillText: {
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  deliveryAddress: {
    marginLeft: 8,
    marginRight: 3,
    color: Colors.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  discoverySection: {
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    height: 44,
    marginHorizontal: 12,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  searchInput: {
    flex: 1,
    height: 42,
    marginLeft: 8,
    paddingVertical: 0,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  categoryList: {
    paddingHorizontal: 7,
    paddingTop: 11,
  },
  categoryItem: {
    width: 72,
    minHeight: 64,
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 36,
    lineHeight: 40,
  },
  categoryLabel: {
    marginTop: 3,
    color: Colors.textPrimary,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  reorderCard: {
    marginHorizontal: 12,
    marginTop: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  reorderTopBar: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
  },
  reorderTopTitle: {
    flexShrink: 1,
    color: Colors.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  reorderTopAction: {
    marginLeft: 8,
    color: Colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
  reorderRows: {
    paddingHorizontal: 12,
  },
  productRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productRowDivider: {
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
  },
  productName: {
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
  productMeta: {
    alignItems: 'flex-end',
  },
  productPrice: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  nowPill: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.successGreen,
    borderRadius: 10,
  },
  nowPillText: {
    color: Colors.white,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  reorderFooter: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 9,
  },
  approveButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  approveButtonSuccess: {
    backgroundColor: Colors.successGreen,
  },
  approveButtonText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  reviewButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
  },
  reviewButtonText: {
    color: Colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  orderStatus: {
    marginTop: 9,
    color: Colors.successGreen,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  missionSection: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  missionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  missionSubtitle: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  goalInput: {
    height: 48,
    marginTop: 9,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  goalInputFocused: {
    borderColor: Colors.primary,
  },
  missionActions: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  buildCartText: {
    color: Colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  auditBanner: {
    minHeight: 68,
    marginHorizontal: 12,
    marginTop: 9,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.trustBg,
    borderWidth: 1,
    borderColor: Colors.primeBadge,
    borderRadius: Radius.md,
  },
  auditIcon: {
    width: 35,
    alignItems: 'flex-start',
  },
  auditCopy: {
    flex: 1,
  },
  auditTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  auditSubtitle: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  auditAction: {
    marginLeft: 8,
    color: Colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  comingSection: {
    marginTop: 17,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  seeAllText: {
    color: Colors.linkBlue,
    fontSize: 13,
    lineHeight: 18,
  },
  occasionList: {
    paddingLeft: 12,
    paddingRight: 4,
    paddingTop: 10,
  },
  occasionCard: {
    width: 160,
    minHeight: 158,
    marginRight: 8,
    padding: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  occasionEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  occasionTitle: {
    minHeight: 36,
    marginTop: 5,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  occasionDays: {
    marginTop: 3,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  occasionBudget: {
    marginTop: 3,
    color: Colors.successGreen,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  planText: {
    marginTop: 8,
    color: Colors.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  testNotifLink: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  testNotifText: {
    color: Colors.linkBlue,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
})
