export const APP_NAME = 'DyAdventure'
export const APP_VERSION = '0.1.1'

export const TICK_MS = 100
export const STATE_SYNC_MS = 250
export const SAVE_DEBOUNCE_MS = 5000
export const MAX_OFFLINE_SIMULATED_MS = 48 * 60 * 60 * 1000

export const GEAR_SLOTS_PHYSICAL = ['weapon', 'armor', 'boots', 'gloves'] as const
export const GEAR_SLOTS_ARCANE = ['focusItem', 'robe', 'amulet', 'ring'] as const
export const GEAR_SLOTS_UNIVERSAL = ['trinket1', 'trinket2'] as const

export const BASE_HP_CAP = 100
export const HP_REGEN_PCT_PER_SEC = 0.02
export const FAINT_RECOVERY_THRESHOLD_PCT = 0.3

export const SPEED_COOLDOWN_FACTOR = 0.01
export const MANUAL_TRIGGER_DAMAGE_MULTIPLIER = 1.5
export const GRIT_DEFENSE_FACTOR = 0.01
