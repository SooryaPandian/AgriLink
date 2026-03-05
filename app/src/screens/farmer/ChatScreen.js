import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b', mine: '#15803d' };

export default function ChatScreen({ route }) {
  const { sessionId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatRef = useRef(null);

  useEffect(() => {
    api.get(`/chat/${sessionId}`).then(r => {
      setMessages(r.data.messages);
      setLoading(false);
    });
    const socket = getSocket();
    socket.emit('join_session', sessionId);
    socket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => {
      socket.emit('leave_session', sessionId);
      socket.off('chat_message');
    };
  }, [sessionId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const t = text.trim();
    setText('');
    try {
      await api.post(`/chat/${sessionId}`, { text: t });
    } catch { setText(t); }
  };

  const isMine = (msg) => msg.sender?._id === user?._id || msg.sender === user?._id;

  const renderMessage = ({ item }) => {
    if (item.type === 'system') {
      return (
        <View style={s.systemMsg}>
          <Text style={s.systemText}>⚙️ {item.text}</Text>
        </View>
      );
    }
    const mine = isMine(item);
    return (
      <View style={[s.msgWrap, mine ? s.mine : s.theirs]}>
        {!mine && <Text style={s.senderName}>{item.sender?.name || 'User'}</Text>}
        <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs, item.type === 'price_proposal' && s.bubblePrice]}>
          {item.type === 'price_proposal' && <Text style={s.priceTag}>💰 Price Proposal</Text>}
          <Text style={[s.bubbleText, mine && { color: '#fff' }]}>{item.text}</Text>
          <Text style={[s.msgTime, mine && { color: 'rgba(255,255,255,0.6)' }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={() => <View style={s.center}><Text style={s.emptyText}>No messages yet. Start the conversation!</Text></View>}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <View style={s.inputWrap}>
        <TextInput style={s.input} placeholder="Type a message..." placeholderTextColor={C.muted}
          value={text} onChangeText={setText} multiline returnKeyType="send" onSubmitEditing={sendMessage} />
        <TouchableOpacity style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]} onPress={sendMessage} disabled={!text.trim()}>
          <Text style={s.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: C.muted, textAlign: 'center' },
  systemMsg: { alignItems: 'center', marginVertical: 4 },
  systemText: { fontSize: 11, color: C.dim, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, textAlign: 'center' },
  msgWrap: { maxWidth: '80%', marginVertical: 2 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: 10, color: C.dim, marginBottom: 2, marginLeft: 4 },
  bubble: { borderRadius: 16, padding: 10 },
  bubbleMine: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: C.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  bubblePrice: { borderWidth: 2, borderColor: C.accent, backgroundColor: 'rgba(245,158,11,0.1)' },
  priceTag: { fontSize: 10, fontWeight: '800', color: C.accent, marginBottom: 4 },
  bubbleText: { fontSize: 14, color: C.text, lineHeight: 20 },
  msgTime: { fontSize: 10, color: C.dim, marginTop: 4, textAlign: 'right' },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card },
  input: { flex: 1, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: C.text, maxHeight: 100, fontSize: 14, borderWidth: 1, borderColor: C.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: C.dim },
  sendIcon: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
