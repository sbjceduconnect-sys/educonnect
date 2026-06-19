/**
 * useAppPermissions.js
 *
 * Central Capacitor permissions hook for EduConnect.
 * Implements the Principle of Least Privilege — each permission is only
 * requested at the exact moment the relevant feature is invoked.
 *
 * Covered permissions:
 *   - CAMERA          → QR code scanning (Teacher Attendance module)
 *   - STORAGE/MEDIA   → File uploads (Study Materials) & PDF downloads
 *   - NOTIFICATIONS   → Announcement broadcasts (on app first-launch)
 *
 * Notification permission strategy:
 *   @capacitor/local-notifications does not reliably bridge
 *   checkPermissions() on all Android builds. Instead we use the
 *   @capacitor/push-notifications plugin's simpler permission API,
 *   with a safe fallback: if the plugin is unavailable or throws,
 *   we return `true` so the app never crashes. Android will prompt
 *   natively when the first notification is posted anyway.
 */

import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Safely request the POST_NOTIFICATIONS permission on Android 13+ (API 33+).
 *
 * Strategy (in order of preference):
 *  1. Use @capacitor/local-notifications if its checkPermissions is available
 *  2. Fall back to returning `true` — Android will show the OS dialog itself
 *     the first time a notification is posted via any native channel.
 *
 * This avoids the "LocalNotifications.then() is not implemented on android"
 * error that occurs when the plugin bridge hasn't been fully registered.
 *
 * @returns {Promise<boolean>}
 */
async function requestNativeNotificationPermission() {
  try {
    // Guard: some Android builds expose the import but not the bridge method.
    // If checkPermissions itself is not a function, bail out gracefully.
    if (typeof LocalNotifications?.checkPermissions !== 'function') {
      console.warn('[EduConnect Permissions] LocalNotifications.checkPermissions not available — skipping');
      return true; // safe fallback: OS will prompt when needed
    }

    const status = await LocalNotifications.checkPermissions();

    if (status?.display === 'granted') return true;
    if (status?.display === 'denied')  return false;

    // 'prompt' or 'prompt-with-rationale' — trigger OS dialog
    const result = await LocalNotifications.requestPermissions();
    return result?.display === 'granted';

  } catch (err) {
    // "not implemented" or any bridge error → graceful degradation
    const msg = err?.message || String(err);
    console.warn('[EduConnect Permissions] Notification permission request skipped:', msg);
    // Return true: Android ≤ 12 auto-grants, Android 13+ will prompt on first send
    return true;
  }
}

/**
 * Generic wrapper: runs requestFn, catches any thrown error, returns false.
 * Used for camera and storage where false = denied (actionable by user).
 *
 * @param {() => Promise<boolean>} requestFn
 * @returns {Promise<boolean>}
 */
async function tryRequest(requestFn) {
  try {
    return await requestFn();
  } catch (err) {
    console.warn('[EduConnect Permissions]', err?.message || err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useAppPermissions() {
  const isNative = Capacitor.isNativePlatform();

  const [cameraGranted,        setCameraGranted]        = useState(null);
  const [storageGranted,       setStorageGranted]       = useState(null);
  const [notificationsGranted, setNotificationsGranted] = useState(null);

  // ── CAMERA ────────────────────────────────────────────────────────────────
  /**
   * Request camera permission via @capacitor/camera.
   * Called ONLY when the teacher taps "Generate QR Code".
   * Web: always resolves true (browser shows its own camera prompt).
   */
  const requestCameraPermission = useCallback(async () => {
    if (!isNative) {
      setCameraGranted(true);
      return true;
    }

    const granted = await tryRequest(async () => {
      const status = await Camera.checkPermissions();
      if (status.camera === 'granted') return true;
      if (status.camera === 'denied')  return false;

      const result = await Camera.requestPermissions({ permissions: ['camera'] });
      return result.camera === 'granted';
    });

    setCameraGranted(granted);
    return granted;
  }, [isNative]);

  // ── STORAGE / MEDIA ───────────────────────────────────────────────────────
  /**
   * Request storage permission via @capacitor/filesystem.
   * Called ONLY when uploading a material or downloading a PDF.
   *
   * Android 13+ → maps to READ_MEDIA_IMAGES / READ_MEDIA_VIDEO internally.
   * Android ≤ 12 → maps to READ/WRITE_EXTERNAL_STORAGE.
   * Web: always resolves true.
   */
  const requestStoragePermission = useCallback(async () => {
    if (!isNative) {
      setStorageGranted(true);
      return true;
    }

    const granted = await tryRequest(async () => {
      const status = await Filesystem.checkPermissions();
      if (status.publicStorage === 'granted') return true;
      if (status.publicStorage === 'denied')  return false;

      const result = await Filesystem.requestPermissions();
      return result.publicStorage === 'granted';
    });

    setStorageGranted(granted);
    return granted;
  }, [isNative]);

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  /**
   * Request POST_NOTIFICATIONS permission (Android 13+ / API 33+).
   * Called once on app first-launch via AppBootstrap in App.jsx.
   *
   * Safe fallback: if the plugin bridge is unavailable on this device/build,
   * returns `true` without throwing. The OS will handle the prompt when
   * the first notification is dispatched through any native channel.
   *
   * Web / Android ≤ 12: always resolves true (auto-granted by OS).
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!isNative) {
      setNotificationsGranted(true);
      return true;
    }

    const granted = await requestNativeNotificationPermission();
    setNotificationsGranted(granted);
    return granted;
  }, [isNative]);

  return {
    // State (null = unchecked, true = granted, false = denied)
    cameraGranted,
    storageGranted,
    notificationsGranted,
    isNative,

    // Request methods — call only at exact point of feature use
    requestCameraPermission,
    requestStoragePermission,
    requestNotificationPermission,
  };
}
