/**
 * Haptic feedback utility.
 *
 * Uses the Vibration API on Android.
 * On iOS and unsupported browsers, this is a silent no-op —
 * iOS does not expose haptic APIs to the web (Taptic Engine is native-only).
 *
 * Vibration durations are tuned for perceptibility on real devices:
 * - Very short durations (<15ms) are imperceptible on most Android phones.
 * - Pattern vibrations ([on, off, on]) give a more tactile "click" feel.
 */

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function hapticTap() {
  if (canVibrate) navigator.vibrate(20);
}

export function hapticClick() {
  if (canVibrate) navigator.vibrate([15, 30, 15]);
}

export function hapticHeavy() {
  if (canVibrate) navigator.vibrate([30, 20, 40]);
}

export function hapticDouble() {
  if (canVibrate) navigator.vibrate([15, 40, 15]);
}

export function hapticTurn() {
  if (canVibrate) navigator.vibrate(15);
}
