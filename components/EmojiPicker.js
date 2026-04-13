"use client";

import { FEELING_EMOJIS } from "@/lib/constants";

export function EmojiPicker({ value, onChange, label = "How are you feeling?" }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {FEELING_EMOJIS.map((emoji) => {
          const selected = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              aria-pressed={selected}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-all ${
                selected
                  ? "border-teal-500 bg-teal-50 shadow-sm ring-2 ring-teal-400/40 dark:bg-teal-950"
                  : "border-zinc-200 bg-white hover:border-teal-200 dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
