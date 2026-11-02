"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  Sparkles,
  Torus,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

// ── Lab UI components ──────────────────────────────────────────────────────
import LabHeader from "./components/LabHeader";
import Dashboard from "./components/Dashboard";
import Exp01Inspection from "./components/Exp01Inspection";
import Exp02Energy from "./components/Exp02Energy";
import Exp03Moth from "./components/Exp03Moth";
import LabReport from "./components/LabReport";
import { INSPECTION_ITEMS } from "./lab-data";
import type { LabView, InspectionItem } from "./lab-types";

// ── Detect mobile viewport ─────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ── Level floor data (still used for 3D camera labels) ────────────────────
const floors = [
  {
    id: 1,
    title: "THE MECHANICAL SHELL",
    subtitle: "LEVEL 01 / EXTERIOR SYSTEM",
    description: "The outer structure protects the unknown technology hidden inside the laboratory.",
    color: "#64748b",
  },
  {
    id: 2,
    title: "THE LIVING ENGINE",
    subtitle: "LEVEL 02 / ENERGY SYSTEM",
    description: "An interconnected energy network powers the mysterious central reactor.",
    color: "#06b6d4",
  },
  {
    id: 3,
    title: "THE MOTH CORE",
    subtitle: "LEVEL 03 / SPECIMEN CHAMBER",
    description: "An unidentified mechanical organism has awakened inside the machine.",
    color: "#a78bfa",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3-D COMPONENTS — unchanged from original
// ═══════════════════════════════════════════════════════════════════════════

function CameraRig({
  active,
  controls,
  isMobile,
}: {
  active: number;
  controls: React.RefObject<OrbitControlsImpl | null>;
  isMobile: boolean;
}) {
  const { camera } = useThree();

  const positions = isMobile
    ? [
        new THREE.Vector3(0, 3, 26),
        new THREE.Vector3(0, 5, 26),
        new THREE.Vector3(0, 7, 24),
      ]
    : [
        new THREE.Vector3(10, 5, 13),
        new THREE.Vector3(10, 7, 13),
        new THREE.Vector3(8, 8, 11),
      ];

  const targets = isMobile
    ? [
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 3, 0),
        new THREE.Vector3(0, 5, 0),
      ]
    : [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 2.7, 0),
        new THREE.Vector3(0, 5.2, 0),
      ];

  useFrame(() => {
    const index = active - 1;
    camera.position.lerp(positions[index], 0.035);
    if (controls.current) {
      controls.current.target.lerp(targets[index], 0.035);
      controls.current.update();
    }
  });

  return null;
}

function RotatingReactor() {
  const reactor = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (reactor.current) reactor.current.rotation.y += delta * 0.22;
    if (core.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.09;
      core.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={reactor} position={[0, 2.8, 0]}>
      <Torus args={[1.65, 0.035, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={2} />
      </Torus>
      <Torus args={[1.3, 0.045, 16, 100]} rotation={[0.8, 0.3, 0.4]}>
        <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={2} />
      </Torus>
      <Torus args={[1.9, 0.025, 16, 100]} rotation={[0.3, 1, 0.8]}>
        <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.5} />
      </Torus>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.65, 2]} />
        <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={4} metalness={0.5} roughness={0.15} />
      </mesh>
      <pointLight color="#06b6d4" intensity={18} distance={8} />
    </group>
  );
}

