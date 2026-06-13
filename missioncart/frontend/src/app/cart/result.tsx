import * as Haptics from 'expo-haptics'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ComparisonBottomSheet from '../../components/comparison/ComparisonBottomSheet'
import { Colors, Radius } from '../../lib/constants'
import { useMissionStore } from '../../store/mission'

const FALLBACK_CART_ITEMS = [
  { cart_item_id: '1', need_label: 'Plates & utensils', title: 'Disposable Paper Plates 25pc', price: 89, packs_quantity: 2, total_cost: 178, amazon_now_eligible: true, rating: 4.2, delivery_eta: 'now_20min', prime: true, explanation: '2 plates per child × 12 kids = 24 plates' },
  { cart_item_id: '2', need_label: 'Cups & drinks', title: 'Disposable Cups 50pc', price: 79, packs_quantity: 1, total_cost: 79, amazon_now_eligible: true, rating: 4.0, delivery_eta: 'now_20min', prime: true, explanation: '2.5 cups per child × 12 kids' },
  { cart_item_id: '3', need_label: 'Candles & cake knife', title: 'Birthday Candles Set 10pc', price: 49, packs_quantity: 1, total_cost: 49, amazon_now_eligible: true, rating: 4.3, delivery_eta: 'now_20min', prime: true, explanation: '1 pack of candles' },
  { cart_item_id: '4', need_label: 'Balloons & decorations', title: 'Multicolor Balloons 30pc', price: 149, packs_quantity: 2, total_cost: 298, amazon_now_eligible: true, rating: 4.1, delivery_eta: 'now_20min', prime: true, explanation: '3 balloons per child × 12 kids with buffer' },
  { cart_item_id: '5', need_label: 'Napkins & tissues', title: 'Paper Napkins 100pc', price: 59, packs_quantity: 1, total_cost: 59, amazon_now_eligible: true, rating: 4.0, delivery_eta: 'now_20min', prime: true, explanation: '3 napkins per child × 12 kids' },
  { cart_item_id: '6', need_label: 'Entertainment', title: 'Party Games Set', price: 199, packs_quantity: 1, total_cost: 199, amazon_now_eligible: false, rating: 3.8, delivery_eta: 'tomorrow', prime: true, explanation: '1 games set for group activities' },
  { cart_item_id: '7', need_label: 'Return gifts', title: 'Return Gift Bags 12pc', price: 199, packs_quantity: 1, total_cost: 199, amazon_now_eligible: true, rating: 4.2, delivery_eta: 'now_20min', prime: true, explanation: '1 gift per child × 12 kids' },
  { cart_item_id: '8', need_label: 'Cleanup', title: 'Trash Bags 30pc', price: 129, packs_quantity: 1, total_cost: 129, amazon_now_eligible: true, rating: 4.1, delivery_eta: 'now_20min', prime: true, explanation: '1 pack for post-party cleanup' },
]

