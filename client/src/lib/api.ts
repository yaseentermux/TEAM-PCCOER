import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  error: {
    message: string;
    details?: unknown;
  };
}

/**
 * Extracts a user-friendly error message from an API error response.
 */
export function getErrorMessage(err: unknown, defaultMessage = "An error occurred"): string {
  if (axios.isAxiosError(err)) {
    const errorData = err.response?.data as ApiErrorResponse | undefined;
    if (errorData?.error?.message) {
      return errorData.error.message;
    }
    if (typeof err.response?.data?.message === "string") {
      return err.response.data.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMessage;
}
