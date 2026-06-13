import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Colors, Radius } from '../../lib/constants'

interface QuickChip {
  emoji: string
  label: string
  goal: string
}

const quickChips: QuickChip[] = [
  {
    emoji: '🎂',
    label: 'Birthday Party',
    goal: 'Birthday party for 12 kids tomorrow under ₹4000',
  },
  {
    emoji: '🏠',
    label: 'New Flat Setup',
    goal: 'New flat setup this weekend under ₹15000',
  },
  {
    emoji: '✈️',
    label: 'Road Trip',
    goal: 'Road trip for 4 people this weekend under ₹5000',
  },
]

export default function MissionsScreen() {
  const router = useRouter()
  const [goalText, setGoalText] = useState('')
  const [budgetText, setBudgetText] = useState('3000')
  const [goalFocused, setGoalFocused] = useState(false)
  const [showError, setShowError] = useState(false)

  const handleChipPress = (chip: QuickChip) => {
    setGoalText(chip.goal)
    setShowError(false)
  }

  const handlePlanMission = () => {
    if (!goalText.trim()) {
      setShowError(true)
      return
    }
    setShowError(false)
    router.push({
      pathname: '/cart/building',
      params: { goal: goalText.trim(), budget: budgetText || '3000' },
    })
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🎯 What's your mission?</Text>
        <Text style={styles.subtitle}>
          Tell us your goal — we build the perfect cart
        </Text>

        {/* Quick-start chips */}
        <View style={styles.chipRow}>
          {quickChips.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              onPress={() => handleChipPress(chip)}
              style={styles.chip}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>
                {chip.emoji} {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goal input */}
        <TextInput
          value={goalText}
          onChangeText={(text) => {
            setGoalText(text)
            if (showError) setShowError(false)
          }}
          onFocus={() => setGoalFocused(true)}
          onBlur={() => setGoalFocused(false)}
          placeholder="e.g. Birthday party for 20 people under ₹3000"
          placeholderTextColor={Colors.textSecondary}
          style={[styles.goalInput, goalFocused && styles.goalInputFocused]}
          multiline
          numberOfLines={3}
          accessibilityLabel="Mission goal"
        />

        {/* Error text */}
        {showError && (
          <Text style={styles.errorText}>Please enter your goal first</Text>
        )}

        {/* Budget row */}
        <View style={styles.budgetRow}>
          <Text style={styles.budgetPrefix}>₹</Text>
          <TextInput
            value={budgetText}
            onChangeText={setBudgetText}
            keyboardType="numeric"
            style={styles.budgetInput}
            accessibilityLabel="Budget amount"
          />
        </View>

        {/* Plan button */}
        <TouchableOpacity
          onPress={handlePlanMission}
          style={styles.planButton}
          activeOpacity={0.8}
        >
          <Text style={styles.planButtonText}>Plan My Mission →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  goalInput: {
    marginTop: 20,
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  goalInputFocused: {
    borderColor: Colors.primary,
  },
  errorText: {
    color: Colors.errorRed,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
  },
  budgetPrefix: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginRight: 4,
  },
  budgetInput: {
    width: 100,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  planButton: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  planButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
