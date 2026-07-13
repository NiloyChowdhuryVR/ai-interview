'use client';

import React from 'react';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  message: string;
  isFullScreen?: boolean;
}

export default function LoadingOverlay({ message, isFullScreen = false }: LoadingOverlayProps) {
  return (
    <div className={`${styles.overlay} ${isFullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.spinnerContainer}>
        <div className={styles.ring}></div>
        <div className={styles.core}></div>
      </div>
      <div className={styles.message}>
        {message}
      </div>
    </div>
  );
}
