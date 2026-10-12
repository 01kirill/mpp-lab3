/** Удаляет загруженный файл по имени хранения; отсутствие файла — не ошибка */
export type RemoveFile = (storedName: string) => Promise<void>;
