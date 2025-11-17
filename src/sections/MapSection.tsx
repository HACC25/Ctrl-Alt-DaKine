// @ts-nocheck
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import { useEffect, useState, useRef, useMemo } from 'react';
import { TextureLoader, RepeatWrapping } from 'three';
import './MapSection.css';

// Component: Loads and renders the 3D island model
function Model() {
  const { scene } = useGLTF('/assets/model2.glb');

  useEffect(() => {
    // Load water texture and apply to ocean mesh
    const textureLoader = new TextureLoader();
    const normalMap = textureLoader.load('/assets/water_normal.png');
    normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
    normalMap.repeat.set(10, 10);

    // Apply materials and shadows to all meshes
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;

        // Apply water texture to water/ocean meshes
        const materialName = child.material?.name?.toLowerCase?.() || '';
        const meshName = child.name?.toLowerCase?.() || '';
        if (meshName.includes('water') || meshName.includes('ocean') || materialName.includes('water')) {
          child.material.normalMap = normalMap;
          child.material.normalScale.set(0.05, 0.05);
          child.material.needsUpdate = true;
        }
      }

      // Configure lights from GLB file
      if (child.isLight) {
        child.castShadow = true;
        if (child.shadow) {
          child.shadow.mapSize.width = 2048;
          child.shadow.mapSize.height = 2048;
          child.shadow.bias = -0.0001;
          child.shadow.normalBias = 0.05;
        }
        if (child.intensity) {
          child.intensity = child.intensity * 0.1;
        }
      }
    });

    return () => {
      normalMap.dispose();
    };
  }, [scene]);

  return <primitive object={scene} rotation={[0, -Math.PI / 2, 0]} position={[0, 0, 0]} />;
}

