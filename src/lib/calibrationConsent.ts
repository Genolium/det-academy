const CALIBRATION_SNOOZE_KEY = 'det_calibration_consent_snoozed_until';

/** Hide the optional consent card for a while after a decline or revocation. */
export function snoozeCalibrationConsentPrompt(days: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CALIBRATION_SNOOZE_KEY, String(Date.now() + days * 86_400_000));
}

export function isCalibrationConsentPromptSnoozed(now = Date.now()): boolean {
  if (typeof window === 'undefined') return false;
  const until = Number(localStorage.getItem(CALIBRATION_SNOOZE_KEY));
  return Number.isFinite(until) && until > now;
}

export { CALIBRATION_SNOOZE_KEY };
