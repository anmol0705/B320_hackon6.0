import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Colors, Radius } from '../../lib/constants'

interface IdentityGroup {
  emoji: string
  name: string
  members: string
}

interface GoalTile {
  emoji: string
  name: string
  members: string
}

interface ProductItem {
  name: string
  price: number
  rating: number
  amazonNow: boolean
  initial: string
}

const IDENTITY_GROUPS: IdentityGroup[] = [
  { emoji: '💪', name: 'Office Gym Dad', members: '12.4k members' },
  { emoji: '📚', name: 'JEE Student', members: '8.9k members' },
  { emoji: '✨', name: 'College Girl', members: '15.2k members' },
  { emoji: '👨‍🍳', name: 'Home Chef', members: '6.7k members' },
]

const GOAL_TILES: GoalTile[] = [
  { emoji: '🏕️', name: 'Trekking Essentials', members: '2,847 trekkers' },
  { emoji: '🎉', name: 'Party Season', members: '5,102 planners' },
  { emoji: '📚', name: 'JEE Prep', members: '3,891 students' },
  { emoji: '👶', name: 'New Baby', members: '1,203 parents' },
]

const PRODUCTS: ProductItem[] = [
  { name: 'Protein Shaker Bottle', price: 399, rating: 4.3, amazonNow: true, initial: 'P' },
  { name: 'Resistance Bands Set', price: 599, rating: 4.5, amazonNow: true, initial: 'R' },
  { name: 'Multivitamin 60 tabs', price: 449, rating: 4.2, amazonNow: true, initial: 'M' },
  { name: 'Water Bottle 1L', price: 299, rating: 4.4, amazonNow: true, initial: 'W' },
  { name: 'Notebook A4 Pack of 3', price: 149, rating: 4.1, amazonNow: true, initial: 'N' },
  { name: 'Wireless Earphones', price: 799, rating: 4.0, amazonNow: false, initial: 'W' },
]

export default function DiscoverScreen() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  const showProducts = selectedGroup !== null || selectedGoal !== null
  const productLabel = selectedGoal
    ? `What ${GOAL_TILES.find((g) => g.name === selectedGoal)?.members || 'people'} actually bought`
    : selectedGroup
      ? `${selectedGroup} essentials`
      : ''

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.pageTitle}>Discover</Text>

        {/* Identity Groups Section */}
        <Text style={styles.sectionTitle}>Essentials for people like you</Text>
        <Text style={styles.sectionSubtitle}>
          What real people like you actually buy.{'\n'}Zero sponsored products.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsScroll}
        >
          {IDENTITY_GROUPS.map((group) => (
            <TouchableOpacity
              key={group.name}
              onPress={() => {
                setSelectedGroup(group.name)
                setSelectedGoal(null)
              }}
              activeOpacity={0.7}
              style={[
                styles.groupCard,
                selectedGroup === group.name && styles.groupCardSelected,
              ]}
            >
              <Text style={styles.groupEmoji}>{group.emoji}</Text>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMembers}>{group.members}</Text>
              <View style={styles.noSponsoredPill}>
                <Text style={styles.noSponsoredText}>No sponsored</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product grid */}
        {showProducts && (
          <View style={styles.productSection}>
            <Text style={styles.productSectionTitle}>{productLabel}</Text>
            <Text style={styles.productSectionSubtitle}>
              Zero sponsored products · Curated by community
            </Text>

            {/* Trust badge */}
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeText}>
                🛡️ No sponsored products in this section
              </Text>
            </View>

            {/* Product grid */}
            <View style={styles.productGrid}>
              {PRODUCTS.map((product) => (
                <View key={product.name} style={styles.productCard}>
                  <View style={styles.productPlaceholder}>
                    <Text style={styles.productInitial}>{product.initial}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                  <Text style={styles.productRating}>⭐ {product.rating}</Text>
                  {product.amazonNow ? (
                    <View style={styles.nowPill}>
                      <Text style={styles.nowPillText}>Now ⚡</Text>
                    </View>
                  ) : (
                    <View style={styles.tomorrowPill}>
                      <Text style={styles.tomorrowPillText}>Tomorrow</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Popular Goals Section */}
        <Text style={styles.goalsTitle}>Popular Goals Right Now</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.goalsScroll}
        >
          {GOAL_TILES.map((goal) => (
            <TouchableOpacity
              key={goal.name}
              onPress={() => {
                setSelectedGoal(goal.name)
                setSelectedGroup(null)
              }}
              activeOpacity={0.7}
              style={[
                styles.goalCard,
                selectedGoal === goal.name && styles.goalCardSelected,
              ]}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalMembers}>{goal.members}</Text>
              <Text style={styles.goalNoSponsored}>Zero sponsored</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    paddingBottom: 20,
  },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    padding: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  groupsScroll: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  groupCard: {
    width: 140,
    marginRight: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 14,
  },
  groupCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  groupEmoji: {
    fontSize: 28,
  },
  groupName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  groupMembers: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  noSponsoredPill: {
    backgroundColor: Colors.successGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  noSponsoredText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  productSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  productSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  productSectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 10,
    marginTop: 2,
  },
  trustBadge: {
    backgroundColor: Colors.trustBg,
    borderWidth: 1,
    borderColor: Colors.primeBadge,
    borderRadius: Radius.md,
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  trustBadgeText: {
    color: Colors.sponsoredBlue,
    fontSize: 13,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  productCard: {
    width: '47%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
    margin: 4,
  },
  productPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: Colors.secondaryBg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInitial: {
    color: Colors.textSecondary,
    fontSize: 20,
    fontWeight: '700',
  },
  productName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  productPrice: {
    color: Colors.errorRed,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  productRating: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  nowPill: {
    backgroundColor: Colors.successGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  nowPillText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  tomorrowPill: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tomorrowPillText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.secondaryBg,
    marginTop: 20,
  },
  goalsTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  goalsScroll: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  goalCard: {
    width: 130,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  goalCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  goalMembers: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  goalNoSponsored: {
    color: Colors.successGreen,
    fontSize: 10,
    marginTop: 4,
  },
})
