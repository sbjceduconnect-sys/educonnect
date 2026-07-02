import dayjs from 'dayjs';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return 'N/A';
  const d = date?._seconds ? new Date(date._seconds * 1000) : new Date(date);
  return dayjs(d).format(format);
}

export function formatDateTime(date) {
  return formatDate(date, 'DD/MM/YYYY, hh:mm A');
}

export function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

export function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  try {
    const origin = new URL(apiUrl).origin;
    const cleanPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `${origin}${cleanPath}`;
  } catch (e) {
    const origin = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    const cleanPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `${origin}${cleanPath}`;
  }
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getMimeType(filename, defaultMime = 'application/octet-stream') {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'txt': return 'text/plain';
    case 'csv': return 'text/csv';
    case 'zip': return 'application/zip';
    default:
      return (!defaultMime || defaultMime === 'application/octet-stream') ? 'application/pdf' : defaultMime;
  }
}

export async function downloadBlob(blob, filename) {
  const sizeKB = (blob.size / 1024).toFixed(1);
  
  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Convert Blob to base64 string
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            const base64 = result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('FileReader result is not a string'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      // 2. Write file natively to app Cache folder
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });

      // 3. Read header for diagnostic check
      let header = '';
      try {
        const check = await Filesystem.readFile({
          path: filename,
          directory: Directory.Cache,
          encoding: 'utf8'
        });
        header = check.data.substring(0, 15);
      } catch (readErr) {
        header = 'Read failed';
      }

      toast.success(`Saved: ${filename} (${sizeKB} KB) | Sharing...`, { duration: 4000 });

      // 4. Share/Save the file natively using Share plugin
      await Share.share({
        title: filename,
        url: writeResult.uri,
        dialogTitle: 'Save or Share File'
      });
    } catch (err) {
      console.error('[EduConnect Download Error]', err);
      toast.error(`Download failed: ${err.message || String(err)}`);
    }
  } else {
    // Web Fallback
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 150);
  }
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

export function formatTime12Hour(timeStr) {
  if (!timeStr) return 'N/A';
  if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}
