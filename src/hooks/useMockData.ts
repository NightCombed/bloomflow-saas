import { useSyncExternalStore } from "react";
import { getMockDataSnapshot, subscribeMockData } from "@/lib/mockData";

/**
 * Subscribes to the mock data store and returns the latest snapshot version.
 * Components that read from `byStore.*` should call this so they re-render
 * whenever orders/customers/etc. change (e.g. after checkout creates a new order).
 */
export function useMockData() {
  return useSyncExternalStore(subscribeMockData, getMockDataSnapshot, getMockDataSnapshot);
}
