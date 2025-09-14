/**
 * Normalize a position string to a canonical key (id-safe, stable).
 */
export function normalizePositionKey(position?: string): string;
/**
 * Canonical container id
 */
export function getContainerId(position?: string): string;
/**
 * Atomically get or create a single container per canonical id.
 */
export function getOrCreateToastContainer(options: {}, setPosition: any): Promise<any>;
