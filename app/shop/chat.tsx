import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../config';

type Sender = 'user' | 'rider';

interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
  createdAt: string;
}

export default function ChatScreen() {
  const { id, riderId } = useLocalSearchParams<{ id?: string; riderId?: string }>();

  const [input, setInput] = useState('');
  const [riderName, setRiderName] = useState<string>('ไรเดอร์ของคุณ');
  const [riderInitial, setRiderInitial] = useState<string>('R');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const newMessage: ChatMessage = {
      id: `${Date.now()}`,
      text: trimmed,
      sender: 'user',
      createdAt: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    // ส่งข้อความไป backend เพื่อบันทึกลง MongoDB
    try {
      await fetch(`${BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riderId,
          shopId: id,
          sender: 'user',
          text: trimmed,
        }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    const fetchRider = async () => {
      try {
        if (!riderId) {
          // ถ้าไม่มี riderId ให้ใช้ชื่อที่ตั้งค่าไว้เดิม
          setRiderName('Nattapon Saewang');
          setRiderInitial('N');
          return;
        }

        const response = await fetch(`${BASE_URL}/api/riders/${riderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch rider');
        }

        const data = await response.json();
        const name: string = data.displayName || data.fullName || 'Rider';
        setRiderName(name);
        setRiderInitial(name.charAt(0).toUpperCase());
      } catch (error) {
        console.error('Error fetching rider:', error);
        // fallback ใช้ชื่อที่เคยกำหนดไว้
        setRiderName('Nattapon Saewang');
        setRiderInitial('N');
      }
    };

    fetchRider();
  }, [riderId]);

  // โหลดประวัติแชทจาก backend
  useEffect(() => {
    const fetchMessages = async () => {
      if (!riderId) {
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append('riderId', String(riderId));
        if (id) {
          params.append('shopId', String(id));
        }

        const response = await fetch(`${BASE_URL}/api/chat/messages?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        const mapped: ChatMessage[] = data.map((m: any) => ({
          id: m._id,
          text: m.text,
          sender: m.sender,
          createdAt: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
        }));
        setMessages(mapped);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [id, riderId]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowRider]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleRider,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.messageTextUser]}>{item.text}</Text>
          <Text style={[styles.timeText, isUser && styles.timeTextUser]}>{item.createdAt}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
          <Ionicons name="arrow-back" size={22} color="#1d1d1f" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{riderInitial}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{riderName}</Text>
            <Text style={styles.headerSubtitle}>ไรเดอร์ของคุณ</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            {/* TODO: ต่อกับระบบโทรศัพท์ เช่น Linking.openURL(`tel:${phoneNumber}`) */}
            <Ionicons name="call-outline" size={20} color="#1d1d1f" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat area */}
      <KeyboardAvoidingView
        style={styles.chatWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera-outline" size={22} color="#1d1d1f" />
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="พิมพ์ข้อความ..."
              placeholderTextColor="#a1a1aa"
              value={input}
              onChangeText={setInput}
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d4685',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  headerAvatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#10b981',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatWrapper: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowRider: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleUser: {
    backgroundColor: '#1d4685',
    borderBottomRightRadius: 4,
  },
  bubbleRider: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
  },
  messageTextUser: {
    color: '#ffffff',
  },
  timeText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextUser: {
    color: '#e5e7eb',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cameraButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1d4685',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

