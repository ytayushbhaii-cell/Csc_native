export declare function executeSql(sql: string, params?: Array<string | number | null>): Promise<void>;
export declare function querySql<T>(
  sql: string,
  params?: Array<string | number | null>,
): Promise<T[]>;