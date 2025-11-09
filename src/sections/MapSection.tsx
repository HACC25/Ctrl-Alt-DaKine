// @ts-nocheck
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { useEffect, useState } from 'react';

function Model() {
  const { scene } = useGLTF('src/assets/model.glb');
  
  // AI COMMENT: Ensure materials are visible
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.needsUpdate = true;
        child.castShadow = true;  // Enable shadows on model
        child.receiveShadow = true;
      }
    });
  }, [scene]);
  
  // AI COMMENT: Rotate model 90 degrees counter-clockwise (-Math.PI / 2 radians)
  return <primitive object={scene} rotation={[0, -Math.PI / 2, 0]} />;
}

// AI COMMENT: 2D button/marker that floats at specific 3D coordinates
function LocationMarker({ position, label, logo, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  // Lower the marker by adjusting Y position (index 1)
  const adjustedPosition = [position[0], position[1], position[2]];
  
  return (
    <group>
      {/* Vertical line from ground to marker */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              position[0], 0, position[2],  // Start at ground
              position[0], position[1], position[2]  // End at marker height
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#2196F3" linewidth={2} />
      </line>
      
      {/* 2D HTML marker button */}
      <Html position={adjustedPosition} center>
        <div 
          onMouseEnter={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
          onMouseLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
          onClick={onClick}
          style={{
            background: 'white',
            padding: '4px',
            borderRadius: '50%',
            cursor: 'pointer',
            border: '3px solid ' + (hovered ? '#4CAF50' : '#2196F3'),
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            transform: hovered ? 'scale(1.15)' : 'scale(1)',
            pointerEvents: 'auto',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            src={logo} 
            alt={label}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '50%'
            }}
          />
        </div>
      </Html>
    </group>
  );
}

export default function MapSection() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // AI COMMENT: Define your clickable locations here [x, y, z] coordinates
  const locations = [
    { id: 1, position: [-0.08, 0.1, -0.2], label: 'University of Hawaii at Manoa', logo: 'src/assets/uhmanoa.png', info: 'Campus' },
    { id: 2, position: [-0.3, 0.1, 0.1], label: 'Leeward Community College', logo: 'src/assets/lcc.png', info: 'Campus' },
    { id: 3, position: [-0.08, 0.15, -0.2], label: 'Honolulu Community College', logo: 'src/assets/hcc.png', info: 'Campus' },
    { id: 4, position: [-0.08, 0.05, -0.2], label: 'Kapiolani Community College', logo: 'src/assets/kcc.png', info: 'Campus' },
    { id: 5, position: [-0.06, 0.1, -0.22], label: 'Windward Community College', logo: 'src/assets/wcc.png', info: 'Campus' },
    { id: 6, position: [0.3, 0.1, -0.1], label: 'Hawaii Community College', logo: 'src/assets/hcc.png', info: 'Campus' },
    { id: 7, position: [-0.1, 0.1, 0.4], label: 'Maui Community College', logo: 'src/assets/mcc.jpg', info: 'Campus' },
    { id: 8, position: [0.4, 0.1, 0.0], label: 'Kauai Community College', logo: 'src/assets/kauaicc.jpeg', info: 'Campus' },
    { id: 9, position: [-0.4, 0.1, -0.4], label: 'University of Hawaii at West Oahu', logo: 'src/assets/uhwo.svg', info: 'Campus' },
    { id: 10, position: [0.0, 0.1, 0.0], label: 'University of Hawaii at Hilo', logo: 'src/assets/uhh.jpg', info: 'Campus' },
    // AI COMMENT: Add more locations - adjust [x, y, z] to position them correctly!
  ];
  return (
    <div className="form-section" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2rem 0' }}>
      <h2 className="section-title">Campus Map</h2>
      <p className="section-subtitle">Explore the University of Hawaii campus in 3D</p>
      
      {/* AI COMMENT: 3D canvas takes partial space, not full screen */}
      <div style={{ width: '90%', maxWidth: '1200px', height: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <Canvas shadows camera={{ position: [0, 0, 1], fov: 50 }}>
          {/* AI COMMENT: Simpler lighting to avoid weird lines/artifacts */}
          <directionalLight 
            position={[10, 15, 10]} 
            intensity={2} 
            castShadow 
            shadow-bias={-0.0001}
          />
          <hemisphereLight intensity={0.4} groundColor="#444444" />
          
          <Model />
          
          {/* AI COMMENT: Add floating 2D markers for each location */}
          {locations.map((loc) => (
            <LocationMarker
              key={loc.id}
              position={loc.position}
              label={loc.label}
              logo={loc.logo}
              onClick={() => setSelectedLocation(loc)}
            />
          ))}
          
          {/* AI COMMENT: Angled view with locked rotation - pan and zoom enabled */}
          <OrbitControls 
            enableRotate={false}
            enablePan={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 4}
            minDistance={0.3}
            maxDistance={4}
            target={[0, 0, 0]}
            enableDamping={false}
            zoomSpeed={1.5}
            panSpeed={1}
            mouseButtons={{
              LEFT: 2,  // Left click = PAN
              MIDDLE: 1, // Middle click = ZOOM
              RIGHT: 2   // Right click = PAN
            }}
          />
        </Canvas>
      </div>
      
      {/* AI COMMENT: Info panel below map when location is clicked */}
      {selectedLocation && (
        <div style={{ 
          background: 'rgba(59, 87, 55, 0.9)', 
          color: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          maxWidth: '600px',
          width: '90%'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{selectedLocation.label}</h3>
          <p style={{ margin: 0 }}>{selectedLocation.info}</p>
          <button 
            onClick={() => setSelectedLocation(null)}
            className="submit-button"
            style={{ marginTop: '10px' }}
          >
            Close
          </button>
        </div>
      )}
      
      {/* AI COMMENT: Regular content below the 3D map */}
      <div style={{ maxWidth: '800px', textAlign: 'center', color: '#ffffff' }}>
        <p>Click on blue markers to learn more. Pan by dragging. Scroll to zoom.</p>
      </div>
    </div>
  );
}