function MechanicalMoth({ onDiscover }: { onDiscover: () => void }) {
  const moth = useRef<THREE.Group>(null);
  const upperLeft = useRef<THREE.Group>(null);
  const upperRight = useRef<THREE.Group>(null);
  const lowerLeft = useRef<THREE.Group>(null);
  const lowerRight = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (moth.current) {
      moth.current.position.y = 5.4 + Math.sin(t * 1.4) * 0.13;
      moth.current.rotation.y = Math.sin(t * 0.45) * 0.15;
    }
    const flap = Math.sin(t * 7) * 0.55;
    if (upperLeft.current) upperLeft.current.rotation.y = -flap;
    if (upperRight.current) upperRight.current.rotation.y = flap;
    if (lowerLeft.current) lowerLeft.current.rotation.y = flap * 0.65;
    if (lowerRight.current) lowerRight.current.rotation.y = -flap * 0.65;
  });

  const wingMaterial = (
    <meshStandardMaterial
      color="#a5f3fc" emissive="#0891b2" emissiveIntensity={1.3}
      metalness={0.7} roughness={0.2} transparent opacity={0.8} side={THREE.DoubleSide}
    />
  );

  return (
    <Float speed={1.4} floatIntensity={0.2}>
      <group ref={moth} position={[0, 5.4, 0]}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onDiscover(); }}
          onPointerOver={() => { document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "auto"; }}
        >
          <capsuleGeometry args={[0.16, 0.9, 8, 16]} />
          <meshStandardMaterial color="#cbd5e1" emissive="#64748b" emissiveIntensity={0.7} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.58, 0]} onClick={(e) => { e.stopPropagation(); onDiscover(); }}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={3} />
        </mesh>
        <mesh position={[-0.12, 0.62, 0.15]}><sphereGeometry args={[0.055, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0.12, 0.62, 0.15]}><sphereGeometry args={[0.055, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[-0.1, 0.87, 0]} rotation={[0, 0, -0.4]}><cylinderGeometry args={[0.012, 0.025, 0.35, 8]} /><meshStandardMaterial color="#67e8f9" /></mesh>
        <mesh position={[0.1, 0.87, 0]} rotation={[0, 0, 0.4]}><cylinderGeometry args={[0.012, 0.025, 0.35, 8]} /><meshStandardMaterial color="#67e8f9" /></mesh>
        <group ref={upperLeft} position={[-0.12, 0.25, 0]}>
          <mesh position={[-0.65, 0.12, 0]} rotation={[0, 0, 0.2]} onClick={(e) => { e.stopPropagation(); onDiscover(); }}>
            <sphereGeometry args={[0.78, 24, 16]} />{wingMaterial}
          </mesh>
          <mesh position={[-0.65, 0.12, 0.04]}><sphereGeometry args={[0.42, 16, 12]} /><meshBasicMaterial color="#22d3ee" wireframe /></mesh>
        </group>
        <group ref={upperRight} position={[0.12, 0.25, 0]}>
          <mesh position={[0.65, 0.12, 0]} rotation={[0, 0, -0.2]} onClick={(e) => { e.stopPropagation(); onDiscover(); }}>
            <sphereGeometry args={[0.78, 24, 16]} />{wingMaterial}
          </mesh>
          <mesh position={[0.65, 0.12, 0.04]}><sphereGeometry args={[0.42, 16, 12]} /><meshBasicMaterial color="#22d3ee" wireframe /></mesh>
        </group>
        <group ref={lowerLeft} position={[-0.1, -0.15, 0]}>
          <mesh position={[-0.45, -0.5, 0]} rotation={[0, 0, 0.5]} onClick={(e) => { e.stopPropagation(); onDiscover(); }}>
            <sphereGeometry args={[0.48, 20, 14]} />{wingMaterial}
          </mesh>
        </group>
        <group ref={lowerRight} position={[0.1, -0.15, 0]}>
          <mesh position={[0.45, -0.5, 0]} rotation={[0, 0, -0.5]} onClick={(e) => { e.stopPropagation(); onDiscover(); }}>
            <sphereGeometry args={[0.48, 20, 14]} />{wingMaterial}
          </mesh>
        </group>
        <pointLight color="#22d3ee" intensity={4} distance={4} />
      </group>
    </Float>
  );
}

function EnergyParticles() {
  const particles = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (particles.current) particles.current.rotation.y += delta * 0.15; });
  return (
    <group ref={particles} position={[0, 2.8, 0]}>
      <Sparkles count={100} scale={[5, 5, 5]} size={3} speed={0.5} color="#22d3ee" />
    </group>
  );
}

function IndustrialColumn({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.11, 0.16, 6.3, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, -2.5 + i, 0]}>
          <torusGeometry args={[0.17, 0.025, 8, 24]} />
          <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}

