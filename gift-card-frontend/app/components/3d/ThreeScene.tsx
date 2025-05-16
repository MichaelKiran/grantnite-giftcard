'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

// Import Three.js components dynamically to ensure client-side only rendering
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

const OrbitControls = dynamic(
  () => import('@react-three/drei').then((mod) => mod.OrbitControls),
  { ssr: false }
);

// Import FloatingCard dynamically as well
const FloatingCard = dynamic(
  () => import('./FloatingCard'),
  { ssr: false }
);

// Static fallback
const StaticBackground = () => (
  <div className="w-full h-[70vh] absolute top-0 left-0 -z-10 bg-gradient-to-b from-[#0a0a14] to-[#150b30]"></div>
);

export default function ThreeScene() {
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Only render the Three.js components on the client
  if (typeof window !== 'undefined' && !isClient) {
    // Set to true once we know we're on the client
    setIsClient(true);
  }

  // Fallback if there's an error or we're not on the client
  if (hasError || !isClient) {
    return <StaticBackground />;
  }
  
  return (
    <div className="w-full h-[70vh] absolute top-0 left-0 -z-10 overflow-hidden">
      <Canvas 
        dpr={[1, 1]} 
        shadows={false} 
        gl={{ antialias: true, alpha: false }}
        onCreated={() => { /* Do nothing on creation */ }}
        onError={() => setHasError(true)}
      >
        <color attach="background" args={['#0a0a14']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <group>
          <FloatingCard position={[-4, 1, 0]} rotation={[0, 0.5, 0.1]} />
          <FloatingCard position={[4, -1, -2]} rotation={[0.1, -0.5, -0.1]} color="#0075FF" />
          <FloatingCard position={[0, 0, -4]} scale={1.5} />
        </group>
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}