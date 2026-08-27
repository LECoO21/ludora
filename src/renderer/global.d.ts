import type { LudoraApi } from '../shared/contracts';

declare global {
  interface Window {
    noobi: LudoraApi;
  }
}

export {};