export default function CartResultScreen() {
  const router = useRouter()
  const storeCart = useMissionStore((s) => s.cart)
  const trackItemView = useMissionStore((s) => s.trackItemView)
  const setComparisonItems = useMissionStore((s) => s.setComparisonItems)

  const cartItems: any[] = storeCart.length > 0 ? storeCart : FALLBACK_CART_ITEMS
  const budget = 3000

  const total = cartItems.reduce(
    (sum: number, item: any) => sum + (item.total_cost || item.price * (item.packs_quantity || 1)),
    0,
  )
  const remaining = budget - total
  const isOverBudget = remaining < 0
  const budgetPercent = Math.min((total / budget) * 100, 100)

  const coveredCount = cartItems.length
  const totalNeeds = cartItems.length

  const allNow = cartItems.every((item: any) => item.amazon_now_eligible)

  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleItemPress = useCallback(
    (item: any) => {
      trackItemView(item)
      setHighlightedId(item.cart_item_id)
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
      highlightTimer.current = setTimeout(() => setHighlightedId(null), 300)
    },
    [trackItemView],
  )

  const handleDemoComparison = () => {
    if (cartItems.length >= 2) {
      setComparisonItems(cartItems[0], cartItems[1])
    }
  }

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})
    Linking.openURL('https://www.amazon.in')
  }

  const renderItem = ({ item }: { item: any }) => {
    const isHighlighted = highlightedId === item.cart_item_id
    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
        style={[styles.itemCard, isHighlighted && styles.itemCardHighlighted]}
      >
        <View style={styles.itemImage}>
          <Text style={styles.itemInitial}>
            {(item.need_label || item.title || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemNeedLabel}>
            {(item.need_label || '').toUpperCase()}
          </Text>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.deliveryBadgeRow}>
            {item.amazon_now_eligible ? (
              <View style={styles.nowPill}>
                <Text style={styles.nowPillText}>⚡ Now · 20 min</Text>
              </View>
            ) : (
              <View style={styles.tomorrowPill}>
                <Text style={styles.tomorrowPillText}>Tomorrow</Text>
              </View>
            )}
          </View>
          {item.explanation ? (
            <Text style={styles.explanationText} numberOfLines={1}>
              ℹ {item.explanation}
            </Text>
          ) : null}
        </View>
        <View style={styles.itemPriceCol}>
          <Text style={styles.itemPrice}>
            ₹{item.total_cost || item.price * (item.packs_quantity || 1)}
          </Text>
          <Text style={styles.itemQty}>×{item.packs_quantity || 1}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.nowBlue} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Mission Cart</Text>
        <Text style={styles.headerSummary}>
          {cartItems.length} items · {coveredCount}/{totalNeeds} covered
        </Text>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item: any) => item.cart_item_id || String(Math.random())}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValue}>₹{total}</Text>
                <Text style={styles.summaryLabel}>spent</Text>
              </View>
              <View style={[styles.summaryCol, styles.summaryColCenter]}>
                <Text style={styles.coverageValue}>
                  {coveredCount}/{totalNeeds}
                </Text>
                <Text style={styles.summaryLabel}>covered</Text>
              </View>
              <View style={styles.summaryCol}>
                {allNow ? (
                  <Text style={styles.allNowText}>⚡ Now</Text>
                ) : (
                  <Text style={styles.mixedText}>⚠ Mixed</Text>
                )}
                <Text style={styles.summaryLabel}>delivery</Text>
              </View>
            </View>

            {/* Budget bar */}
            <View style={styles.budgetSection}>
              <View style={styles.budgetLabelRow}>
                <Text style={styles.budgetLabelText}>Budget used</Text>
                <Text style={styles.budgetLabelText}>₹{Math.abs(remaining)} left</Text>
              </View>
              <View style={styles.budgetTrack}>
                <View
                  style={[
                    styles.budgetFill,
                    {
                      width: `${budgetPercent}%`,
                      backgroundColor: isOverBudget ? Colors.errorRed : Colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Section label */}
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>YOUR CART</Text>
            </View>
          </>
        }
        ListFooterComponent={
          <>
            {/* Amazon Now banner */}
            <View style={styles.nowBanner}>
              <Text style={styles.nowBannerText}>
                ⚡ Items available on Amazon Now delivered in 20 mins
              </Text>
            </View>

            {/* Demo link */}
            <TouchableOpacity
              onPress={handleDemoComparison}
              style={styles.demoLinkWrap}
            >
              <Text style={styles.demoLinkText}>
                Demo: Show AI comparison →
              </Text>
            </TouchableOpacity>
          </>
        }
      />

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <Pressable onPress={handleAddToCart} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add to Amazon Cart →</Text>
        </Pressable>
      </View>

      <ComparisonBottomSheet />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.nowBlue,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.nowBlue,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSummary: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.85,
  },
  list: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  summaryCard: {
    flexDirection: 'row',
    margin: 12,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  coverageValue: {
    color: Colors.successGreen,
    fontSize: 20,
    fontWeight: '700',
  },
  allNowText: {
    color: Colors.successGreen,
    fontSize: 16,
    fontWeight: '700',
  },
  mixedText: {
    color: Colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  budgetSection: {
    marginHorizontal: 12,
    marginBottom: 8,
  },
  budgetLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetLabelText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  budgetTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.secondaryBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetFill: {
    height: 6,
    borderRadius: 3,
  },
  sectionLabelRow: {
    marginLeft: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemCardHighlighted: {
    borderColor: Colors.primary,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInitial: {
    color: Colors.textSecondary,
    fontSize: 20,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    marginLeft: 10,
  },
  itemNeedLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  itemTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  deliveryBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  nowPill: {
    backgroundColor: Colors.successGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  nowPillText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  tomorrowPill: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tomorrowPillText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  explanationText: {
    color: Colors.linkBlue,
    fontSize: 11,
    marginTop: 4,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  itemPrice: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  itemQty: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  nowBanner: {
    backgroundColor: '#E8F5E9',
    margin: 12,
    borderRadius: Radius.md,
    padding: 10,
    paddingHorizontal: 12,
  },
  nowBannerText: {
    color: Colors.successGreen,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  demoLinkWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  demoLinkText: {
    color: Colors.linkBlue,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
    paddingBottom: 24,
  },
  addButton: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
