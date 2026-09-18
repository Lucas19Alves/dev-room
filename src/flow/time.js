export function elapsedSeconds(session, now = Date.now()) {
  if (!session) return 0;
  return Math.max(
    0,
    Math.floor(
      (Number(session.elapsed) || 0) +
        (session.running ? (now - session.startedAt) / 1000 : 0),
    ),
  );
}

export function remainingSeconds(countdown, now = Date.now()) {
  if (!countdown) return 0;
  return countdown.running
    ? Math.max(0, Math.ceil((countdown.endTimestamp - now) / 1000))
    : Math.max(
        0,
        (Number(countdown.totalSeconds) || 0) -
          (Number(countdown.elapsed) || 0),
      );
}

export function pauseCountdown(countdown, now = Date.now()) {
  countdown.elapsed = Math.max(
    0,
    countdown.totalSeconds - remainingSeconds(countdown, now),
  );
  countdown.running = false;
  countdown.endTimestamp = null;
  return countdown;
}

export function startCountdown(countdown, now = Date.now()) {
  if (!remainingSeconds(countdown, now)) countdown.elapsed = 0;
  countdown.endTimestamp = now + remainingSeconds(countdown, now) * 1000;
  countdown.running = true;
  return countdown;
}

export function formatClock(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
