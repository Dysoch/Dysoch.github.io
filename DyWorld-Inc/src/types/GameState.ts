export interface GameState {
  generators: { [key: string]: number };
  resources: { [key: string]: number };
  ticksLeft: number;
  rebirths: number;
}
