import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import { useDrawer } from '@/context/DrawerContext';
import {
  copyFile,
  deleteFile,
  listFilesInFolder,
  moveFile,
  openFile,
  renameFile,
} from '@/lib/phase6/Phase6FileService';
import type { LocalFile, OutputFolder } from '@/lib/phase6/types';

const FOLDERS: { id: OutputFolder; label: string; icon: string }[] = [
  { id: 'downloads', label: 'Downloads', icon: 'download-outline' },
  { id: 'pictures', label: 'Pictures', icon: 'image-multiple-outline' },
  { id: 'documents', label: 'Documents', icon: 'file-document-outline' },
  { id: 'custom', label: 'App files', icon: 'folder-outline' },
];

export default function FileManagerScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [folder, setFolder] = useState<OutputFolder>('downloads');
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ action: 'rename' | 'copy' | 'move'; file: LocalFile } | null>(null);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFiles(await listFilesInFolder(folder));
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => { void load(); }, [load]);

  const runAction = async () => {
    if (!editing || !newName.trim()) return;
    try {
      if (editing.action === 'rename') await renameFile(editing.file.path, newName.trim());
      if (editing.action === 'copy') await copyFile(editing.file.path, newName.trim());
      if (editing.action === 'move') await moveFile(editing.file.path, newName.trim());
      setEditing(null);
      setNewName('');
      await load();
    } catch (error: any) {
      Alert.alert('File action failed', error?.message ?? 'The file could not be changed.');
    }
  };

  const remove = (file: LocalFile) => {
    Alert.alert('Delete file?', `Remove ${file.name} from this folder?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFile(file.path);
            await load();
          } catch (error: any) {
            Alert.alert('Delete failed', error?.message ?? 'The file could not be deleted.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 30 : insets.top) + 10, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.iconButton}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>File Manager</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons name="close" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        contentContainerStyle={[styles.list, { paddingBottom: (Platform.OS === 'web' ? 24 : insets.bottom) + 24 }]}
        ListHeaderComponent={
          <View>
            <View style={styles.folderRow}>
              {FOLDERS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setFolder(item.id)}
                  style={[styles.folderButton, { backgroundColor: folder === item.id ? colors.accent : colors.card, borderColor: folder === item.id ? colors.primary : colors.border }]}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={folder === item.id ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.folderLabel, { color: folder === item.id ? colors.primary : colors.foreground }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {loading ? 'Loading files…' : `${files.length} file${files.length === 1 ? '' : 's'}`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.fileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.fileMain} onPress={() => void openFile(item.uri)}>
              <View style={[styles.fileIcon, { backgroundColor: colors.accent }]}>
                <MaterialCommunityIcons name={item.isDirectory ? 'folder-outline' : 'file-outline'} size={22} color={colors.primary} />
              </View>
              <View style={styles.fileText}>
                <Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{item.name}</Text>
                <Text style={[styles.fileMeta, { color: colors.mutedForeground }]}>{item.isDirectory ? 'Folder' : `${item.mimeType} · ${item.size} bytes`}</Text>
              </View>
            </TouchableOpacity>
            {!item.isDirectory && (
              <View style={styles.actions}>
                {(['rename', 'copy', 'move'] as const).map((action) => (
                  <TouchableOpacity key={action} onPress={() => { setEditing({ action, file: item }); setNewName(item.name); }} style={styles.actionButton}>
                    <MaterialCommunityIcons name={`${action}-outline` as any} size={17} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => remove(item)} style={styles.actionButton}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No files here</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Exports saved to this folder will appear here.</Text>
          </View>
        }
      />

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editing?.action === 'rename' ? 'Rename file' : editing?.action === 'copy' ? 'Copy file' : 'Move file'}
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectTextOnFocus
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="New file name"
              placeholderTextColor={colors.mutedForeground}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditing(null)} style={styles.modalButton}><Text style={{ color: colors.mutedForeground }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => void runAction()} style={[styles.modalButton, { backgroundColor: colors.primary }]}><Text style={{ color: '#FFF' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  iconButton: { padding: 8 },
  title: { flex: 1, fontSize: 20 },
  list: { padding: 12, gap: 10 },
  folderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  folderButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, borderWidth: 1 },
  folderLabel: { fontSize: 12 },
  sectionLabel: { fontSize: 12, marginBottom: 2 },
  fileCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10 },
  fileMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fileText: { flex: 1 },
  fileName: { fontSize: 14 },
  fileMeta: { fontSize: 11, marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionButton: { padding: 7 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 14, padding: 18, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
});