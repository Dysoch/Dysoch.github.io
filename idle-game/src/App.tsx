import { useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import resourcesData from "./data/resources.json"; 
import generatorsData from "./data/generators.json"; 
import ResourceDisplay from "./components/ResourceDisplay";
import ClickerButton from "./components/ClickerButton";
import UpgradeShop from "./components/UpgradeShop";

// Infer type from JSON
type ResourceType = typeof resourcesData[number]["id"];

// List of resources dynamically
const resources: ResourceType[] = resourcesData.map(r => r.id as ResourceType);

function App() {
  const { addResource, generators } = useGameStore();

  // Generators produce automatically every second
    useEffect(() => {
    const interval = setInterval(() => {
        generatorsData.forEach((gen) => {
        const owned = generators[gen.id] || 0;
        if (owned > 0) {
            addResource(gen.resource as ResourceType, owned); // +1 per generator per second
        }
        });
    }, 1000);
    return () => clearInterval(interval);
    }, [generators, addResource]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>⚡ Multi-Resource Idle Game</h1>
      <ResourceDisplay />
      {resources.map((type) => (
        <ClickerButton key={type} resource={type} />
      ))}
      <UpgradeShop />
    </div>
  );
}

export default App;
