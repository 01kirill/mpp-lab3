import { useEffect, useRef, useState } from 'react';
import { Attachment } from '../types/Attachment';
import { attachmentsApi } from '../api/attachmentsApi';

interface Props {
  eventId: string;
  /** Только просмотр и скачивание (роль viewer) */
  readOnly?: boolean;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function AttachmentList({ eventId, readOnly = false }: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    attachmentsApi
      .listByEvent(eventId)
      .then((list) => { if (!cancelled) setItems(list); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить вложения'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  const handleDownload = async (id: string, filename: string) => {
    try {
      const url = URL.createObjectURL(await attachmentsApi.download(id));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось скачать файл');
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const created = await attachmentsApi.upload(eventId, file);
      setItems((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить файл');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить файл?')) return;
    try {
      await attachmentsApi.delete(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить файл');
    }
  };

  return (
    <div className="attachments">
      <div className="attachments__header">
        <span className="attachments__title">Вложения</span>
        {!readOnly && (
          <label className="attachments__upload">
            <input
              ref={inputRef}
              type="file"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <span className="btn btn--secondary">+ Файл</span>
          </label>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <p className="attachments__empty">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="attachments__empty">Нет вложений</p>
      ) : (
        <ul className="attachments__list">
          {items.map((a) => (
            <li key={a.id} className="attachment">
              <button
                type="button"
                className="attachment__name"
                title={a.originalName}
                onClick={() => handleDownload(a.id, a.originalName)}
              >
                {a.originalName}
              </button>
              <span className="attachment__size">{humanSize(a.sizeBytes)}</span>
              {!readOnly && (
                <button
                  type="button"
                  className="btn btn--mini"
                  onClick={() => handleDelete(a.id)}
                  aria-label="Удалить"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
