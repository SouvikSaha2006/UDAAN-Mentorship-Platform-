export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

export function getInitials(name = 'U') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getRoleDashboardPath(role) {
  const map = {
    student: '/student/dashboard',
    mentor: '/mentor/dashboard',
    faculty: '/faculty/dashboard',
    support: '/support/dashboard',
    admin: '/admin/dashboard',
  };
  return map[role] || '/student/dashboard';
}

export function getRoleLabel(role) {
  const map = {
    student: 'Student',
    mentor: 'Mentor',
    faculty: 'Faculty Member',
    support: 'Support Coordinator',
    admin: 'College Administrator',
  };
  return map[role] || 'User';
}

export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
