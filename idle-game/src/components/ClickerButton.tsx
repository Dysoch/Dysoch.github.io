import { useGameStore } from "../store/gameStore";
import resourcesData from "../data/resources.json";
import skillsData from "../data/skills.json";

type ResourceType = typeof resourcesData[number]["id"];

type ClickerProps = { resource: ResourceType };

export default function ClickerButton({ resource }: ClickerProps) {
  const { addResource, skills, isDead, isPaused } = useGameStore();

  const resData = resourcesData.find(r => r.id === resource);
  const baseClickPower = resData?.baseClick ?? 0;
  
  // Only show clicker for resources with base click power
  if (baseClickPower <= 0) return null;
  
  // Calculate total click power based on gathering skill level
  const gatheringLevel = skills.gathering ?? 0;
  const clickPower = baseClickPower + gatheringLevel;

  // Disable button if dead or paused
  const isDisabled = isDead || isPaused;

  return (
    <button
      className="btn btn-primary m-2"
      onClick={() => addResource(resource, clickPower)}
      disabled={isDisabled}
      style={{
        padding: "10px 20px",
        backgroundColor: isDisabled ? "#666" : "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontSize: "16px",
        opacity: isDisabled ? 0.6 : 1
      }}
    >
      {resData?.emoji} Gather {resData?.name} +{clickPower}
    </button>
  );
}
