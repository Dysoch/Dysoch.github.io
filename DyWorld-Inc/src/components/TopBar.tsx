import { useGameStore } from "../store/gameStore";
import { saveGame, loadGame, exportSave, importSave } from "../utils/save";
import { useState } from "react";

export default function TopBar() {
  const { lifespan, days, isPaused, isDead, togglePause, prestige } = useGameStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = () => {
    const exported = exportSave(useGameStore.getState());
    const textarea = document.createElement('textarea');
    textarea.value = exported;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Save data copied to clipboard!');
    setShowDropdown(false);
  };

  const handleImport = () => {
    const encoded = prompt("Paste your save data:");
    if (encoded) {
      const imported = importSave(encoded);
      if (imported) useGameStore.getState().setState(imported);
    }
    setShowDropdown(false);
  };

  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const displayAge = 12 + years;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      backgroundColor: isDead ? '#8B0000' : '#2a2a2a',
      borderBottom: '1px solid #444',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ color: isDead ? '#ff6b6b' : 'white' }}>
          ⏰ Age: {displayAge} years, {remainingDays} days
        </span>
        <span style={{ color: isDead ? '#ff6b6b' : 'white' }}>
          💀 Lifespan: {lifespan} years
        </span>
        {isDead && (
          <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
            💀 YOU ARE DEAD
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        <span style={{ 
          color: '#888', 
          fontSize: '12px', 
          marginLeft: '20px',
          fontFamily: 'monospace'
        }}>
          v0.0.1
        </span>

        {!isDead && (
          <button 
            onClick={togglePause}
            style={{
              backgroundColor: isPaused ? '#f39c12' : '#27ae60',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
        )}
        
        {isDead && (
          <button 
            onClick={prestige}
            style={{
              backgroundColor: '#e74c3c',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Rebirth
          </button>
        )}
        
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              backgroundColor: '#444',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💾 Save/Load
          </button>
          
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '8px 0',
              minWidth: '150px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
              <button 
                onClick={() => { saveGame(useGameStore.getState()); setShowDropdown(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                💾 Save
              </button>
              <button 
                onClick={() => { 
                  const loaded = loadGame(); 
                  if (loaded) useGameStore.getState().setState(loaded);
                  setShowDropdown(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                📂 Load
              </button>
              <button 
                onClick={handleExport}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                📤 Export
              </button>
              <button 
                onClick={handleImport}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                📥 Import
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
