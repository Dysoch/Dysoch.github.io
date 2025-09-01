import { resourcesData } from "../data";
import ClickerButton from "./ClickerButton";
import SkillShop from "./SkillShop";
import ResourceDisplay from "./ResourceDisplay";
import Changelog from "./Changelog";
import { useGameStore } from "../store/gameStore";

type TabType = 'clickers' | 'skills' | 'stats' | 'settings' | 'changelog';

interface ContentAreaProps {
  activeTab: TabType;
}

export default function ContentArea({ activeTab }: ContentAreaProps) {
  const { rebirths, isDead } = useGameStore();
  
  switch (activeTab) {
    case 'clickers':
      return (
        <div style={{ padding: '20px', width: '100%' }}>
          <h2>🖱️ Manual Gathering</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', width: '100%' }}>
            {resourcesData.map((res) => (
              <ClickerButton key={res.id} resource={res.id} />
            ))}
          </div>
        </div>
      );
      
    case 'skills':
      return (
        <div style={{ padding: '20px', width: '100%' }}>
          <h2>⚡ Skill Tree</h2>
          <SkillShop />
        </div>
      );
      
    case 'stats':
      return (
        <div style={{ padding: '20px', width: '100%' }}>
          <h2>📊 Game Statistics</h2>
          <span style={{ color: isDead ? '#ff6b6b' : 'white' }}>
            🔄 Rebirths: {rebirths}
          </span>
          <ResourceDisplay />
        </div>
      );
      
    case 'settings':
      return (
        <div style={{ padding: '20px', width: '100%' }}>
          <h2>⚙️ Game Settings</h2>
          <p>Settings will be implemented here...</p>
        </div>
      );
      
    case 'changelog':
      return <Changelog />;
      
    default:
      return <div>Select a tab</div>;
  }
}
