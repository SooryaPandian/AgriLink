import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b', danger: '#ef4444', success: '#22c55e', info: '#3b82f6' };
const TYPE_COLOR = { contract_invitation: C.success, buyer_counter: C.accent, price_agreed: C.primary, contract_accepted: C.success, contract_rejected: C.danger, negotiation_update: C.info, application_accepted: C.primary };

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetch();
    if (!user) return;
    const socket = getSocket();
    socket.emit('join_user', user._id);
    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });
    return () => socket.off('notification');
  }, [user]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[s.item, !item.isRead && s.itemUnread, { borderLeftColor: TYPE_COLOR[item.type] || C.dim }]}
      onPress={() => !item.isRead && markRead(item._id)}>
      <View style={s.itemContent}>
        <View style={{ flex: 1 }}>
          <Text style={s.notifTitle}>{item.title}</Text>
          <Text style={s.notifMsg}>{item.message}</Text>
          <Text style={s.notifTime}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        {!item.isRead && <View style={s.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {notifications.some(n => !n.isRead) && (
        <TouchableOpacity style={s.markAllBtn} onPress={markAll}>
          <Text style={s.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifications}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={C.primary} />}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>🔔</Text>
            <Text style={s.emptyTitle}>No Notifications</Text>
            <Text style={s.emptySub}>You'll be notified about requirement updates, negotiations, and contracts.</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  markAllBtn: { padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'flex-end', paddingHorizontal: 20 },
  markAllText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  item: { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4 },
  itemUnread: { borderColor: C.border },
  itemContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  notifMsg: { fontSize: 12, color: C.muted, lineHeight: 18 },
  notifTime: { fontSize: 10, color: C.dim, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 4, flexShrink: 0 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: C.muted, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
});
