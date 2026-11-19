import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAudioStore } from '../../store/audioStore';
import styles from './ErrorAlert.module.css';

export const ErrorAlert: React.FC = () => {
  const { errorMessage, setError } = useAudioStore();

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setError(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, setError]);

  if (!errorMessage) return null;

  return (
    <div className={styles.errorBanner} role="alert" aria-live="assertive">
      <AlertTriangle className={styles.errorIcon} size={20} />
      <span className={styles.errorMessage}>{errorMessage}</span>
      <button
        type="button"
        onClick={() => setError(null)}
        className={styles.dismissButton}
        aria-label="Dismiss error notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};
