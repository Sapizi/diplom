'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.scss';

type SlideActionProps = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onComplete: () => Promise<void> | void;
};

const KNOB_SIZE = 48;

export default function SlideAction({ label, disabled = false, loading = false, onComplete }: SlideActionProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerUp = async () => {
      setDragging(false);

      const trackWidth = trackRef.current?.offsetWidth ?? 0;
      const maxOffset = Math.max(0, trackWidth - KNOB_SIZE - 8);
      const completed = maxOffset > 0 && offset >= maxOffset * 0.82;

      if (completed && !disabled && !loading) {
        setOffset(maxOffset);

        try {
          await onComplete();
        } finally {
          setOffset(0);
        }

        return;
      }

      setOffset(0);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!trackRef.current) {
        return;
      }

      const rect = trackRef.current.getBoundingClientRect();
      const maxOffset = Math.max(0, rect.width - KNOB_SIZE - 8);
      const nextOffset = Math.min(maxOffset, Math.max(0, event.clientX - rect.left - KNOB_SIZE / 2));
      setOffset(nextOffset);
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [disabled, dragging, loading, offset, onComplete]);

  const handlePointerDown = () => {
    if (disabled || loading) {
      return;
    }

    setDragging(true);
  };

  return (
    <div
      ref={trackRef}
      className={`${styles.slideAction} ${disabled ? styles.slideActionDisabled : ''}`}
      aria-disabled={disabled || loading}
    >
      <div className={styles.slideActionFill} style={{ width: `${offset + KNOB_SIZE}px` }} />
      <div className={styles.slideActionLabel}>{loading ? 'Сохраняем...' : label}</div>
      <button
        type="button"
        className={styles.slideActionKnob}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        disabled={disabled || loading}
        aria-label={label}
      >
        →
      </button>
    </div>
  );
}
