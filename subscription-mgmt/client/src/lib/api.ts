// LOCAL ONLY stand-in for M1's lib/api.ts (same interface: axios instance + getErrorMessage).
import axios from "axios";

export const api = axios.create({ baseURL: "/api", withCredentials: true });

export function getErrorMessage(e: unknown) {
  if (axios.isAxiosError(e)) return e.response?.data?.error?.message ?? e.message;
  return e instanceof Error ? e.message : "Something went wrong";
}
