// src/App.tsx
import "./App.css";
import { useEffect, useState } from "react";
import { useGameStore } from "./store/gameStore";
import { resourcesData, skillsData } from "./data";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import ContentArea from "./components/ContentArea";

const TICK_INTERVAL = 1000;

type TabType = 'clickers' | 'skills' | 'stats' | 'settings' | 'changelog';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('clickers');

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      
      // Don't progress if paused or dead
      if (state.isPaused || state.isDead) return;

      // Age progression (each tick = 1 day)
      const newDays = state.days + 1;
      const { years, days } = useGameStore.getState().calculateAge();
      
      // Check if dead
      const isDead = years >= state.lifespan;

      // Skill-based resource generation
      Object.entries(state.skills ?? {}).forEach(([skillId, level]) => {
        if (level > 0) {
          const skill = skillsData.find((s) => s.id === skillId);
          if (skill && skill.effects.generates) {
            Object.entries(skill.effects.generates).forEach(([resource, amount]) => {
              const totalAmount = (amount as number) * level;
              useGameStore.getState().addResource(resource as any, totalAmount);
            });
          }
        }
      });

      // Update state with new age and death status
      const next = { 
        ...useGameStore.getState(), 
        days: newDays,
        age: years,
        isDead: isDead
      };

      // If dead, don't allow further progression
      if (isDead) {
        useGameStore.getState().setState?.(next);
        return;
      }

      // Rebirth check (when lifespan is reached)
      if (years >= state.lifespan) {
        useGameStore.getState().prestige(); // reset state safely
      } else {
        useGameStore.getState().setState?.(next); // use optional chaining
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <TopBar />
      <SideBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{
        position: 'absolute',
        left: '200px',
        top: '60px',
        right: '0',
        bottom: '0',
        overflow: 'auto',
        backgroundColor: '#1e1e1e'
      }}>
        <ContentArea activeTab={activeTab} />
      </div>
    </div>
  );
}

export default App;
