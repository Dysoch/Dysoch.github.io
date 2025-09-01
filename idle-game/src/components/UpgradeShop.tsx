import { useGameStore } from "../store/gameStore";
import generatorsData from "../data/generators.json";
import resourcesData from "../data/resources.json";

type ResourceType = typeof resourcesData[number]["id"];

export default function UpgradeShop() {
  const { generators, resources, buyGenerator } = useGameStore();

  if (!generators || !resources) return <p>Loading...</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Upgrade Shop</h3>
      {generatorsData.map((gen) => {
        const owned = generators[gen.id] ?? 0;
        const cost = Math.floor(gen.baseCost * Math.pow(gen.multiplier, owned));
        const resourceAvailable = resources[gen.resource as ResourceType] ?? 0;

        return (
          <button
            key={gen.id}
            onClick={() => buyGenerator(gen.id)}
            disabled={resourceAvailable < cost}
            style={{ display: "block", margin: "5px 0" }}
          >
            Buy {gen.name} ({gen.resource}) - Cost: {cost}
          </button>
        );
      })}
    </div>
  );
}
