export const getAccuracyColor = (accuracyClass?: string) => {
  switch (accuracyClass) {
    case 'excellent':
      return { backgroundColor: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' };
    case 'good':
      return { backgroundColor: 'rgba(59,130,246,0.1)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)' };
    case 'inaccuracy':
      return { backgroundColor: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)' };
    case 'mistake':
      return { backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.2)' };
    case 'blunder':
      return { backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' };
    default:
      return {};
  }
};

export const getAccuracyLabel = (accuracyClass?: string) => {
  switch (accuracyClass) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'inaccuracy':
      return 'Inaccuracy';
    case 'mistake':
      return 'Mistake';
    case 'blunder':
      return 'Blunder';
    default:
      return '';
  }
};
