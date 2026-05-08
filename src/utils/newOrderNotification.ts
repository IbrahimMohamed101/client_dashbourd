// ── New Order Notification Sound ──
// Uses Web Audio API to generate a pleasant chime when a new order arrives.
// No external audio files needed – works offline and across all modern browsers.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Play a two-tone chime notification sound. */
export function playNewOrderSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First tone – higher pitch (C5 ≈ 523 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523.25, now);
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Second tone – lower pitch (G4 ≈ 392 Hz), slightly delayed
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(392.0, now + 0.15);
  gain2.gain.setValueAtTime(0.0, now);
  gain2.gain.setValueAtTime(0.25, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.55);
}

/** Play a short alert beep for urgent new orders (confirmed + paid). */
export function playUrgentNewOrderSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Triple ascending beep pattern
  const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const offset = i * 0.12;
    osc.frequency.setValueAtTime(freq, now + offset);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.setValueAtTime(0.35, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.15);
  });
}

// ── Browser Notification Permission ──

let notificationPermissionRequested = false;

/** Request browser notification permission if not already granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  if (notificationPermissionRequested) return false;

  notificationPermissionRequested = true;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/** Show a browser notification for a new order (works when tab is in background). */
export function showNewOrderBrowserNotification(
  orderNumber: string,
  customerName?: string
): void {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  const title = "طلب جديد!";
  const body = customerName
    ? `طلب ${orderNumber} من ${customerName}`
    : `طلب جديد: ${orderNumber}`;

  const notification = new Notification(title, {
    body,
    icon: "/logo.png",
    tag: `new-order-${orderNumber}`,
    requireInteraction: true, // Stay visible until user dismisses
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-dismiss after 10 seconds
  setTimeout(() => notification.close(), 10_000);
}
