// src/store/gameStore.ts
import { create } from "zustand";
import { resourcesData, skillsData } from "../data";

const STARTING_AGE = 12;
const DAYS_PER_YEAR = 365;
const BASE_LIFESPAN = 70;

type ResourceType = typeof resourcesData[number]["id"];
type SkillId = typeof skillsData[number]["id"];

export interface GameStore {
  skills: Record<string, number>;
  resources: Record<string, number>;
  ticksLeft: number;
  rebirths: number;
  lifespan: number;
  age: number;
  days: number;
  isPaused: boolean;
  isDead: boolean;
  addResource: (type: ResourceType, amount: number) => void;
  addSkill: (type: SkillId, amount: number) => void;
  buySkill: (id: SkillId) => void;
  prestige: () => void;
  setState: (newState: Partial<GameStore>) => void;
  reset: () => void;
  togglePause: () => void;
  calculateAge: () => { years: number; days: number };
}

export const useGameStore = create<GameStore>((set, get) => ({
  skills: Object.fromEntries(skillsData.map((s) => [s.id, 0])),
  resources: Object.fromEntries(resourcesData.map((r) => [r.id, 0])),
  lifespan: BASE_LIFESPAN,
  ticksLeft: (BASE_LIFESPAN - STARTING_AGE) * DAYS_PER_YEAR,
  rebirths: 0,
  age: STARTING_AGE,
  days: 0,
  isPaused: false,
  isDead: false,

  // Add resources safely
  addResource: (type, amount) =>
    set((state) => ({
      resources: {
        ...state.resources,
        [type]: (state.resources[type] ?? 0) + amount,
      },
    })),

  // Add skills safely
  addSkill: (type, amount) =>
    set((state) => {
      if (state.isDead || state.isPaused) return state;
      
      return {
        skills: {
          ...state.skills,
          [type]: (state.skills[type] ?? 0) + amount,
        },
      };
    }),

  // Buy skill action
  buySkill: (id) => {
    const state = get();
    if (state.isDead || state.isPaused) return;

    const skill = skillsData.find((s) => s.id === id);
    if (!skill) return;

    set((state) => {
      const owned = state.skills[id] ?? 0;
      const cost = Math.floor(skill.costs.baseCost * Math.pow(skill.costs.multiplier, owned));
      const available = state.resources[skill.costs.resource as ResourceType] ?? 0;
      const currentAge = state.age;

      // Check age requirement
      if (currentAge < skill.requirements.age) return state;

      // Check resource requirements
      for (const [reqResource, reqAmount] of Object.entries(skill.requirements.resources)) {
        const currentAmount = state.skills[reqResource] ?? 0;
        if (currentAmount < reqAmount) return state;
      }

      // Check if max level reached
      if (owned >= skill.maxLevel) return state;

      // Check if can afford
      if (available < cost) return state;

      return {
        resources: { ...state.resources, [skill.costs.resource]: available - cost },
        skills: { ...state.skills, [id]: owned + 1 },
      };
    });
  },

  // Prestige / rebirth action
  prestige: () =>
    set((state) => ({
      skills: Object.fromEntries(skillsData.map((s) => [s.id, 0])),
      resources: Object.fromEntries(resourcesData.map((r) => [r.id, 0])),
      ticksLeft: (state.lifespan - STARTING_AGE) * DAYS_PER_YEAR,
      rebirths: state.rebirths + 1,
      age: STARTING_AGE,
      days: 0,
      isPaused: false,
      isDead: false,
    })),

  setState: (newState) => set(() => newState),

  reset: () =>
    set(() => ({
      skills: Object.fromEntries(skillsData.map((s) => [s.id, 0])),
      resources: Object.fromEntries(resourcesData.map((r) => [r.id, 0])),
      ticksLeft: (BASE_LIFESPAN - STARTING_AGE) * DAYS_PER_YEAR,
      rebirths: 0,
      age: STARTING_AGE,
      days: 0,
      isPaused: false,
      isDead: false,
    })),

  togglePause: () =>
    set((state) => ({
      isPaused: !state.isPaused,
    })),

  calculateAge: () => {
    const state = get();
    const totalDays = state.days;
    const years = Math.floor(totalDays / DAYS_PER_YEAR);
    const remainingDays = totalDays % DAYS_PER_YEAR;
    return { years: STARTING_AGE + years, days: remainingDays };
  },
}));
