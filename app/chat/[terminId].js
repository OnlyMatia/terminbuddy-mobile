import { useLocalSearchParams } from 'expo-router';
import ChatRoomScreen from '../../screens/ChatRoomScreen';

export default function ChatRoom() {
  const { terminId } = useLocalSearchParams();
  return <ChatRoomScreen terminId={terminId} />;
}
