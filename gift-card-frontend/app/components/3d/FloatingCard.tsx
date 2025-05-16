'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingCardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
}

export default function FloatingCard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = '#9945FF', // Solana purple
}: FloatingCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Animation parameters - use references to avoid rerenders
  const floatSpeed = useRef(0.5 + Math.random() * 0.5);
  const initialY = useRef(position[1]); // Store initial Y position
  const time = useRef(Math.random() * 100); // Random start time
  
  // Simple animation without state changes
  useFrame(() => {
    if (!meshRef.current) return;
    
    time.current += 0.01;
    
    // Gentle floating motion
    const newY = initialY.current + Math.sin(time.current * floatSpeed.current) * 0.3;
    meshRef.current.position.y = newY;
    
    // Gentle rotation
    meshRef.current.rotation.x = Math.sin(time.current * 0.3) * 0.05;
    meshRef.current.rotation.y += 0.005;
    meshRef.current.rotation.z = Math.sin(time.current * 0.2) * 0.05;
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1], position[2]]}
      rotation={rotation as [number, number, number]}
      scale={[scale, scale, scale]}
    >
      <boxGeometry args={[2, 3, 0.1]} /> {/* Card-like proportions */}
      <meshStandardMaterial 
        color={color}
        metalness={0.2}
        roughness={0.1}
      />
      
      {/* Simple embellishment */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[1.8, 0.8]} />
        <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
      </mesh>
    </mesh>
  );
} 