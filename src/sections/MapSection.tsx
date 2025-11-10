// @ts-nocheck
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { TextureLoader, RepeatWrapping } from 'three';

function Model() {
  const { scene } = useGLTF('src/assets/model2.glb');
  
  // Ensure materials are visible and apply normal map to water
  useEffect(() => {
    // Load the normal map texture for water
    const textureLoader = new TextureLoader();
    const normalMap = textureLoader.load('src/assets/water_normal.png');
    
    // Make it tile/repeat across the large ocean surface
    normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
    normalMap.repeat.set(10, 10); // Adjust these numbers to control tiling size
    
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.needsUpdate = true;
        child.castShadow = true;  // Enable shadows on model
        child.receiveShadow = true;
        
        // Apply normal map to water mesh - adjust the name to match your mesh
        // Check console to see mesh names: console.log('Mesh:', child.name)
        if (child.name.toLowerCase().includes('water') || 
            child.name.toLowerCase().includes('ocean') ||
            child.material.name.toLowerCase().includes('water')) {
          child.material.normalMap = normalMap;
          child.material.normalScale.set(0.01, 0.01); // Adjust intensity (0-1)
          child.material.needsUpdate = true;
          console.log('Applied normal map to:', child.name);
        }
      }
    });
  }, [scene]);
  
  // Rotate model 90 degrees counter-clockwise (-Math.PI / 2 radians)
  return <primitive object={scene} rotation={[0, -Math.PI / 2, 0]} />;
}

// 2D button/marker that floats at specific 3D coordinates
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
  
  // Locations of each campus
  const locations = [
    { id: 1, position: [-0.08, 0.1, -0.2], label: 'University of Hawaii at Manoa', logo: 'src/assets/uhmanoa.png', info: 'Campus' },
    { id: 2, position: [-0.12, 0.17, -0.22], label: 'Leeward Community College', logo: 'src/assets/lcc.png', info: 'Campus' },
    { id: 3, position: [-0.08, 0.15, -0.2], label: 'Honolulu Community College', logo: 'src/assets/hcc.png', info: 'Campus' },
    { id: 4, position: [-0.08, 0.05, -0.2], label: 'Kapiolani Community College', logo: 'src/assets/kcc.png', info: 'Campus' },
    { id: 5, position: [-0.06, 0.1, -0.22], label: 'Windward Community College', logo: 'src/assets/wcc.png', info: 'Campus' },
    { id: 6, position: [0.62, 0.1, 0.24], label: 'Hawaii Community College', logo: 'src/assets/hawaiicc.jpg', info: 'Campus' },
    { id: 7, position: [0.27, 0.1, -0.08], label: 'Maui College', logo: 'src/assets/mcc.jpg', info: 'Campus' },
    { id: 8, position: [-0.48, 0.1, -0.37], label: 'Kauai Community College', logo: 'src/assets/kauaicc.jpeg', info: 'Campus' },
    { id: 9, position: [-0.13, 0.07, -0.21], label: 'University of Hawaii at West Oahu', logo: 'src/assets/uhwo.svg', info: 'Campus' },
    { id: 10, position: [0.62, 0.15, 0.24], label: 'University of Hawaii at Hilo', logo: 'src/assets/uhh.jpg', info: 'Campus' },
  ];
  return (
    <div className="form-section" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2rem 0' }}>
      <h2 className="section-title">Campus Map</h2>
      <p className="section-subtitle">Explore the University of Hawaii campus in 3D</p>
      
      {/* Canvas of the map */}
      <div style={{ width: '90%', maxWidth: '1200px', height: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <Canvas shadows camera={{ position: [0, 0, 1], fov: 50 }}>
          {/* HDRI environment provides all lighting and reflections */}
          <Environment
            files="src/assets/sky.exr"
            background={false}
          />
          
          <Model />

          {/* Add floating 2D markers for each location */}
          {locations.map((loc) => (
            <LocationMarker
              key={loc.id}
              position={loc.position}
              label={loc.label}
              logo={loc.logo}
              onClick={() => setSelectedLocation(loc)}
            />
          ))}
          {/* Angled view with locked rotation - pan and zoom enabled */}
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

      {/* Info panel below map when location is clicked */}
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

      {/* Regular content below the 3D map */}
      <div style={{ maxWidth: '800px', textAlign: 'center', color: '#ffffff' }}>
        <p>Click on blue markers to learn more. Pan by dragging. Scroll to zoom.</p>
      </div>
    </div>
  );
}