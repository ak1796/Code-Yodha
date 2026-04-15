export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Basic utility to generate dummy avatars or initials
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

// Format dates nicely
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}
