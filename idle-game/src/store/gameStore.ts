import { create } from "zustand";
import resourcesData from "../data/resources.json";
import generatorsData from "../data/generators.json";

type ResourceType = typeof resourcesData[number]["id"];

type GameState = {
  resources: Record<ResourceType, number>;
  clickPower: Record<ResourceType, number>;
  generators: Record<string, number>; // key = generator id
  prestigePoints: number;
  addResource: (type: ResourceType, amount: number) => void;
  buyGenerator: (generatorId: string) => void;
};

export const useGameStore = create<GameState>((set, get) => {
  const initialResources: Record<ResourceType, number> = {};
  const initialClickPower: Record<ResourceType, number> = {};
  const initialGenerators: Record<string, number> = {};

  resourcesData.forEach((r) => {
    initialResources[r.id] = 0;
    initialClickPower[r.id] = r.baseClick;
  });

  generatorsData.forEach((g) => {
    initialGenerators[g.id] = 0;
  });

  return {
    resources: initialResources,
    clickPower: initialClickPower,
    generators: initialGenerators,
    prestigePoints: 0,

    addResource: (type, amount) =>
      set((state) => ({
        resources: { ...state.resources, [type]: state.resources[type] + amount },
      })),

    buyGenerator: (generatorId) => {
      const gen = generatorsData.find((g) => g.id === generatorId);
      if (!gen) return;

      const state = get();
      const owned = state.generators[generatorId] || 0;
      const cost = Math.floor(gen.baseCost * Math.pow(gen.multiplier, owned));
      const available = state.resources[gen.resource as ResourceType] || 0;

      if (available >= cost) {
        set({
          resources: {
            ...state.resources,
            [gen.resource]: available - cost,
          },
          generators: {
            ...state.generators,
            [generatorId]: owned + 1,
          },
        });
      }
    },
  };
});
