/**
 * Haptic feedback utility using the Vibration API.
 * Silent no-op on devices/browsers that don't support it.
 */

export function hapticTap() {
  navigator.vibrate?.(12);
}

export function hapticClick() {
  navigator.vibrate?.(18);
}

export function hapticHeavy() {
  navigator.vibrate?.(30);
}

export function hapticDouble() {
  navigator.vibrate?.([10, 30, 10]);
}

export function hapticTurn() {
  navigator.vibrate?.(6);
}
