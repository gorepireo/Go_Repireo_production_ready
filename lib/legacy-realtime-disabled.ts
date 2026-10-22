/**
 * Temporary compatibility boundary for legacy WebRTC broadcast code.
 * The verified Firestore contract has no unrestricted realtime channel.
 */
const reject = async (..._args: unknown[]) => {
  throw new Error('Legacy realtime channels are disabled under the Firebase security contract.');
};

export const disabledLegacyDb = {
  realtime: {
    subscribe: reject,
    unsubscribe: (..._args: unknown[]) => undefined,
    publish: reject,
    on: (..._args: unknown[]) => undefined,
    off: (..._args: unknown[]) => undefined,
  },
  ai: { chat: { completions: { create: reject as (...args: unknown[]) => Promise<any> } } },
};
