import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const DEFAULT_NOTES = [
  {
    id: '1',
    title: 'Belanja Mingguan',
    content: 'Membeli telur, susu, roti, kopi, dan buah-buahan segar.',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Rencana Proyek Expo',
    content: 'Membuat aplikasi Catatan Sederhana dengan Expo, React Navigation, dan Supabase Database.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    title: 'Jadwal Kuliah & Praktikum',
    content: 'Senin: Pemrograman Mobile (08.00 WIB)\nRabu: Basis Data Lanjut (10.30 WIB)',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function NotesScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  // Membaca daftar catatan (Supabase + Fallback Local Storage & Sample Data)
  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      // 1. Coba ambil dari Supabase jika ada session auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setNotes(data);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // 2. Fallback ke Local Storage / Sample Data (Selalu dapat diuji)
      const localDataStr = await AsyncStorage.getItem('@notes_data');
      if (localDataStr) {
        const parsed = JSON.parse(localDataStr);
        setNotes(parsed);
      } else {
        await AsyncStorage.setItem('@notes_data', JSON.stringify(DEFAULT_NOTES));
        setNotes(DEFAULT_NOTES);
      }
    } catch (err) {
      console.log('Fallback to default sample notes');
      setNotes(DEFAULT_NOTES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tombol Tambah / Buka Modal Input Baru
  const handleOpenAddModal = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };

  // Tap Item untuk Edit (Update)
  const handleOpenEditModal = (item) => {
    setEditingNoteId(item.id);
    setTitle(item.title);
    setContent(item.content || '');
    setModalVisible(true);
  };

  // Simpan Catatan (Create atau Update)
  const handleSaveNote = async () => {
    if (!title.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Judul catatan tidak boleh kosong');
      } else {
        Alert.alert('Perhatian', 'Judul catatan tidak boleh kosong');
      }
      return;
    }

    setSaving(true);
    try {
      const newTitle = title.trim();
      const newContent = content.trim();

      // Update di Supabase jika ada user session
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (editingNoteId) {
            await supabase.from('notes').update({ title: newTitle, content: newContent }).eq('id', editingNoteId);
          } else {
            await supabase.from('notes').insert([{ user_id: user.id, title: newTitle, content: newContent }]);
          }
        }
      } catch (e) {
        console.log('Supabase sync skipped, updating local storage');
      }

      // Selalu update di Local Storage agar UI responsif 100%
      let updatedNotes = [...notes];
      if (editingNoteId) {
        updatedNotes = updatedNotes.map((n) =>
          n.id.toString() === editingNoteId.toString()
            ? { ...n, title: newTitle, content: newContent }
            : n
        );
      } else {
        const newNoteItem = {
          id: Date.now().toString(),
          title: newTitle,
          content: newContent,
          created_at: new Date().toISOString(),
        };
        updatedNotes = [newNoteItem, ...updatedNotes];
      }

      await AsyncStorage.setItem('@notes_data', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      setModalVisible(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Helper untuk konfirmasi yang kompatibel dengan Web & Mobile
  const confirmAction = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya', style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  // Tombol Hapus per Item (Delete)
  const handleDeleteNote = (id, noteTitle) => {
    confirmAction(
      'Hapus Catatan',
      `Apakah Anda yakin ingin menghapus catatan "${noteTitle}"?`,
      async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('notes').delete().eq('id', id);
          }
        } catch (e) {}

        const updatedNotes = notes.filter((n) => n.id.toString() !== id.toString());
        await AsyncStorage.setItem('@notes_data', JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
      }
    );
  };

  // Logout
  const handleLogout = () => {
    confirmAction('Logout', 'Apakah Anda yakin ingin keluar?', async () => {
      try {
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('@dummy_user');
      } catch (e) {}
      navigation.replace('Login');
    });
  };

  const renderNoteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteNote(item.id, item.title)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
      {item.content ? (
        <Text style={styles.cardContent} numberOfLines={3}>
          {item.content}
        </Text>
      ) : null}
      <Text style={styles.cardDate}>
        {new Date(item.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daftar Catatan</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* List Catatan */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 10, color: '#6B7280' }}>Memuat catatan...</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNoteItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchNotes();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Belum Ada Catatan</Text>
              <Text style={styles.emptySubtitle}>
                Klik tombol "+" di bawah untuk membuat catatan pertama Anda.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (Tombol Tambah Catatan) */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Input/Edit Catatan */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingNoteId ? 'Edit Catatan' : 'Tambah Catatan Baru'}
            </Text>

            <Text style={styles.inputLabel}>Judul</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masukkan judul catatan..."
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Isi Catatan</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Tuliskan isi catatan di sini..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveNote}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    marginBottom: 14,
  },
  textArea: {
    height: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
