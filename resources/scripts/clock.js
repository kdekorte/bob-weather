/**
 * clock.js — Panel 1: live clock and date display.
 * Updates every second. No network dependency.
 */

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function tickClock() {
  const now = new Date();
  const is12h = AppConfig.timeFormat === '12h';

  let hours = now.getHours();
  let ampm = '';

  if (is12h) {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  }

  document.getElementById('clock-hours').textContent   = pad2(hours);
  document.getElementById('clock-minutes').textContent = pad2(now.getMinutes());
  document.getElementById('clock-ampm').textContent    = ampm;
  document.getElementById('clock-dayofweek').textContent = DAYS[now.getDay()];
  document.getElementById('clock-date').textContent =
    `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function initClock() {
  tickClock();
  setInterval(tickClock, 1000);
}
