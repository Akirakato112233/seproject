import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
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
    imageUrl?: string;
    sender: Sender;
    createdAt: string;
}

export default function ChatScreen() {
    const {
        id,
        riderId,
        riderName: riderNameParam,
    } = useLocalSearchParams<{ id?: string; riderId?: string; riderName?: string }>();
    const riderNameFromParam =
        typeof riderNameParam === 'string' && riderNameParam && riderNameParam !== 'undefined'
            ? riderNameParam
            : null;

    const [input, setInput] = useState('');
    const [riderName, setRiderName] = useState<string>(riderNameFromParam || 'ไรเดอร์ของคุณ');
    const [riderInitial, setRiderInitial] = useState<string>(
        (riderNameFromParam || 'R').charAt(0).toUpperCase()
    );
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [riderError, setRiderError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const NGROK_HEADERS: Record<string, string> = BASE_URL.includes('ngrok')
        ? { 'ngrok-skip-browser-warning': '1' }
        : {};

    // ─── Send text message ───
    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const newMessage: ChatMessage = {
            id: `${Date.now()}`,
            text: trimmed,
            sender: 'user',
            createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newMessage]);
        setInput('');

        try {
            await fetch(`${BASE_URL}/api/chat/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
                body: JSON.stringify({ riderId, shopId: id, sender: 'user', text: trimmed }),
            });
        } catch (error) {
            console.error('[UserChat] Error sending message:', error);
        }
    };

    // ─── Pick & send image ───
    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('ต้องอนุญาตการเข้าถึงรูปภาพเพื่อส่งรูป');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: false,
            });

            if (result.canceled || !result.assets?.[0]) return;

            setUploading(true);
            const asset = result.assets[0];
            const uri = asset.uri;
            const filename = uri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // Upload image to backend
            const formData = new FormData();
            formData.append('image', { uri, name: filename, type } as any);

            const uploadRes = await fetch(`${BASE_URL}/api/chat/upload`, {
                method: 'POST',
                headers: NGROK_HEADERS,
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadData.imageUrl) {
                console.error('[UserChat] Upload failed:', uploadData);
                setUploading(false);
                return;
            }

            const imageUrl = `${BASE_URL}${uploadData.imageUrl}`;

            // Optimistic UI
            const newMessage: ChatMessage = {
                id: `${Date.now()}`,
                text: '',
                imageUrl,
                sender: 'user',
                createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, newMessage]);

            // Save message to backend
            await fetch(`${BASE_URL}/api/chat/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
                body: JSON.stringify({
                    riderId,
                    shopId: id,
                    sender: 'user',
                    imageUrl: uploadData.imageUrl,
                }),
            });
        } catch (error) {
            console.error('[UserChat] Error picking/uploading image:', error);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (riderNameFromParam) {
            setRiderName(riderNameFromParam);
            setRiderInitial(riderNameFromParam.charAt(0).toUpperCase());
        }
    }, [riderNameFromParam]);

    useEffect(() => {
        const fetchRider = async () => {
            setRiderError(null);
            try {
                if (!riderId) {
                    if (!riderNameFromParam) {
                        setRiderName('ไรเดอร์ของคุณ');
                        setRiderInitial('R');
                    }
                    return;
                }
                const response = await fetch(`${BASE_URL}/api/riders/${riderId}`, { headers: NGROK_HEADERS });
                if (!response.ok) throw new Error('Failed to fetch rider');
                const data = await response.json();
                const name: string = data.displayName || data.fullName || 'Rider';
                setRiderName(name);
                setRiderInitial(name.charAt(0).toUpperCase());
            } catch (error) {
                console.error('Error fetching rider:', error);
                setRiderError(error instanceof Error ? error.message : 'Error fetching rider');
                setRiderName('ไรเดอร์ของคุณ');
                setRiderInitial('R');
            }
        };
        fetchRider();
    }, [riderId]);

    // โหลดประวัติแชท + โพล์ทุก 2 วินาที
    useEffect(() => {
        const fetchMessages = async () => {
            if (!riderId) return;
            try {
                const params = new URLSearchParams();
                params.append('riderId', String(riderId));
                if (id) params.append('shopId', String(id));

                const response = await fetch(`${BASE_URL}/api/chat/messages?${params.toString()}`, {
                    headers: NGROK_HEADERS,
                });
                if (!response.ok) throw new Error('Failed to fetch messages');

                const data = await response.json();
                const mapped: ChatMessage[] = data.map((m: any) => ({
                    id: m._id,
                    text: m.text || '',
                    imageUrl: m.imageUrl ? (m.imageUrl.startsWith('http') ? m.imageUrl : `${BASE_URL}${m.imageUrl}`) : undefined,
                    sender: m.sender,
                    createdAt: m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                        : '',
                }));
                setMessages(mapped);
            } catch (error) {
                console.error('[UserChat] Error fetching messages:', error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [id, riderId]);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowRider]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleRider, item.imageUrl && styles.bubbleImage]}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />
                    ) : null}
                    {item.text ? (
                        <Text style={[styles.messageText, isUser && styles.messageTextUser]}>{item.text}</Text>
                    ) : null}
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
            </View>

            {riderError && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color="#dc2626" />
                    <Text style={styles.errorText}>Error fetching rider: {riderError}</Text>
                    <TouchableOpacity onPress={() => setRiderError(null)} style={styles.errorDismiss}>
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

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
                    <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator size="small" color="#1d4685" />
                        ) : (
                            <Ionicons name="camera-outline" size={22} color="#1d1d1f" />
                        )}
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
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb',
    },
    headerIconButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#1d4685',
        alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
    },
    headerAvatarText: { color: '#ffffff', fontWeight: '700', fontSize: 18 },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#10b981' },
    errorBanner: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151',
        paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    },
    errorText: { flex: 1, fontSize: 14, color: '#fff' },
    errorDismiss: { padding: 4 },
    chatWrapper: { flex: 1 },
    messagesContainer: { paddingHorizontal: 12, paddingVertical: 12 },
    messageRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowRider: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
    bubbleUser: { backgroundColor: '#1d4685', borderBottomRightRadius: 4 },
    bubbleRider: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4 },
    bubbleImage: { paddingHorizontal: 4, paddingTop: 4 },
    chatImage: { width: 200, height: 200, borderRadius: 14, marginBottom: 4 },
    messageText: { fontSize: 14, color: '#111827' },
    messageTextUser: { color: '#ffffff' },
    timeText: { fontSize: 11, color: '#6b7280', marginTop: 4, alignSelf: 'flex-end' },
    timeTextUser: { color: '#e5e7eb' },
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff',
    },
    cameraButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    inputContainer: { flex: 1, borderRadius: 18, backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, maxHeight: 120 },
    textInput: { fontSize: 14, color: '#111827' },
    sendButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1d4685', alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
    sendButtonDisabled: { opacity: 0.5 },
});
