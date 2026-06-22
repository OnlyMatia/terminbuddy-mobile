import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';

export default function Profil() {
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Profil</Text>
      <Pressable style={styles.btn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.btnText}>Odjava</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background, padding: 20, gap: 20 },
  title: { color: theme.text, fontSize: 24, fontWeight: '700' },
  btn: { backgroundColor: theme.bg2, borderWidth: 1, borderColor: theme.line, borderRadius: 14, padding: 14, alignItems: 'center' },
  btnText: { color: theme.danger, fontWeight: '600' },
});