// Component: Renders a clickable location marker in 3D space
function LocationMarker({ position, label, logo, onClick, isRecommended, isSelected }) {
  const [hovered, setHovered] = useState(false);
  const adjustedPosition = [position[0], position[1], position[2]];

  // Build CSS classes based on marker state
  const className = [
    'location-marker',
    hovered ? 'location-marker-hovered' : '',
    isRecommended ? 'highlighted' : '',
    isSelected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              position[0], 0, position[2],
              position[0], position[1], position[2],
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#5997507c" linewidth={2} />
      </line>

      <Html position={adjustedPosition} center>
        <div
          className={className}
          onMouseEnter={() => {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onMouseLeave={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
          onClick={onClick}
        >
          <img src={logo} alt={label} />
        </div>
      </Html>
    </group>
  );
}

// Helper: Normalize campus names for matching (lowercase, remove special chars)
function normalizeCampusName(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Main component: Campus map with 3D visualization and recommendations
export default function MapSection({ answers, onSubmit }) {
  // State for insights data from backend
  const [insights, setInsights] = useState(null);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for user interactions
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  // State for the single-campus pill choice (user-visible selection)
  const [selectedCampusChoice, setSelectedCampusChoice] = useState(null);

  // Refs for performance optimization
  const mapRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Campus locations data (coordinates and metadata)
  const locations = useMemo(
    () => [
      { id: 1, position: [-0.08, 0.45, -0.2], label: 'University of Hawaii at Manoa', campusKey: 'Manoa', logo: '/assets/uhmanoa.png' },
      { id: 2, position: [-0.12, 0.375, -0.22], label: 'Leeward Community College', campusKey: 'Leeward', logo: '/assets/lcc.png' },
      { id: 3, position: [-0.08, 0.3, -0.2], label: 'Honolulu Community College', campusKey: 'Honolulu', logo: '/assets/hcc.png' },
      { id: 4, position: [-0.08, 0.15, -0.2], label: 'Kapiolani Community College', campusKey: 'Kapiolani', logo: '/assets/kcc.png' },
      { id: 5, position: [-0.06, 0.225, -0.22], label: 'Windward Community College', campusKey: 'Windward', logo: '/assets/wcc.png' },
      { id: 6, position: [0.62, 0.3, 0.24], label: 'Hawaii Community College', campusKey: 'Hawaii Community College', logo: '/assets/hawaiicc.jpg' },
      { id: 7, position: [0.27, 0.15, -0.08], label: 'UH Maui College', campusKey: 'Maui', logo: '/assets/mcc.jpg' },
      { id: 8, position: [-0.48, 0.15, -0.37], label: 'Kauai Community College', campusKey: 'Kauai', logo: '/assets/kauaicc.jpeg' },
      { id: 9, position: [-0.13, 0.075, -0.21], label: 'UH West Oahu', campusKey: 'West Oahu', logo: '/assets/uhwo.svg' },
      { id: 10, position: [0.62, 0.15, 0.24], label: 'University of Hawaii at Hilo', campusKey: 'Hilo', logo: '/assets/uhh.jpg' },
    ],
    []
  );

  // Helper: Attach matching program data to a location
  const attachMatchData = (location) => {
    if (!location) return null;
    const key = normalizeCampusName(location.campusKey || location.label);
    const match = (insights?.allCampuses || []).find(
      (campus) => normalizeCampusName(campus.campus) === key
    );
    return { ...location, match };
  };

  // Extract user answers for API call
  const answersWhy = answers?.whyuh || '';
  const answersInterests = answers?.experiencesandinterests || answers?.interests || [];
  const answersSkills = answers?.skills || [];

  // Fetch insights from backend when answers change
  useEffect(() => {
    const controller = new AbortController();
    const payload = {
      why_uh: answersWhy || '',
      interests: Array.isArray(answersInterests) ? answersInterests : [],
      skills: Array.isArray(answersSkills) ? answersSkills : [],
      top_n: 3,
    };

    if (!payload.why_uh || payload.interests.length === 0 || payload.skills.length === 0) {
      setInsights(null);
      setWarning('');
      setError('');
      setIsLoading(false);
      setSelectedLocation(null);
      setHasManualSelection(false);
      return undefined;
    }

    setIsLoading(true);
    setError('');

    fetch('http://localhost:8000/api/map-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setInsights(data);
        setWarning(data.warning || '');
        setSelectedLocation(null);
        setHasManualSelection(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('map-insights error', err);
        setError('Unable to generate map insights right now.');
        setInsights(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [answersWhy, JSON.stringify(answersInterests), JSON.stringify(answersSkills)]);

  // Set up IntersectionObserver for performance (only render when visible)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '100px',
      }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        observer.unobserve(mapRef.current);
      }
    };
  }, []);

  // Memoized: Set of recommended campus names
  const recommendedCampusSet = useMemo(() => {
    const set = new Set();
    (insights?.campuses || []).forEach((campus) => {
      set.add(normalizeCampusName(campus.campus));
    });
    return set;
  }, [insights?.campuses]);

  // Memoized: Default spotlight campus (top recommendation)
  const defaultSpotlight = useMemo(() => {
    if (!insights) return null;
    const candidateKey = insights.selectedCampus || insights?.campuses?.[0]?.campus;
    if (!candidateKey) return null;
    const found = locations.find(
      (loc) => normalizeCampusName(loc.campusKey || loc.label) === normalizeCampusName(candidateKey)
    );
    return attachMatchData(found);
  }, [insights, locations]);

  // Current spotlight: manual selection or default recommendation
  const spotlight = selectedLocation ? attachMatchData(selectedLocation) : defaultSpotlight;
  const selectedCampusKey = spotlight ? normalizeCampusName(spotlight.campusKey || spotlight.label) : null;

  // Top 3 recommended majors and campuses
  const topMajors = Array.isArray(insights?.majors) ? insights.majors.slice(0, 3) : [];
  const campusMatches = Array.isArray(insights?.campuses) ? insights.campuses.slice(0, 3) : [];

  // Handler: User clicks a location marker
  const handleSelectLocation = (location) => {
    setSelectedLocation(attachMatchData(location));
    setHasManualSelection(true);
    const key = normalizeCampusName(location.campusKey || location.label);
    setSelectedCampusChoice(key);
  };

  // Listen for pathway-driven campus selection events (dispatched by PathwaySection)
  useEffect(() => {
    const handler = (e) => {
      try {
        const campus = e?.detail?.campus || e?.detail || e?.campus;
        if (!campus) return;
        const norm = normalizeCampusName(campus);
        const found = locations.find((loc) => normalizeCampusName(loc.campusKey || loc.label) === norm);
        if (found) {
          setSelectedLocation(attachMatchData(found));
          setHasManualSelection(true);
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('pathway:selectCampus', handler as EventListener);
    return () => window.removeEventListener('pathway:selectCampus', handler as EventListener);
  }, [locations, insights]);

  return (
    <div className="form-section" ref={mapRef}>
      <h2 className="section-title">Campus Map</h2>

      {warning && (
        <div className="pill map-warning">
          <span className="map-warning-text">{warning}</span>
        </div>
      )}

      <div className="map-container">
        <div className="map-info-row">
          <div className="map-info-box map-spotlight">
            <h3>🏫 Campus Spotlight</h3>
            <div className="map-info-scroll">
              {isLoading ? (
                <p className="map-loading">Gathering recommendations…</p>
              ) : error ? (
                <p className="map-error">{error}</p>
              ) : spotlight ? (
                <>
                  <div className="map-spotlight-header">
                    <h4>{spotlight.label}</h4>
                    {recommendedCampusSet.has(selectedCampusKey) && <span className="map-pill">Recommended</span>}
                  </div>
                  {spotlight.match ? (
                    <div className="map-info-meta">
                      {spotlight.match.matched?.length ? (
                        <p>Matches your majors: {spotlight.match.matched.join(', ')}</p>
                      ) : (
                        <p>No direct program matches yet, but this campus is still a strong fit.</p>
                      )}
                      {spotlight.match.missing?.length ? (
                        <p className="map-faded">Missing majors: {spotlight.match.missing.join(', ')}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="map-info-meta">Click a marker to learn more about that campus.</p>
                  )}
                  {hasManualSelection && (
                    <button
                      className="map-clear-button"
                      onClick={() => {
                        setSelectedLocation(null);
                        setHasManualSelection(false);
                      }}
                    >
                      Back to top campus
                    </button>
                  )}
                </>
              ) : (
                <p className="map-info-meta">Complete the previous steps to unlock campus recommendations.</p>
              )}
            </div>
          </div>

          <div className="map-info-box map-majors">
            <h3>🎓 Top Majors</h3>
            <div className="map-info-scroll">
              {isLoading ? (
                <p className="map-loading">Analyzing your inputs…</p>
              ) : topMajors.length ? (
                <ul className="map-major-list">
                  {topMajors.map((major, index) => (
                    <li key={major.name || index} className="map-major-item">
                      <span className="map-rank">#{index + 1}</span>
                      <div>
                        <strong>{major.name}</strong>
                        {major.why && <p className="map-faded">{major.why}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="map-info-meta">We will recommend majors once you share all your inputs.</p>
              )}
            </div>
          </div>

          <div className="map-info-box map-campuses">
            <h3>🗺️ Pick Recommended Campuses</h3>
            <div className="map-info-scroll">
              {isLoading ? (
                <p className="map-loading">Pairing majors with campuses…</p>
              ) : campusMatches.length ? (
                <div className="map-campus-list">
                  {campusMatches.map((campus, index) => {
                    const campusKey = normalizeCampusName(campus.campus);
                    const correspondingLocation = locations.find(
                      (loc) => normalizeCampusName(loc.campusKey || loc.label) === campusKey
                    );
                    // Use the explicit single-choice state if set; otherwise fall back to current spotlight
                    const isActive = (selectedCampusChoice ? selectedCampusChoice === campusKey : selectedCampusKey === campusKey);
                    return (
                      <button
                        key={campus.campus || index}
                        type="button"
                        className={`map-campus-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          if (correspondingLocation) {
                            handleSelectLocation(correspondingLocation);
                            // set the single-select pill
                            setSelectedCampusChoice(campusKey);
                          }
                        }}
                      >
                        <div className="map-campus-rank">#{index + 1}</div>
                        <div className="map-campus-details">
                          <strong>{campus.campus}</strong>
                          {campus.matched?.length ? (
                            <p className="map-faded">Matches: {campus.matched.join(', ')}</p>
                          ) : (
                            <p className="map-faded">No direct matches, but worth exploring.</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="map-info-meta">Once majors are ready, we will highlight the best UH campuses for you.</p>
              )}
            </div>
          </div>
        </div>

        {/* warning now shown under the title */}

        <div className="map-canvas-wrapper">
          <Canvas
            shadows
            camera={{ position: [0.12360127385682014, 0.8887651965204771, 0.8926238354483005], fov: 50 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            dpr={[1, 1.5]}
            frameloop={isVisible ? 'always' : 'never'}
          >
            <fog attach="fog" args={['#87CEEB', 0.1, 6]} />

            <Environment files="/assets/sky.exr" background={false} environmentIntensity={2} />

            <Model />

            {(insights && campusMatches.length > 0 ? locations.filter((loc) => {
              // If we have AI campus matches, show only those recommended OR the selected one
              const campusKey = normalizeCampusName(loc.campusKey || loc.label);
              // respect the explicit single-select pill choice when present
              if (selectedCampusChoice) return campusKey === selectedCampusChoice || recommendedCampusSet.has(campusKey);
              return (
                recommendedCampusSet.has(campusKey) ||
                (selectedCampusKey && campusKey === selectedCampusKey)
              );
            }) : locations).map((loc) => {
              const campusKey = normalizeCampusName(loc.campusKey || loc.label);
              return (
                <LocationMarker
                  key={loc.id}
                  position={loc.position}
                  label={loc.label}
                  logo={loc.logo}
                  onClick={() => handleSelectLocation(loc)}
                  isRecommended={recommendedCampusSet.has(campusKey)}
                  isSelected={(selectedCampusChoice ? selectedCampusChoice === campusKey : selectedCampusKey === campusKey)}
                />
              );
            })}

            <OrbitControls
              enableRotate={false}
              enablePan
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 4}
              minDistance={0.3}
              maxDistance={4}
              target={[0.12360127385682014, 0, 0]}
              enableDamping={false}
              zoomSpeed={1.5}
              panSpeed={1}
              mouseButtons={{ LEFT: 2, MIDDLE: 1, RIGHT: 2 }}
            />
          </Canvas>
        </div>
      </div>

      <div className="map-instructions">
        <p>Click markers to compare campuses. Pan by dragging. Scroll to zoom.</p>
        <div style={{ marginTop: '0.75rem' }}>
          <button
            className="submit-button map-submit-fixed"
            onClick={() => {
              if (!insights || isLoading) return;
              // request pathway to play its animation; PathwaySection listens for this event
              window.dispatchEvent(new Event('pathway:play'));
              // Resolve the selected college from the explicit pill choice, then fallback to spotlight
              const selectedKey = selectedCampusChoice || selectedCampusKey || (insights?.selectedCampus && normalizeCampusName(insights.selectedCampus));
              const selectedLocationObj = locations.find((loc) => normalizeCampusName(loc.campusKey || loc.label) === selectedKey);
              const selectedCollegeLabel = selectedLocationObj ? selectedLocationObj.label : (insights?.selectedCampus || null);
              const submission = {
                ...insights,
                selectedCollege: selectedCollegeLabel,
                selectedCollegeKey: selectedKey,
              };
              // notify parent (App) so it can save insights and scroll to the pathway
              if (typeof onSubmit === 'function') onSubmit(submission);
            }}
            disabled={isLoading || !insights}
          >
            Submit Campus Choice
          </button>
        </div>
      </div>
    </div>
  );
}
