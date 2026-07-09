// src/types/sportEvent.ts
// Type for major sporting events used by the events/news section.

export type SportEventCategory =
  | "football"      // soccer
  | "american-football"
  | "basketball"
  | "baseball"
  | "tennis"
  | "cricket"
  | "rugby"
  | "olympics"
  | "racing"
  | "other";

export type SportEventStatus = "upcoming" | "live" | "completed" | "postponed";

export interface SportEvent {
  /** unique slug */
  id: string;
  /** human-readable name */
  name: string;
  category: SportEventCategory;
  /** venue name */
  venue: string;
  /** host city */
  city: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  /** IANA timezone */
  timezone: string;
  /** ISO 8601 UTC start time */
  startUtc: string;
  /** ISO 8601 UTC end time (optional) */
  endUtc?: string;
  status: SportEventStatus;
  urls: {
    official?: string;
    wiki?: string;
  };
  /** search/filter tags */
  tags: string[];
}