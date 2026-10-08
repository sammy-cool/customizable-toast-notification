import type { ToastType, SoundPreset, SpringPreset, UndoOptions } from "../../dist/index.d.ts";

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
  customFallback?: (event: string | object) => SmartToastPlan;
}

export declare function classifyEventDeterministic(event: string | object): SmartToastPlan;

export declare function triageNotification(
  event: string | object,
  options?: TriageOptions
): Promise<SmartToastPlan>;
