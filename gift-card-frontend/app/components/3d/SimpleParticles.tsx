'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SimpleParticlesProps {
  count?: number;
  color?: string;
}

export default function SimpleParticles({ 
  count = 200, 
  color = '#9945FF'
}: SimpleParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create particles geometry
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];
    
    for (let i = 0; i < count; i++) {
      // Position particles in a sphere
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      vertices.push(x, y, z);
      
      // Random sizes
      sizes.push(Math.random() * 0.5 + 0.5);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    return geometry;
  }, [count]);
  
  // Create shader material for better looking particles
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        void main() {
          vec3 pos = position;
          // Simple animation - move particles slightly based on time
          pos.y += sin(time * 0.2 + pos.x * 0.5) * 0.2;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * 3.0;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          // Create circular particles
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float radius = length(xy);
          float alpha = smoothstep(0.5, 0.4, radius);
          
          gl_FragColor = vec4(color, alpha * 0.5);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }, [color]);
  
  // Animate particles
  useFrame((state) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });
  
  return (
    <points ref={pointsRef} geometry={particlesGeometry} material={shaderMaterial} />
  );
} 