function MechanicalShellDetails() {
  return (
    <group position={[0, 0, 0]}>
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 4.85, 1.1, Math.sin(angle) * 4.85]} rotation={[0, -angle, 0]}>
            <mesh><boxGeometry args={[0.55, 2.1, 0.18]} /><meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} /></mesh>
            <mesh position={[0, 0.75, 0.12]}><boxGeometry args={[0.3, 0.06, 0.04]} /><meshBasicMaterial color="#f59e0b" /></mesh>
          </group>
        );
      })}
      {[-2.8, 2.8].map((x) => (
        <group key={x} position={[x, 1.8, 0]}>
          <mesh><cylinderGeometry args={[0.13, 0.18, 0.45, 16]} /><meshStandardMaterial color="#475569" metalness={0.8} /></mesh>
          <mesh position={[0, 0.28, 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3} /></mesh>
          <pointLight color="#f59e0b" intensity={1.5} distance={2} />
        </group>
      ))}
    </group>
  );
}

function LivingEngineDetails() {
  return (
    <group position={[0, 2.8, 0]}>
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 3.1;
        const z = Math.sin(angle) * 3.1;
        return (
          <group key={i} position={[x, 0.5, z]}>
            <mesh><cylinderGeometry args={[0.48, 0.55, 1.3, 24]} /><meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} /></mesh>
            <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.3, 0.3, 0.08, 24]} /><meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3} /></mesh>
            <Torus args={[0.57, 0.035, 8, 32]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={2} /></Torus>
            <pointLight color="#06b6d4" intensity={2} distance={2.5} />
          </group>
        );
      })}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[1.6, 0.45, 0]}><cylinderGeometry args={[0.055, 0.055, 2.2, 12]} /><meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={2} metalness={0.8} /></mesh>
          </group>
        );
      })}
      <Torus args={[2.25, 0.045, 12, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={3} />
      </Torus>
    </group>
  );
}

function MothContainmentChamber() {
  return (
    <group position={[0, 5.6, 0]}>
      <mesh>
        <cylinderGeometry args={[2.4, 2.4, 2.7, 48, 1, true]} />
        <meshPhysicalMaterial color="#67e8f9" transparent opacity={0.09} roughness={0.08} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {[-1.35, 1.35].map((y) => (
        <Torus key={y} args={[2.4, 0.055, 12, 64]} position={[0, y, 0]}>
          <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2} metalness={0.8} />
        </Torus>
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 2.4, 0, Math.sin(angle) * 2.4]}>
            <cylinderGeometry args={[0.035, 0.035, 2.7, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
        );
      })}
      <pointLight color="#a78bfa" intensity={3} distance={6} />
    </group>
  );
}

function EnergyTransmission() {
  const energyOrbs = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    energyOrbs.current.forEach((orb, i) => {
      if (!orb) return;
      const progress = (time * 0.8 + i * 0.65) % 4.8;
      orb.position.y = -2.4 + progress;
    });
  });
  return (
    <group position={[0, 2.8, 0]}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 2.8;
        const z = Math.sin(angle) * 2.8;
        return (
          <group key={i}>
            <mesh position={[x, 0, z]}>
              <cylinderGeometry args={[0.035, 0.035, 4.8, 10]} />
              <meshStandardMaterial color="#0891b2" emissive="#06b6d4" emissiveIntensity={2} transparent opacity={0.65} />
            </mesh>
            <mesh ref={(el) => { if (el) energyOrbs.current[i] = el; }} position={[x, -2.4, z]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#22d3ee" emissiveIntensity={5} />
            </mesh>
          </group>
        );
      })}
      <Sparkles count={45} scale={[6, 5, 6]} size={2} speed={1} color="#22d3ee" />
    </group>
  );
}

