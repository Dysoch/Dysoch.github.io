import changelogData from "../data/changelog.json";

export default function Changelog() {
  return (
    <div style={{ padding: '20px', width: '100%' }}>
      <h2>📝 Changelog</h2>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {changelogData.map((release, index) => (
          <div key={release.version} style={{ 
            backgroundColor: '#2a2a2a', 
            borderRadius: '8px', 
            padding: '20px', 
            marginBottom: '20px',
            border: '1px solid #444'
          }}>
            <h3 style={{ color: '#4CAF50', marginTop: '0' }}>
              v{release.version} - {release.title}
            </h3>
            <p style={{ color: '#ccc', marginBottom: '15px' }}>
              {release.description}
            </p>
            
            <h4 style={{ color: '#fff', marginBottom: '10px' }}>✨ New Features:</h4>
            <ul style={{ color: '#ccc', marginBottom: '15px' }}>
              {release.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            
            <h4 style={{ color: '#fff', marginBottom: '10px' }}>🎮 Gameplay:</h4>
            <ul style={{ color: '#ccc', marginBottom: '15px' }}>
              {release.gameplay.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            
            <h4 style={{ color: '#fff', marginBottom: '10px' }}>🔧 Technical:</h4>
            <ul style={{ color: '#ccc', marginBottom: '15px' }}>
              {release.technical.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            
            {index === 0 && (
              <div style={{ 
                backgroundColor: '#2a2a2a', 
                borderRadius: '8px', 
                padding: '20px',
                border: '1px solid #444'
              }}>
                <h4 style={{ color: '#fff', marginTop: '0', marginBottom: '10px' }}>🚧 Coming Soon:</h4>
                <ul style={{ color: '#ccc' }}>
                  {release.comingSoon.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
