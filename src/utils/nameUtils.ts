export const stripDoctorPrefix = (value: string): string => value.trim().replace(/^Dr\.\s+/u, '');
