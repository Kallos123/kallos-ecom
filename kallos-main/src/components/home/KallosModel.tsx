"use client";

import { Suspense, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';

/**
 * useGLTF returns a shared scene from cache. Mounting <primitive object={scene} /> lets R3F
 * take ownership; in React Strict Mode (or remounts) the same scene can be detached/disposed.
 * Cloning gives each mount its own object graph.
 */
function Model() {
  const { scene } = useGLTF('/kallos.glb');
  const clone = useMemo(() => scene.clone(true), [scene]);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
  }, [clone, invalidate]);

  return (
    <Center>
      <primitive object={clone} scale={82} rotation={[Math.PI / 2, 0, 0]} />
    </Center>
  );
}

function ModelFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#9f1239" wireframe />
    </mesh>
  );
}

/** After async assets (e.g. HDR) load, demand frameloop needs an explicit invalidate */
function InvalidateOnMount() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

/**
 * With frameloop="demand", autoRotate needs a steady invalidate stream until the user interrupts.
 */
function AutorotateDemandPump({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useFrame(() => {
    if (active) invalidate();
  });
  return null;
}

type HeroOrbitControlsProps = {
  interrupted: boolean;
  onInterrupt: () => void;
};

/** Slow idle turntable; stops permanently after first drag / touch / pointer down on controls */
function HeroOrbitControls({ interrupted, onInterrupt }: HeroOrbitControlsProps) {
  const invalidate = useThree((s) => s.invalidate);

  const handleStart = useCallback(() => {
    onInterrupt();
  }, [onInterrupt]);

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI - 0.08}
      autoRotate={!interrupted}
      autoRotateSpeed={2}
      onStart={handleStart}
      onChange={() => invalidate()}
    />
  );
}

export function KallosModel() {
  const [canvasKey, setCanvasKey] = useState(0);
  const [orbitInterrupted, setOrbitInterrupted] = useState(false);

  return (
    <Canvas
      key={canvasKey}
      camera={{ position: [0, 0.15, 3.35], fov: 48 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'default',
        stencil: false,
      }}
      dpr={[1, 1.5]}
      frameloop="demand"
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        const canvas = gl.domElement;
        canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
        canvas.addEventListener('webglcontextrestored', () => {
          setCanvasKey((k) => k + 1);
        });
      }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={1.5} />
      <spotLight position={[0, 5, 8]} intensity={4} color="white" />
      <pointLight position={[5, 3, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[-5, -2, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[0, 0, 5]} intensity={2} color="#ffffff" />

      <Suspense fallback={null}>
        <Environment preset="city" intensity={0.85} />
        <InvalidateOnMount />
      </Suspense>

      <Suspense fallback={<ModelFallback />}>
        <Model />
      </Suspense>

      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.35}
        scale={12}
        blur={2}
        far={5}
        frames={1}
      />

      <AutorotateDemandPump active={!orbitInterrupted} />
      <HeroOrbitControls
        interrupted={orbitInterrupted}
        onInterrupt={() => setOrbitInterrupted(true)}
      />
    </Canvas>
  );
}

useGLTF.preload('/kallos.glb');
