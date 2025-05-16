'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleBackgroundProps {
  count?: number;
  color?: string;
  size?: number;
}

export default function ParticleBackground({ 
  count = 500, 
  color = '#9945FF', 
  size = 0.05 
}: ParticleBackgroundProps) {
  const mesh = useRef<THREE.Points>(null);
  
  // Generate particles with random positions
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 25;
      positions[i3 + 1] = (Math.random() - 0.5) * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
    }
    
    return positions;
  }, [count]);
  
  // Animate particles
  useFrame((state) => {
    if (!mesh.current) return;
    
    const time = state.clock.getElapsedTime() * 0.1;
    
    // Move particles in a wave pattern
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const array = mesh.current.geometry.attributes.position.array as Float32Array;
      array[i3 + 1] += Math.sin((time + i * 0.1) * 0.5) * 0.01;
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={mesh} rotation={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={size} 
        color={color} 
        transparent 
        opacity={0.6}
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
      />
    </points>
  );
} 