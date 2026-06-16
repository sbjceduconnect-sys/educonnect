import dayjs from 'dayjs';

export function formatDate(date, format = 'DD MMM YYYY') {
  if (!date) return 'N/A';
  const d = date?._seconds ? new Date(date._seconds * 1000) : new Date(date);
  return dayjs(d).format(format);
}

export function formatDateTime(date) {
  return formatDate(date, 'DD MMM YYYY, hh:mm A');
}

export function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function getAttendanceColor(percentage) {
  if (percentage >= 85) return '#4CAF50';
  if (percentage >= 75) return '#FF9800';
  return '#F44336';
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
