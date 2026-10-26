/**
 * Temporary compatibility boundary for legacy WebRTC broadcast code.
 * The verified Firestore contract has no unrestricted realtime channel.
 */
const noop = async (..._args: unknown[]) => undefined;

export const disabledLegacyDb = {
  realtime: {
    subscribe: noop,
    unsubscribe: (..._args: unknown[]) => undefined,
    publish: noop,
    on: (..._args: unknown[]) => undefined,
    off: (..._args: unknown[]) => undefined,
  },
  ai: { chat: { completions: { create: (async () => ({})) as (...args: unknown[]) => Promise<any> } } },
};
