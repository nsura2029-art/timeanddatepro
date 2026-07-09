// src/utils/apiResponse.ts
// Standard API response envelope + cache headers.

import { randomUUID } from "node:crypto";

export interface ApiMeta {
  request_id: string;
  timestamp: number;     // unix seconds
  cached: boolean;
  tz?: string;
  version: "v1";
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ApiMeta;
  errors?: Array<{ code: string; message: string; field?: string }>;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export function ok<T>(data: T, opts?: { cached?: boolean; tz?: string }): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      request_id: randomUUID(),
      timestamp: Math.floor(Date.now() / 1000),
      cached: opts?.cached ?? false,
      tz: opts?.tz,
      version: "v1",
    },
  };
}

export function fail(errors: ApiError[]): ApiResponse<null> {
  return {
    success: false,
    data: null,
    meta: {
      request_id: randomUUID(),
      timestamp: Math.floor(Date.now() / 1000),
      cached: false,
      version: "v1",
    },
    errors,
  };
}

export function cacheHeader(maxAgeSeconds: number): Record<string, string> {
  return {
    "Cache-Control": `public, max-age=${maxAgeSeconds}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}