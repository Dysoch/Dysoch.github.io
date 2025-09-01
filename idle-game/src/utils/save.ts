import type { GameStore } from "../store/gameStore";

const STORAGE_KEY = "idleGameSave";

export function saveGame(state: Partial<GameStore>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGame(): Partial<GameStore> | null {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? (JSON.parse(data) as Partial<GameStore>) : null;
}

export function exportSave(state: Partial<GameStore>): string {
  return btoa(JSON.stringify(state));
}

export function importSave(encoded: string): Partial<GameStore> | null {
  try {
    return JSON.parse(atob(encoded)) as Partial<GameStore>;
  } catch {
    return null;
  }
}
