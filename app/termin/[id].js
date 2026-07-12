import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTerminChatPreview, getTerminDetails, getUserProfile } from '../../lib/api';
import TerminDetailScreen from '../../screens/TerminDetailScreen';
import { colors } from '../../theme/colors';

export default function TerminDetail() {
  const { id } = useLocalSearchParams();
  const [termin, setTermin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatPreview, setChatPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [result, userRes] = await Promise.all([getTerminDetails(id), getUserProfile()]);

    if (!result?.success) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const terminData = result.data;
    const user = userRes?.profile || null;
    setCurrentUser(user);

    const isOwner = user?.id === terminData.creator_id;
    const isRegistered = terminData.registered_players?.includes(user?.id);

    if (isOwner || isRegistered) {
      const chatResult = await getTerminChatPreview(terminData.id);
      if (chatResult.success) setChatPreview(chatResult.data);
    }

    setTermin(terminData);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.logoGreen} />
      </SafeAreaView>
    );
  }

  if (notFound || !termin) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.textSec }}>Termin nije pronađen...</Text>
      </SafeAreaView>
    );
  }

  return <TerminDetailScreen termin={termin} currentUser={currentUser} chatPreview={chatPreview} viewerCurrency={currentUser?.currency || 'KM'} onRefresh={load} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
