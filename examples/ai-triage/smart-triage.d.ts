import type { ToastType, SoundPreset, SpringPreset, UndoOptions } from "../../dist/index.d.ts";

export interface EventPayload {
  message?: string;
  text?: string;
  title?: string;
  [key: string]: unknown;
}

export type EventInput = string | EventPayload | Record<string, unknown>;

export interface SmartToastPlan {
  message: string;
  type: ToastType;
  duration: number;
  soundPreset: SoundPreset;
  spring: SpringPreset;
  priority: number;
  sound: boolean;
  undo?: UndoOptions;
}

export interface TriageOptions {
  apiKey?: string;
  customFallback?: (event: EventInput) => SmartToastPlan;
}

export declare function classifyEventDeterministic(event: EventInput): SmartToastPlan;

export declare function triageNotification(
  event: EventInput,
  options?: TriageOptions
): Promise<SmartToastPlan>;
