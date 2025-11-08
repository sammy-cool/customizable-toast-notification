/**
 * Normalize a position string to a canonical key (id-safe, stable).
 */
export function normalizePositionKey(position: any): string;
/**
 * Canonical container id
 */
export function getContainerId(position: any): string;
/**
 * Atomically get or create a single container per canonical id.
 */
export function getOrCreateToastContainer(options: any, setPosition: any): Promise<any>;
