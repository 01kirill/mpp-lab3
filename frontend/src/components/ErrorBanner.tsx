interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="alert alert--error alert--banner">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Закрыть">×</button>
    </div>
  );
}