function Laboratory({
  active,
  onDiscover,
  isMobile,
}: {
  active: number;
  onDiscover: () => void;
  isMobile: boolean;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  return (
    <>
      <color attach="background" args={["#050914"]} />
      <fog attach="fog" args={["#050914", 13, 27]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 8]} intensity={1.8} />
      <pointLight position={[0, 6, 0]} color="#0891b2" intensity={8} />
      <pointLight position={[-5, 2, 4]} color="#4f46e5" intensity={4} />
      <CameraRig active={active} controls={controls} isMobile={isMobile} />
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[5.3, 5.5, 0.5, 64]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.51, 0]}>
        <cylinderGeometry args={[5.5, 5.5, 0.08, 64]} />
        <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={1.5} />
      </mesh>
      {[0, 2.8, 5.6].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <cylinderGeometry args={[4.7, 4.7, 0.2, 64]} />
            <meshStandardMaterial color={i === 2 ? "#172554" : "#172033"} metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <torusGeometry args={[4.55, 0.035, 12, 100]} />
            <meshStandardMaterial
              color={i === active - 1 ? "#22d3ee" : "#334155"}
              emissive={i === active - 1 ? "#0891b2" : "#000000"}
              emissiveIntensity={2}
            />
          </mesh>
          {Array.from({ length: 8 }).map((_, j) => {
            const angle = (j / 8) * Math.PI * 2;
            return (
              <group key={j} position={[Math.cos(angle) * 3.65, 0.25, Math.sin(angle) * 3.65]}>
                <mesh><boxGeometry args={[0.65, 0.45, 0.65]} /><meshStandardMaterial color="#334155" metalness={0.8} roughness={0.35} /></mesh>
                <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.3, 0.04, 0.3]} /><meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={2} /></mesh>
              </group>
            );
          })}
        </group>
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return <IndustrialColumn key={i} position={[Math.cos(angle) * 4.35, 2.8, Math.sin(angle) * 4.35]} />;
      })}
      <MechanicalShellDetails />
      <LivingEngineDetails />
      <MothContainmentChamber />
      <group position={[0, 2.8, 0]}>
        <mesh>
          <cylinderGeometry args={[2.15, 2.15, 2.3, 48, 1, true]} />
          <meshStandardMaterial color="#164e63" metalness={0.7} roughness={0.3} transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
        <RotatingReactor />
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 2.5, 2.8, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 2.5, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
      <MechanicalMoth onDiscover={onDiscover} />
      <EnergyParticles />
      <EnergyTransmission />
      <Sparkles count={65} scale={[10, 8, 10]} size={2} speed={0.3} color="#67e8f9" />
      <OrbitControls
        ref={controls}
        enableDamping dampingFactor={0.06} enablePan={false}
        minDistance={6} maxDistance={19}
        maxPolarAngle={Math.PI / 2.05} minPolarAngle={0.15}
      />
    </>
  );
}

