import { useEffect, useState } from 'react';
interface PwaInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export function InstallControls() {
  const [installEvent, setInstallEvent] = useState<PwaInstallEvent | null>(null);
  const [installed, setInstalled] = useState(
    () => matchMedia('(display-mode: standalone)').matches,
  );
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as PwaInstallEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = async () => {
    if (!installEvent) return;
    const prompt = installEvent;
    setInstallEvent(null);
    await prompt.prompt();
    const answer = await prompt.userChoice;
    if (answer.outcome === 'accepted') setInstalled(true);
  };
  return (
    <section className="security-section" aria-label="Установка XPlink">
      <h2>Установка приложения</h2>
      {installed ? (
        <p>Приложение открыто в установленном режиме.</p>
      ) : (
        <>
          <p>
            Добавьте XPlink на рабочий стол или главный экран. История и ключи не копируются в
            офлайн-кэш.
          </p>
          {installEvent ? (
            <button type="button" onClick={() => void install()}>
              Установить XPlink
            </button>
          ) : (
            <p className="muted">
              Используйте меню браузера «Установить приложение» или «На экран Домой», если кнопка
              недоступна.
            </p>
          )}
        </>
      )}
    </section>
  );
}
