import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import type { ScheduleStop } from '../data/manoaMapData';
import { getBuildingById } from '../data/manoaMapData';
import type { BuildingFootprint, RoadPath } from '../data/manoaCampusGeometry';
import { buildingFootprints, campusRoadLoops, campusCarRoute } from '../data/manoaCampusGeometry';
import './ManoaMap3D.css';

type ManoaMap3DProps = {
  schedule: ScheduleStop[];
};

const BASE_HEIGHT = 1.6;

// If you want to render the real UH Mānoa mesh instead of block buildings, import
// `useGLTF` from `@react-three/drei`, drop your .glb/.gltf file in `src/assets`, and
// call `const campus = useGLTF('/assets/uh-manoa.glb');` inside this component. You
// can then render `<primitive object={campus.scene} />` inside the Canvas (ideally
// wrapped in a <group> so you can reposition/scale it). Keep the existing schedule
// markers so the path still renders on top of the imported model.

export default function ManoaMap3D({ schedule }: ManoaMap3DProps) {
  const buildingColors = useMemo(() => {
    const map = new Map<string, string>();
    schedule.forEach((stop) => {
      if (!map.has(stop.buildingId)) {
        map.set(stop.buildingId, stop.color);
      }
    });
    return map;
  }, [schedule]);

  const pathPoints = useMemo(
    () =>
      schedule.map((stop) => [stop.position[0], BASE_HEIGHT + 6, stop.position[1]] as [number, number, number]),
    [schedule]
  );

  return (
    <div className="uh-map-canvas">
      {schedule.length ? (
        <Canvas camera={{ position: [0, 70, 110], fov: 42 }} shadows>
          {/* Larger orbiting canvas so the map can sit front-and-center on the slide */}
          <color attach="background" args={[ '#041423' ]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[40, 80, 30]} intensity={0.8} castShadow />
          <hemisphereLight args={[ '#5eead4', '#020617', 0.25 ]} />
          <OrbitControls
            enablePan
            enableRotate
            maxPolarAngle={Math.PI / 2.4}
            minPolarAngle={Math.PI / 4}
            minDistance={55}
            maxDistance={150}
          />

          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[260, 260]} />
            <meshStandardMaterial color="#05192b" />
          </mesh>

          <gridHelper args={[220, 22, '#0f172a', '#0f172a']} position={[0, BASE_HEIGHT, 0]} />

          {buildingFootprints.map((footprint: BuildingFootprint) => {
            const highlight = buildingColors.get(footprint.id);
            return (
              <mesh
                key={`footprint-${footprint.id}`}
                position={[footprint.center[0], footprint.height / 2, footprint.center[1]]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[footprint.size[0], footprint.height, footprint.size[1]]} />
                <meshStandardMaterial
                  color={highlight || footprint.color}
                  emissive={highlight || '#0f172a'}
                  emissiveIntensity={highlight ? 0.35 : 0.08}
                  roughness={0.45}
                  metalness={0.15}
                />
              </mesh>
            );
          })}

          {campusRoadLoops.map((loop: RoadPath, index: number) => (
            <RoadMesh key={`road-${index}`} path={loop} width={index === 0 ? 1.6 : 1} color="#22c55e" />
          ))}

          <Line
            points={campusCarRoute.map(([x, z]: [number, number]) => [x, BASE_HEIGHT + 0.4, z])}
            color="#86efac"
            lineWidth={2}
            dashed={false}
            opacity={0.9}
          />

          {schedule.map((stop, index) => {
            const building = getBuildingById(stop.buildingId);
            const markerHeight = building.height + 2.5;
            return (
              <group key={`marker-${stop.id}`}>
                <mesh position={[stop.position[0], markerHeight, stop.position[1]]} castShadow>
                  <sphereGeometry args={[1.5, 28, 28]} />
                  <meshStandardMaterial
                    color={stop.color}
                    emissive={stop.color}
                    emissiveIntensity={0.55}
                  />
                </mesh>
                <Html
                  position={[stop.position[0], markerHeight + 6, stop.position[1]]}
                  className="uh-map-pin"
                  center
                  distanceFactor={20}
                >
                  <span className="uh-map-pin-time">{stop.startTime}</span>
                  <strong>{stop.code}</strong>
                  <p>{stop.buildingName}</p>
                  {index < schedule.length - 1 && (
                    <span className="uh-map-pin-travel">→ {schedule[index + 1].buildingName}</span>
                  )}
                </Html>
              </group>
            );
          })}

          {pathPoints.length > 1 && (
            <Line
              points={pathPoints}
              color="#facc15"
              lineWidth={2}
              dashed={false}
              transparent
              opacity={0.85}
            />
          )}
        </Canvas>
      ) : (
        <div className="uh-map-empty">
          <p>Select a major to load the first-semester map.</p>
        </div>
      )}
    </div>
  );
}

type RoadMeshProps = {
  path: RoadPath;
  width?: number;
  color?: string;
};

function RoadMesh({ path, width = 1.2, color = '#22c55e' }: RoadMeshProps) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(
      path.map(([x, z]: [number, number]) => new Vector3(x, BASE_HEIGHT + 0.15, z)),
      true
    );
    return new TubeGeometry(curve, 200, width, 16, true);
  }, [path, width]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        roughness={0.35}
        metalness={0.15}
      />
    </mesh>
  );
}
