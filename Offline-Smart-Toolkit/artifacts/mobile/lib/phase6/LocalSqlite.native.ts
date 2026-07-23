import { NativeModules } from 'react-native';

type SqlParam = string | number | null;

const { Phase6Native } = NativeModules as {
  Phase6Native?: {
    executeSql(sql: string, params: SqlParam[]): Promise<void>;
    querySql<T>(sql: string, params: SqlParam[]): Promise<T[]>;
  };
};

function nativeDb() {
  if (!Phase6Native) throw new Error('Offline database is unavailable.');
  return Phase6Native;
}

export async function executeSql(sql: string, params: SqlParam[] = []): Promise<void> {
  await nativeDb().executeSql(sql, params);
}

export async function querySql<T>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  return nativeDb().querySql<T>(sql, params);
}