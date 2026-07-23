import AsyncStorage from '@react-native-async-storage/async-storage';

// The web preview uses the Phase 6 AsyncStorage index. Native Android uses the
// SQLite bridge in LocalSqlite.native.ts.
const KEY = '@csc_phase6_web_sqlite';
type SqlParam = string | number | null;

export async function executeSql(_sql: string, _params: SqlParam[] = []): Promise<void> {
  if (!(await AsyncStorage.getItem(KEY))) await AsyncStorage.setItem(KEY, '{}');
}

export async function querySql<T>(
  _sql: string,
  _params: SqlParam[] = [],
): Promise<T[]> {
  return [];
}