// src/utils/exitApp.js
//
// Attempts to actually close/exit the app when the user confirms the
// "exit app?" prompt from the dashboard back-button guard.
//
// - Capacitor (Android/iOS): uses @capacitor/app's App.exitApp().
// - Electron: uses the ipc bridge exposed in electron/preload.js, if present.
// - Plain web/dev server: there's nothing meaningful to "exit", so we just
//   no-op (the modal simply closes).
export async function exitApp() {
  // Capacitor native shell
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
      return;
    }
  } catch (_) {
    // @capacitor/app not installed/available — fall through to other strategies
  }

  // Electron shell
  try {
    if (window.electronAPI?.exitApp) {
      window.electronAPI.exitApp();
      return;
    }
  } catch (_) {}

  // Plain browser — best effort only, most browsers block this
  try {
    window.close();
  } catch (_) {}
}
