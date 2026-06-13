import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors, Radius } from '../../lib/constants'
import { useMissionStore } from '../../store/mission'

function getPickLabel(title: string): string {
  return title.length > 10 ? title.slice(0, 10) : title
}

export default function ComparisonBottomSheet() {
  const visible = useMissionStore((s) => s.comparisonVisible)
  const itemA = useMissionStore((s) => s.comparisonItemA)
  const itemB = useMissionStore((s) => s.comparisonItemB)
  const dismiss = useMissionStore((s) => s.dismissComparison)

  const sheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['65%'], [])

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand()
    } else {
      sheetRef.current?.close()
    }
  }, [visible])

  const handleClose = useCallback(() => {
    dismiss()
  }, [dismiss])

  const handlePickA = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    dismiss()
  }

  const handlePickB = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    dismiss()
  }

  if (!itemA || !itemB) return null

  const insightText = `Option A has better ratings for the price. Option B ships faster on Amazon Now. Since your party is tomorrow, Option B wins.`

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>
            You keep switching between these
          </Text>
          <Text style={styles.headerSubtitle}>
            Here's what's different for your goal
          </Text>
        </View>

        {/* Two product cards */}
        <View style={styles.cardsRow}>
          <View style={styles.productCard}>
            <View style={styles.cardPlaceholder}>
              <Text style={styles.cardInitial}>
                {(itemA.title || 'A')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {itemA.title}
            </Text>
            <Text style={styles.cardPrice}>₹{itemA.price || itemA.total_cost}</Text>
            <Text style={styles.cardRating}>⭐ {itemA.rating || '4.0'}</Text>
            {itemA.amazon_now_eligible ? (
              <View style={styles.cardNowPill}>
                <Text style={styles.cardNowText}>⚡ Now</Text>
              </View>
            ) : (
              <View style={styles.cardTomorrowPill}>
                <Text style={styles.cardTomorrowText}>Tomorrow</Text>
              </View>
            )}
          </View>

          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.productCard}>
            <View style={styles.cardPlaceholder}>
              <Text style={styles.cardInitial}>
                {(itemB.title || 'B')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {itemB.title}
            </Text>
            <Text style={styles.cardPrice}>₹{itemB.price || itemB.total_cost}</Text>
            <Text style={styles.cardRating}>⭐ {itemB.rating || '4.0'}</Text>
            {itemB.amazon_now_eligible ? (
              <View style={styles.cardNowPill}>
                <Text style={styles.cardNowText}>⚡ Now</Text>
              </View>
            ) : (
              <View style={styles.cardTomorrowPill}>
                <Text style={styles.cardTomorrowText}>Tomorrow</Text>
              </View>
            )}
          </View>
        </View>

        {/* AI Insight box */}
        <View style={styles.insightBox}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightAiLabel}>🤖 MissionCart AI</Text>
          </View>
          <Text style={styles.insightBold}>For a kids birthday party:</Text>
          <Text style={styles.insightText}>{insightText}</Text>
        </View>

        {/* Two buttons */}
        <View style={styles.buttonsRow}>
          <Pressable onPress={handlePickA} style={styles.pickButtonA}>
            <Text style={styles.pickButtonAText}>
              Pick {getPickLabel(itemA.title)}
            </Text>
          </Pressable>
          <Pressable onPress={handlePickB} style={styles.pickButtonB}>
            <Text style={styles.pickButtonBText}>
              Pick {getPickLabel(itemB.title)}
            </Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheetBg: {
    borderRadius: 16,
  },
  handleIndicator: {
    backgroundColor: Colors.border,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    padding: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  productCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
  },
  cardPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: Colors.secondaryBg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInitial: {
    color: Colors.textSecondary,
    fontSize: 24,
    fontWeight: '700',
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  cardPrice: {
    color: Colors.errorRed,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  cardRating: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  cardNowPill: {
    backgroundColor: Colors.successGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  cardNowText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  cardTomorrowPill: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  cardTomorrowText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: '50%',
    marginLeft: -14,
    zIndex: 1,
  },
  vsText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  insightBox: {
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightAiLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  insightBold: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightText: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
  },
  pickButtonA: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButtonAText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  pickButtonB: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButtonBText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
})
