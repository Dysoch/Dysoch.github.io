import { useGameStore } from "../store/gameStore";
import resourcesData from "../data/resources.json";

type ResourceType = typeof resourcesData[number]["id"];

type ClickerProps = { resource: ResourceType };

export default function ClickerButton({ resource }: ClickerProps) {
  const { clickPower, addResource } = useGameStore();

  return (
    <button
      className="btn btn-primary m-2"
      onClick={() => addResource(resource, clickPower[resource])}
    >
      Click {resource} +{clickPower[resource]}
    </button>
  );
}
