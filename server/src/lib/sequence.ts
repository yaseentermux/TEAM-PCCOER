export const formatNumber = (prefix: string, id: number) => `${prefix}-${String(id).padStart(5, "0")}`;
