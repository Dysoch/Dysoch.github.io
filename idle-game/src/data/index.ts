// src/data/index.ts
import resourcesData from "./resources.json";
import generatorsData from "./generators.json";
import skillsData from "./skills.json";
import changelogData from "./changelog.json";

export type ResourceType = typeof resourcesData[number]["id"];
export type GeneratorType = typeof generatorsData[number]["id"];

export { resourcesData, generatorsData, skillsData, changelogData };
