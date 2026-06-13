import { StyleSheet, View } from 'react-native'

import { Colors } from '../../lib/constants'

export default function ProfileScreen() {
  return <View style={styles.screen} />
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})
