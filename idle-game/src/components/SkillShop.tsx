import { useGameStore } from "../store/gameStore";
import skillsData from "../data/skills.json";
import resourcesData from "../data/resources.json";

type ResourceType = typeof resourcesData[number]["id"];

export default function SkillShop() {
  const { skills, resources, age, days, isDead, isPaused, buySkill } = useGameStore();

  if (!skills || !resources) return <p>Loading...</p>;

  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const displayAge = 12 + years;

  if (isDead) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#ff6b6b' }}>💀 You are dead!</h2>
        <p>You cannot learn new skills while dead. Use the Rebirth button to start a new life.</p>
      </div>
    );
  }

  if (isPaused) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#f39c12' }}>⏸️ Game is paused</h2>
        <p>Click the Resume button to continue your journey.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "20px", width: '100%' }}>
      <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#333", borderRadius: "4px" }}>
        <p>⏰ Current Age: {displayAge} years, {remainingDays} days</p>
        <p>💰 Time Available: {resources.time ?? 0}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', width: '100%' }}>
        {skillsData.map((skill) => {
          const owned = skills[skill.id] ?? 0;
          const cost = Math.floor(skill.costs.baseCost * Math.pow(skill.costs.multiplier, owned));
          const timeAvailable = resources[skill.costs.resource as ResourceType] ?? 0;
          
          // Check if requirements are met
          const ageMet = displayAge >= skill.requirements.age;
          const resourceRequirementsMet = Object.entries(skill.requirements.resources).every(
            ([reqResource, reqAmount]) => (skills[reqResource] ?? 0) >= reqAmount
          );
          const canAfford = timeAvailable >= cost;
          const notMaxLevel = owned < skill.maxLevel;
          const canBuy = ageMet && resourceRequirementsMet && canAfford && notMaxLevel;

          return (
            <div key={skill.id} style={{ 
              margin: "10px 0", 
              padding: "15px", 
              backgroundColor: "#2a2a2a", 
              borderRadius: "8px",
              border: canBuy ? "2px solid #4CAF50" : "2px solid #666",
              width: '100%'
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "24px" }}>{skill.icon}</span>
                <div>
                  <h3 style={{ margin: "0 0 5px 0" }}>{skill.name}</h3>
                  <p style={{ margin: "0", color: "#ccc" }}>{skill.description}</p>
                </div>
              </div>
              
              <div style={{ marginBottom: "10px" }}>
                <p style={{ margin: "5px 0" }}>Level: {owned}/{skill.maxLevel}</p>
                <p style={{ margin: "5px 0" }}>Cost: {cost} {skill.costs.resource}</p>
                
                {skill.requirements.age > 0 && (
                  <p style={{ margin: "5px 0", color: ageMet ? "#4CAF50" : "#f44336" }}>
                    Age Required: {skill.requirements.age} {ageMet ? "✓" : "✗"}
                  </p>
                )}
                
                {Object.keys(skill.requirements.resources).length > 0 && (
                  <div>
                    <p style={{ margin: "5px 0" }}>Requirements:</p>
                    {Object.entries(skill.requirements.resources).map(([reqResource, reqAmount]) => {
                      const currentAmount = skills[reqResource] ?? 0;
                      const met = currentAmount >= reqAmount;
                      return (
                        <p key={reqResource} style={{ 
                          margin: "2px 0", 
                          color: met ? "#4CAF50" : "#f44336",
                          marginLeft: "20px"
                        }}>
                          {reqResource}: {currentAmount}/{reqAmount} {met ? "✓" : "✗"}
                        </p>
                      );
                    })}
                  </div>
                )}
                
                {skill.effects.description && (
                  <p style={{ margin: "5px 0", color: "#4CAF50" }}>
                    Effect: {skill.effects.description}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => buySkill(skill.id)}
                disabled={!canBuy}
                style={{
                  padding: "8px 16px",
                  backgroundColor: canBuy ? "#4CAF50" : "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: canBuy ? "pointer" : "not-allowed",
                  opacity: canBuy ? 1 : 0.6
                }}
              >
                {owned >= skill.maxLevel ? "Max Level" : "Learn Skill"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
