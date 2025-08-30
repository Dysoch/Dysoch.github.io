import { useGameStore } from "../store/gameStore";
import resourcesData from "../data/resources.json";
import generatorsData from "../data/generators.json";

type ResourceType = typeof resourcesData[number]["id"];

export default function ResourceDisplay() {
  const { resources, generators, prestigePoints } = useGameStore();

  return (
    <div className="container mt-4">
      <div className="row">
        {resourcesData.map((r) => {
          const type = r.id as ResourceType;
          const gensForResource = generatorsData.filter((g) => g.resource === type);

          return (
            <div className="col-md-4 mb-3" key={type}>
              <div className="card text-center">
                <div className="card-header">{r.emoji} {r.name}</div>
                <div className="card-body">
                  <h5 className="card-title">{resources[type]}</h5>
                  {gensForResource.map((g) => (
                    <p key={g.id}>{g.name} - Owned: {generators[g.id] || 0}</p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3">✨ Prestige Points: {prestigePoints}</p>
    </div>
  );
}
