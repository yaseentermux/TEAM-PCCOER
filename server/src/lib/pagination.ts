export function parsePagination(q: { page?: unknown; limit?: unknown }) {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export const paged = <T>(data: T[], total: number, page: number, limit: number) =>
  ({ data, meta: { page, limit, total } });