// ── Discovery Panel (original specimen record, shown outside Exp03) ────────
function DiscoveryPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-5">
      <div className="relative w-full max-w-lg overflow-y-auto overflow-x-hidden border border-cyan-400/40 bg-[#071321]/95 p-5 shadow-[0_0_70px_rgba(34,211,238,0.15)] [max-height:90dvh] sm:p-6 md:p-9">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
        <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-2xl text-gray-400 transition hover:text-white sm:right-5 sm:top-5" aria-label="Close">×</button>
        <p className="text-[10px] tracking-[0.4em] text-cyan-400">CLASSIFIED SPECIMEN RECORD / M-001</p>
        <h2 className="mt-4 text-2xl font-black tracking-wider sm:mt-5 sm:text-3xl md:text-4xl">
          THE UNKNOWN<br /><span className="text-cyan-400">ORGANISM.</span>
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-400 sm:mt-4">
          An unidentified mechanical lifeform discovered inside the central reactor. Its biological structure appears to respond to the machine&apos;s energy network.
        </p>
        <div className="my-5 h-px bg-cyan-400/20 sm:my-7" />
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <div><p className="text-[9px] tracking-widest text-gray-500">CLASSIFICATION</p><p className="mt-2 text-sm font-semibold text-white">Mechanical Organism</p></div>
          <div><p className="text-[9px] tracking-widest text-gray-500">SPECIMEN ID</p><p className="mt-2 text-sm font-semibold text-cyan-300">M-001</p></div>
          <div><p className="text-[9px] tracking-widest text-gray-500">CORE ENERGY</p><p className="mt-2 text-lg font-bold text-cyan-300">98.7%</p></div>
          <div><p className="text-[9px] tracking-widest text-gray-500">WING ACTIVITY</p><p className="mt-2 text-sm font-semibold text-emerald-400">ACTIVE</p></div>
        </div>
        <div className="mt-5 border border-red-400/30 bg-red-400/5 p-3 sm:mt-7 sm:p-4">
          <p className="text-[9px] tracking-[0.3em] text-red-400">CONTAINMENT WARNING</p>
          <p className="mt-2 text-xs leading-5 text-gray-300">Specimen activity is increasing. Energy fluctuations detected inside the central chamber. Maintain observation.</p>
        </div>
        <button onClick={onClose} className="mt-5 w-full border border-cyan-400/50 bg-cyan-400/10 py-3 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20 sm:mt-7">
          RETURN TO LABORATORY →
        </button>
        <p className="mt-4 text-center text-[8px] tracking-[0.3em] text-gray-600">RESTRICTED RESEARCH DIVISION · ACCESS LEVEL 03</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME — Lab state machine
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  const isMobile = useIsMobile();

  // Intro screen
  const [showIntro, setShowIntro] = useState(true);

  // Lab navigation
  const [labView, setLabView] = useState<LabView>("dashboard");

  // 3D camera level
  const [active, setActive] = useState(1);

  // Exp 01 — Inspection
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>(
    INSPECTION_ITEMS.map((i) => ({ ...i }))
  );
  const [exp01Complete, setExp01Complete] = useState(false);

  // ── Exp 02 — Energy
  const [reactorOnline, setReactorOnline] = useState(false);
  const [reactorPower, setReactorPower] = useState(0);
  const [peakReactorPower, setPeakReactorPower] = useState(0); // preserved for report
  const [exp02Complete, setExp02Complete] = useState(false);

  // Exp 03 — Moth
  const [scanStarted, setScanStarted] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [mothDiscovered, setMothDiscovered] = useState(false);
  const [exp03Complete, setExp03Complete] = useState(false);

  // Discovery panel (moth click outside Exp03)
  const [showDiscovery, setShowDiscovery] = useState(false);

  // Reactor power ramp
  useEffect(() => {
    if (!reactorOnline) { setReactorPower(0); return; }
    const id = setInterval(() => {
      setReactorPower((p) => {
        const next = p + (Math.random() * 2 + 0.5);
        const capped = next >= 98.7 ? 98.7 : next;
        // Track the highest value reached for the report
        setPeakReactorPower((prev) => (capped > prev ? capped : prev));
        return capped;
      });
    }, 150);
    return () => clearInterval(id);
  }, [reactorOnline]);

  // Scan progress ticker
  useEffect(() => {
    if (!scanStarted || scanProgress >= 100) return;
    const id = setInterval(() => {
      setScanProgress((p) => {
        const next = p + (Math.random() * 1.5 + 0.5);
        return next >= 100 ? 100 : next;
      });
    }, 120);
    return () => clearInterval(id);
  }, [scanStarted, scanProgress]);

  // Auto-navigate 3D camera when entering an experiment
  useEffect(() => {
    if (labView === "exp01") setActive(1);
    if (labView === "exp02") setActive(2);
    if (labView === "exp03") setActive(3);
  }, [labView]);

  // Keyboard shortcuts (preserved)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setShowDiscovery(false); setLabView("dashboard"); return; }
      if (e.key === "Enter" && showIntro) { setShowIntro(false); return; }
      if (showIntro) return;
      if (e.key === "1") setActive(1);
      if (e.key === "2") setActive(2);
      if (e.key === "3") setActive(3);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntro]);

  function handleToggleInspection(id: string) {
    setInspectionItems((items) =>
      items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  }

  function handleMothInteraction() {
    setMothDiscovered(true);
    if (labView !== "exp03") setShowDiscovery(true);
  }

  const currentFloor = floors[active - 1];

  function renderLabPanel() {
    switch (labView) {
      case "dashboard":
        return (
          <Dashboard
            exp01Complete={exp01Complete}
            exp02Complete={exp02Complete}
            exp03Complete={exp03Complete}
            onStart={(v) => setLabView(v)}
          />
        );
      case "exp01":
        return (
          <Exp01Inspection
            items={inspectionItems}
            onToggle={handleToggleInspection}
            onComplete={() => { setExp01Complete(true); setLabView("dashboard"); }}
            onBack={() => setLabView("dashboard")}
          />
        );
      case "exp02":
        return (
          <Exp02Energy
            reactorOnline={reactorOnline}
            reactorPower={reactorPower}
            onToggleReactor={() => setReactorOnline((v) => !v)}
            onComplete={() => { setExp02Complete(true); setLabView("dashboard"); }}
            onBack={() => setLabView("dashboard")}
            isComplete={exp02Complete}
          />
        );
      case "exp03":
        return (
          <Exp03Moth
            scanStarted={scanStarted}
            scanProgress={scanProgress}
            mothDiscovered={mothDiscovered}
            isComplete={exp03Complete}
            onStartScan={() => setScanStarted(true)}
            onComplete={() => { setExp03Complete(true); setLabView("dashboard"); }}
            onBack={() => setLabView("dashboard")}
          />
        );
      case "report":
        return (
          <LabReport
            inspectionItems={inspectionItems}
            reactorPower={peakReactorPower}
            onBack={() => setLabView("dashboard")}
          />
        );
    }
  }

  return (
    <main data-print-ancestor className="relative h-[100dvh] w-full overflow-hidden bg-[#050914] text-white print:hidden md:h-screen">

      {/* ── Cinematic Intro ─────────────────────────────────────────────── */}
      {showIntro && (
        <div className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-[#030712]">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="relative z-10 w-full px-6 text-center sm:max-w-3xl sm:px-5">
            <p className="animate-pulse text-[10px] tracking-[0.35em] text-cyan-400 sm:tracking-[0.55em] md:text-xs">
              CLASSIFIED RESEARCH FACILITY · 2049
            </p>
            <div className="mx-auto my-6 h-px w-24 bg-cyan-400/70 sm:my-8" />
            <h1 className="text-3xl font-black leading-tight tracking-[0.08em] sm:text-5xl sm:tracking-[0.12em] md:text-7xl">
              THE MOTH<br /><span className="text-cyan-400">IN THE MACHINE</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-xs leading-7 tracking-wider text-gray-400 sm:mt-7 md:text-sm">
              THREE LEVELS. ONE UNKNOWN ORGANISM.<br />A MACHINE THAT HAS LEARNED TO LIVE.
            </p>
            <div className="my-7 flex items-center justify-center gap-3 sm:my-10">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              <span className="text-[9px] tracking-[0.4em] text-cyan-300">SYSTEMS ONLINE</span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            </div>
            <button
              onClick={() => setShowIntro(false)}
              className="border border-cyan-400/60 bg-cyan-400/10 px-8 py-4 text-[10px] font-bold tracking-[0.25em] text-cyan-300 transition duration-300 hover:scale-105 hover:bg-cyan-400/25 hover:shadow-[0_0_35px_rgba(34,211,238,0.25)] sm:px-10 sm:tracking-[0.35em]"
            >
              ENTER LABORATORY →
            </button>
            <p className="mt-6 text-[8px] tracking-[0.3em] text-gray-600 sm:mt-8">AUTHORIZED ACCESS ONLY · LEVEL 03</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (< md)
          Rows: header | 3D canvas (42%) | lab panel (scrollable)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex h-full flex-col md:hidden print:hidden">

        {/* Mobile Header */}
        <LabHeader
          view={labView}
          exp01Complete={exp01Complete}
          exp02Complete={exp02Complete}
          exp03Complete={exp03Complete}
          onNav={setLabView}
        />

        {/* Mobile 3D Canvas — fixed 42% height */}
        <div className="relative shrink-0" style={{ height: "42%" }}>
          <Canvas camera={{ position: [0, 3, 26], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
            <Laboratory active={active} onDiscover={handleMothInteraction} isMobile={true} />
          </Canvas>

          {/* Level selector overlaid on canvas */}
          <div className="pointer-events-auto absolute bottom-2 left-1/2 z-10 flex w-[calc(100%-24px)] -translate-x-1/2 gap-1.5">
            {floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setActive(floor.id)}
                className={`min-h-[36px] min-w-0 flex-1 border px-2 py-1.5 text-left backdrop-blur-md transition-all duration-300 ${
                  active === floor.id
                    ? "border-cyan-400 bg-cyan-400/20"
                    : "border-white/10 bg-black/50"
                }`}
              >
                <span className={`block truncate text-[7px] tracking-wide ${active === floor.id ? "text-cyan-300" : "text-gray-500"}`}>
                  LVL 0{floor.id}
                </span>
                <span className="mt-0.5 block truncate text-[7px] font-bold text-white">
                  {floor.id === 1 ? "SHELL" : floor.id === 2 ? "ENGINE" : "MOTH"}
                </span>
              </button>
            ))}
          </div>

          {/* TAP MOTH hint */}
          <div className="pointer-events-none absolute right-6 top-1/2 z-10 -translate-y-1/2 text-right">
            <p className="text-[7px] leading-4 tracking-widest text-cyan-400/50">TAP<br />MOTH</p>
          </div>
        </div>

        {/* Mobile Lab Panel — scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#050914]">
          {renderLabPanel()}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (≥ md)
          Header full-width | Body: 3D canvas (left) + lab panel (right)
      ══════════════════════════════════════════════════════════════════ */}
      <div data-print-ancestor className="hidden h-full flex-col md:flex print:hidden">

        {/* Desktop Header */}
        <LabHeader
          view={labView}
          exp01Complete={exp01Complete}
          exp02Complete={exp02Complete}
          exp03Complete={exp03Complete}
          onNav={setLabView}
        />

        {/* Desktop Body */}
        <div data-print-ancestor className="flex min-h-0 flex-1">

          {/* Left: 3D Laboratory */}
          <div className="relative min-h-0 flex-1">
            <Canvas camera={{ position: [8, 8, 11], fov: 45 }} dpr={[1, 1.7]} gl={{ antialias: true, alpha: false }}>
              <Laboratory active={active} onDiscover={handleMothInteraction} isMobile={false} />
            </Canvas>

            {/* Current level info — top left overlay */}
            <div className="pointer-events-none absolute left-8 top-8 z-10 max-w-xs">
              <p className="text-[9px] tracking-[0.4em] text-cyan-400">{currentFloor.subtitle}</p>
              <h2 className="mt-2 text-2xl font-black leading-tight tracking-wider lg:text-3xl">{currentFloor.title}</h2>
              <p className="mt-2 text-xs leading-5 text-gray-400">{currentFloor.description}</p>
            </div>

            {/* Level nav — bottom centre */}
            <nav className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => setActive(floor.id)}
                  className={`min-w-[120px] border px-4 py-3 text-left backdrop-blur-md transition-all duration-300 ${
                    active === floor.id
                      ? "border-cyan-400 bg-cyan-400/15 shadow-[0_0_25px_rgba(6,182,212,0.15)]"
                      : "border-white/10 bg-black/40 hover:border-white/40"
                  }`}
                >
                  <span className={`block text-[9px] tracking-widest ${active === floor.id ? "text-cyan-300" : "text-gray-500"}`}>
                    LEVEL 0{floor.id}
                  </span>
                  <span className="mt-0.5 block text-[9px] font-bold tracking-wider text-white">
                    {floor.id === 1 ? "SHELL" : floor.id === 2 ? "ENGINE" : "MOTH CORE"}
                  </span>
                </button>
              ))}
            </nav>

            {/* Interaction hint — bottom right */}
            <div className="pointer-events-none absolute bottom-6 right-5 z-10 text-right">
              <p className="text-[9px] tracking-widest text-gray-500">INTERACTION</p>
              <p className="mt-1 text-[9px] text-gray-400">DRAG · SCROLL · CLICK MOTH</p>
            </div>
          </div>

          {/* Right: Lab Panel */}
          <div data-print-ancestor className="flex w-[380px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-[#050914]/95 xl:w-[440px]">
            {renderLabPanel()}
          </div>
        </div>
      </div>

      {/* Discovery Panel — shown when moth clicked outside Exp03 */}
      {showDiscovery && (
        <DiscoveryPanel onClose={() => setShowDiscovery(false)} />
      )}
    </main>
  );
}
