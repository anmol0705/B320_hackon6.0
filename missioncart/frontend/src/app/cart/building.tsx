import { useLocalSearchParams, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import { missionAPI } from '../../lib/api'
import { Colors } from '../../lib/constants'
import { useMissionStore } from '../../store/mission'

const FALLBACK_CART = {
  cart_items: [
    { cart_item_id: '1', need_label: 'Plates & utensils', title: 'Disposable Paper Plates 25pc', price: 89, packs_quantity: 2, total_cost: 178, amazon_now_eligible: true, rating: 4.2, delivery_eta: 'now_20min', prime: true, explanation: '2 plates per child × 12 kids = 24 plates' },
    { cart_item_id: '2', need_label: 'Cups & drinks', title: 'Disposable Cups 50pc', price: 79, packs_quantity: 1, total_cost: 79, amazon_now_eligible: true, rating: 4.0, delivery_eta: 'now_20min', prime: true, explanation: '2.5 cups per child × 12 kids' },
    { cart_item_id: '3', need_label: 'Candles & cake knife', title: 'Birthday Candles Set 10pc', price: 49, packs_quantity: 1, total_cost: 49, amazon_now_eligible: true, rating: 4.3, delivery_eta: 'now_20min', prime: true, explanation: '1 pack of candles' },
    { cart_item_id: '4', need_label: 'Balloons & decorations', title: 'Multicolor Balloons 30pc', price: 149, packs_quantity: 2, total_cost: 298, amazon_now_eligible: true, rating: 4.1, delivery_eta: 'now_20min', prime: true, explanation: '3 balloons per child × 12 kids with buffer' },
    { cart_item_id: '5', need_label: 'Napkins & tissues', title: 'Paper Napkins 100pc', price: 59, packs_quantity: 1, total_cost: 59, amazon_now_eligible: true, rating: 4.0, delivery_eta: 'now_20min', prime: true, explanation: '3 napkins per child × 12 kids' },
    { cart_item_id: '6', need_label: 'Entertainment', title: 'Party Games Set', price: 199, packs_quantity: 1, total_cost: 199, amazon_now_eligible: false, rating: 3.8, delivery_eta: 'tomorrow', prime: true, explanation: '1 games set for group activities' },
    { cart_item_id: '7', need_label: 'Return gifts', title: 'Return Gift Bags 12pc', price: 199, packs_quantity: 1, total_cost: 199, amazon_now_eligible: true, rating: 4.2, delivery_eta: 'now_20min', prime: true, explanation: '1 gift per child × 12 kids' },
    { cart_item_id: '8', need_label: 'Cleanup', title: 'Trash Bags 30pc', price: 129, packs_quantity: 1, total_cost: 129, amazon_now_eligible: true, rating: 4.1, delivery_eta: 'now_20min', prime: true, explanation: '1 pack for post-party cleanup' },
  ],
  total_cost: 1190,
  budget_remaining: 1810,
  coverage_score: { display: '8/8', covered: 8, total: 8, all_must_haves_covered: true, missing: [] },
  repair_summary: null,
}

type StepStatus = 'pending' | 'active' | 'done'

interface StepData {
  label: string
  status: StepStatus
  number: number
}

function SpinningCircle() {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    )
    return () => cancelAnimation(rotation)
  }, [rotation])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }))

  return (
    <Animated.View style={[styles.activeCircle, animatedStyle]}>
      <View style={styles.activeArc} />
    </Animated.View>
  )
}

function StepIndicator({ step }: { step: StepData }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepCircleWrap}>
        {step.status === 'pending' && (
          <View style={styles.pendingCircle}>
            <Text style={styles.pendingNumber}>{step.number}</Text>
          </View>
        )}
        {step.status === 'active' && <SpinningCircle />}
        {step.status === 'done' && (
          <View style={styles.doneCircle}>
            <Text style={styles.doneCheck}>✓</Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.stepLabel,
          step.status === 'pending' && styles.stepLabelPending,
          step.status === 'active' && styles.stepLabelActive,
          step.status === 'done' && styles.stepLabelDone,
        ]}
      >
        {step.label}
      </Text>
    </View>
  )
}

export default function BuildingScreen() {
  const params = useLocalSearchParams()
  const goal = (params.goal as string) || 'Building your cart...'
  const budget = parseFloat(params.budget as string) || 3000

  const [steps, setSteps] = useState<StepData[]>([
    { label: 'Understanding your goal...', status: 'active', number: 1 },
    { label: 'Finding what you need...', status: 'pending', number: 2 },
    { label: 'Checking Amazon Now availability...', status: 'pending', number: 3 },
    { label: 'Validating your cart...', status: 'pending', number: 4 },
  ])
  const [error, setError] = useState(false)
  const apiResolved = useRef(false)
  const navigated = useRef(false)

  const updateStep = (index: number, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s)),
    )
  }

  const navigateToResult = () => {
    if (navigated.current) return
    navigated.current = true
    router.replace('/cart/result')
  }

  useEffect(() => {
    let cancelled = false

    // Fire API call immediately
    missionAPI
      .build(goal, budget)
      .then((res) => {
        if (cancelled) return
        apiResolved.current = true
        const data = res.data?.data || res.data
        useMissionStore.getState().setCart(data?.cart_items || data)
      })
      .catch(() => {
        if (cancelled) return
        apiResolved.current = true
        useMissionStore.getState().setCart(FALLBACK_CART.cart_items as any)
      })

    // Step 1 done at 800ms
    const t1 = setTimeout(() => {
      if (cancelled) return
      updateStep(0, 'done')
      updateStep(1, 'active')
    }, 800)

    // Step 2 done at 1500ms
    const t2 = setTimeout(() => {
      if (cancelled) return
      updateStep(1, 'done')
      updateStep(2, 'active')
    }, 1500)

    // Step 3 done at 2000ms
    const t3 = setTimeout(() => {
      if (cancelled) return
      updateStep(2, 'done')
      updateStep(3, 'active')
    }, 2000)

    // Step 4 done at 2500ms, then navigate 500ms later
    const t4 = setTimeout(() => {
      if (cancelled) return
      updateStep(3, 'done')
    }, 2500)

    // Navigate at 3000ms (2500 + 500)
    const t5 = setTimeout(() => {
      if (cancelled) return
      navigateToResult()
    }, 3000)

    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [goal, budget])

  const handleRetry = () => {
    setError(false)
    navigated.current = false
    apiResolved.current = false
    setSteps([
      { label: 'Understanding your goal...', status: 'active', number: 1 },
      { label: 'Finding what you need...', status: 'pending', number: 2 },
      { label: 'Checking Amazon Now availability...', status: 'pending', number: 3 },
      { label: 'Validating your cart...', status: 'pending', number: 4 },
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.nowBlue} />

      <View style={styles.screen}>
        <Text style={styles.emoji}>🎯</Text>
        <Text style={styles.title}>Building Your Cart</Text>
        <Text style={styles.goalText} numberOfLines={2}>
          {goal}
        </Text>

        <View style={styles.stepsContainer}>
          {steps.map((step) => (
            <StepIndicator key={step.number} step={step} />
          ))}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something went wrong</Text>
            <Pressable onPress={handleRetry} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
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
    backgroundColor: Colors.nowBlue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  goalText: {
    color: Colors.white,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 4,
  },
  stepsContainer: {
    width: '100%',
    marginTop: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepCircleWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingNumber: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  activeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primary,
  },
  activeArc: {},
  doneCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  stepLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  stepLabelPending: {
    color: Colors.white,
    opacity: 0.5,
  },
  stepLabelActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  stepLabelDone: {
    color: Colors.white,
  },
  errorContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
})
