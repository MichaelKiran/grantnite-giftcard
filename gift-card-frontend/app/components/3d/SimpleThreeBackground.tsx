'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SimpleThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Basic Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a14');
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add simple objects - a few cards
    const cards: THREE.Mesh[] = [];
    const createCard = (x: number, y: number, z: number, color: string) => {
      const geometry = new THREE.BoxGeometry(2, 3, 0.1);
      const material = new THREE.MeshBasicMaterial({ color });
      const card = new THREE.Mesh(geometry, material);
      card.position.set(x, y, z);
      scene.add(card);
      cards.push(card);
      return card;
    };
    
    createCard(-3, 0, -2, '#9945FF');
    createCard(3, 1, -4, '#5A5AFF');
    createCard(0, -1, -6, '#7A35FF');
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add a simple animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Gently rotate the cards
      cards.forEach((card, i) => {
        card.rotation.y += 0.002 * (i + 1);
        card.rotation.x = Math.sin(Date.now() * 0.0005 * (i + 1)) * 0.1;
        card.position.y = Math.sin(Date.now() * 0.0003 * (i + 1)) * 0.2 + card.position.y * 0.99;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);
  
  return <div ref={containerRef} className="w-full h-[70vh] absolute top-0 left-0 -z-10" />;
} 