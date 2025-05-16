'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function VanillaThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Setup Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a14');
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Create gift cards
    const createCard = (x: number, y: number, z: number, color: string) => {
      // Card body
      const cardGeometry = new THREE.BoxGeometry(2, 3, 0.1);
      const cardMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        metalness: 0.2,
        roughness: 0.1
      });
      const card = new THREE.Mesh(cardGeometry, cardMaterial);
      card.position.set(x, y, z);
      
      // Card embellishment
      const embellishmentGeometry = new THREE.PlaneGeometry(1.8, 0.8);
      const embellishmentMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.1 
      });
      const embellishment = new THREE.Mesh(embellishmentGeometry, embellishmentMaterial);
      embellishment.position.set(0, 0, 0.06);
      card.add(embellishment);
      
      scene.add(card);
      return card;
    };
    
    // Create cards
    const cards = [
      createCard(-4, 1, 0, '#9945FF'),
      createCard(4, -1, -2, '#0075FF'),
      createCard(0, 0, -4, '#9945FF')
    ];
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    // Simple camera rotation animation
    const clock = new THREE.Clock();
    let initialCameraPositions = cards.map(card => ({
      x: card.position.x,
      y: card.position.y,
      z: card.position.z
    }));
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      const elapsed = clock.getElapsedTime();
      
      // Rotate camera around the center slightly
      const radius = 12;
      const cameraSpeed = 0.1;
      camera.position.x = Math.sin(elapsed * cameraSpeed) * radius;
      camera.position.z = Math.cos(elapsed * cameraSpeed) * radius;
      camera.lookAt(0, 0, 0);
      
      // Gently animate the cards
      cards.forEach((card, i) => {
        const initialY = initialCameraPositions[i].y;
        card.position.y = initialY + Math.sin(elapsed * 0.5 + i) * 0.3;
        card.rotation.x = Math.sin(elapsed * 0.3 + i) * 0.1;
        card.rotation.y += 0.005;
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
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js resources
      renderer.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          }
        }
      });
    };
  }, []);
  
  return <div ref={containerRef} className="w-full h-[70vh] absolute top-0 left-0 -z-10" />;
} 