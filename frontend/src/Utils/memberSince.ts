export const formatMemberSinceDate = (dateValue?: string | Date | null): string | undefined => {
  if (!dateValue) return undefined;

  const parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsedDate);
};

export const deriveMemberSinceFromObjectId = (rawId?: string | null): string | undefined => {
  if (!rawId || !/^[a-fA-F0-9]{24}$/.test(rawId)) return undefined;

  const seconds = Number.parseInt(rawId.slice(0, 8), 16);
  if (!Number.isFinite(seconds)) return undefined;

  return new Date(seconds * 1000).toISOString();
};