"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Cpu, Zap, Activity } from "lucide-react";

export function Canvas3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Group for all rotating objects
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Sui Color Scheme Tokens
    const suiBlue = new THREE.Color("#298dff");
    const suiBlueLight = new THREE.Color("#54a6ff");
    const suiCoral = new THREE.Color("#ff3d3d");
    const deepBlack = new THREE.Color("#05070a");

    // 1. Central Quantum Vault Core (Sharp Icosahedron + Wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(1.45, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: deepBlack,
      emissive: new THREE.Color("#05162b"),
      roughness: 0.1,
      metalness: 0.95,
      transmission: 0.5,
      thickness: 1.5,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    // Outer Wireframe overlay
    const wireGeo = new THREE.IcosahedronGeometry(1.47, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: suiBlue,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    rootGroup.add(wireMesh);

    // Inner Glowing Core (Octahedron)
    const innerGeo = new THREE.OctahedronGeometry(0.75, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: suiBlueLight,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    rootGroup.add(innerMesh);

    // 2. Concentric Holographic Rings (Electric Blue & Coral Highlights)
    const rings: THREE.Mesh[] = [];
    const ringRadii = [2.1, 2.7, 3.3];
    ringRadii.forEach((radius, idx) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.018, 16, 120);
      const ringMat = new THREE.MeshStandardMaterial({
        color: idx === 1 ? suiCoral : suiBlue,
        emissive: idx === 1 ? suiCoral : suiBlue,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.85,
        transparent: true,
        opacity: 0.75,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / (2.2 + idx * 0.4);
      ring.rotation.y = (Math.PI / 3) * idx;
      rootGroup.add(ring);
      rings.push(ring);
    });

    // 3. Floating Node Proofs (Transaction Quantum Particles)
    const nodeCount = 40;
    const nodeGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: suiBlueLight,
      transparent: true,
      opacity: 0.9,
    });
    const nodesGroup = new THREE.Group();
    const nodeData: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; y: number }[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 1.9 + Math.random() * 1.6;
      const y = (Math.random() - 0.5) * 2.4;
      mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      nodesGroup.add(mesh);
      nodeData.push({
        mesh,
        angle,
        speed: (0.006 + Math.random() * 0.012) * (i % 2 === 0 ? 1 : -1),
        radius,
        y,
      });
    }
    rootGroup.add(nodesGroup);

    // 4. Background Nebula Cloud
    const particleCount = 280;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 18;
      posArray[i + 1] = (Math.random() - 0.5) * 14;
      posArray[i + 2] = (Math.random() - 0.5) * 14;

      const c = Math.random() > 0.35 ? suiBlue : Math.random() > 0.5 ? suiCoral : new THREE.Color("#f4f5f7");
      colorArray[i] = c.r;
      colorArray[i + 1] = c.g;
      colorArray[i + 2] = c.b;
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // 5. Electric Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight("#298dff", 4.5, 25);
    blueLight.position.set(4, 4, 3);
    scene.add(blueLight);

    const coralLight = new THREE.PointLight("#ff3d3d", 2.5, 20);
    coralLight.position.set(-4, -3, 2);
    scene.add(coralLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 2;
      targetY = y * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let frameCount = 0;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // FPS tracking
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      // Smooth mouse interpolation
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Rotate root based on mouse & time
      rootGroup.rotation.y = elapsedTime * 0.28 + mouseX * 0.75;
      rootGroup.rotation.x = Math.sin(elapsedTime * 0.18) * 0.15 - mouseY * 0.55;

      // Pulse Core
      const pulseScale = 1 + Math.sin(elapsedTime * 2.2) * 0.035;
      coreMesh.scale.set(pulseScale, pulseScale, pulseScale);
      wireMesh.scale.set(pulseScale * 1.01, pulseScale * 1.01, pulseScale * 1.01);
      wireMesh.rotation.y -= delta * 0.35;
      innerMesh.rotation.x += delta * 0.6;
      innerMesh.rotation.z += delta * 0.45;

      // Rotate Rings in alternating directions
      rings.forEach((ring, i) => {
        ring.rotation.z += delta * (0.25 + i * 0.18) * (i % 2 === 0 ? 1 : -1);
      });

      // Orbit Proof Nodes
      nodeData.forEach((item) => {
        item.angle += item.speed;
        item.mesh.position.x = Math.cos(item.angle) * item.radius;
        item.mesh.position.z = Math.sin(item.angle) * item.radius;
        item.mesh.position.y = item.y + Math.sin(elapsedTime * 2.2 + item.angle) * 0.18;
        item.mesh.rotation.x += 0.025;
        item.mesh.rotation.y += 0.035;
      });

      // Particle Drift
      particlesMesh.rotation.y = elapsedTime * 0.035;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[440px] lg:h-[500px] flex items-center justify-center overflow-hidden border border-border bg-[#000000]"
      style={{ borderRadius: "2px" }}
    >
      {/* Sui Technical HUD Overlay */}
      <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 border border-border bg-[#0d0f12]/90 px-3 py-1 text-xs backdrop-blur-md" style={{ borderRadius: "2px" }}>
          <span className="h-2 w-2 rounded-full bg-[#298dff] animate-pulse" />
          <span className="mono text-text-primary font-medium tracking-tight">ZK EXECUTION CORE</span>
          <span className="text-text-muted">|</span>
          <span className="mono text-[#54a6ff] text-[11px]">{fps} FPS</span>
        </div>
      </div>

      {/* Interactive indicator */}
      <div className="absolute bottom-3.5 right-3.5 z-10 hidden sm:flex items-center gap-2">
        <div className="flex items-center gap-2 border border-border bg-[#0d0f12]/90 px-3 py-1.5 text-xs text-text-secondary backdrop-blur-md" style={{ borderRadius: "2px" }}>
          <Cpu className="h-3.5 w-3.5 text-[#298dff]" />
          <span className="mono text-[11px]">3D Real-time WebGL Engine</span>
        </div>
      </div>

      {/* Status pills in the bottom left */}
      <div className="absolute bottom-3.5 left-3.5 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 border border-border bg-[#000000]/80 px-2.5 py-1 text-[11px] mono text-text-secondary" style={{ borderRadius: "2px" }}>
          <span className="text-[#298dff]">●</span> Monad Finality Sync
        </div>
        <div className="hidden md:flex items-center gap-1.5 border border-[#298dff]/30 bg-[#298dff]/10 px-2.5 py-1 text-[11px] mono text-[#54a6ff]" style={{ borderRadius: "2px" }}>
          Root: 0x42f8...9b
        </div>
      </div>

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-[#298dff]/10 via-transparent to-transparent" />
    </div>
  );
}
