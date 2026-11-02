"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Torus } from "@react-three/drei";
import * as THREE from "three";

import GameHUD from "./components/GameHUD";
import MissionModal from "./components/MissionModal";
import LabReport from "./components/LabReport";

import {
  INSPECTION_ITEMS,
  INSPECTION_POINTS,
  REACTOR_TARGET_POWER,
  REACTOR_BONUS_POINTS,
  SCAN_ANOMALY_POINTS,
  MOTH_CONTACT_POINTS,
  SCAN_COMPLETE_POINTS,
  FACILITY_INTERACTABLES,
} from "./lab-data";
import type { InspectionItem, FeedbackEvent, MissionIndex, FacilityInteractable } from "./lab-types";

// ─────────────────────────────────────────────────────────────────────────────
// Collision helpers
// ─────────────────────────────────────────────────────────────────────────────

interface WallBox { minX: number; maxX: number; minZ: number; maxZ: number; }

const INTERIOR_WALLS: WallBox[] = [
  // Zone-1 to Zone-2 separator walls with gaps at x ∈ [-6,-4] and [4,6]
  { minX: -19, maxX: -6,  minZ: 2,   maxZ: 4   },
  { minX:   6, maxX:  19, minZ: 2,   maxZ: 4   },
  // Zone-2 rear walls with gap in centre
  { minX: -19, maxX: -8,  minZ: -8,  maxZ: -6  },
  { minX:   8, maxX:  19, minZ: -8,  maxZ: -6  },
  // Zone-3 entry arch – gap at x ∈ [-3,3]
  { minX: -19, maxX: -3,  minZ: -14, maxZ: -12 },
  { minX:   3, maxX:  19, minZ: -14, maxZ: -12 },
];

const MACHINE_RADIUS = 5.8;
const PLAYER_RADIUS  = 0.45;

function resolveCollision(next: THREE.Vector3): THREE.Vector3 {
  const r = PLAYER_RADIUS;
  const result = next.clone();

  // 1. Outer facility boundary
  result.x = Math.max(-18.5, Math.min(18.5, result.x));
  result.z = Math.max(-27.5, Math.min(13.5, result.z));

  // 2. Central machine cylinder
  const distSq = result.x * result.x + result.z * result.z;
  if (distSq < (MACHINE_RADIUS + r) * (MACHINE_RADIUS + r)) {
    const dist = Math.sqrt(distSq) || 0.001;
    const push = MACHINE_RADIUS + r;
    result.x = (result.x / dist) * push;
    result.z = (result.z / dist) * push;
  }

  // 3. Interior wall AABB push-out
  for (const wall of INTERIOR_WALLS) {
    if (
      result.x + r > wall.minX && result.x - r < wall.maxX &&
      result.z + r > wall.minZ && result.z - r < wall.maxZ
    ) {
      const ox0 = result.x + r - wall.minX; // from minX side
      const ox1 = wall.maxX - (result.x - r); // from maxX side
      const oz0 = result.z + r - wall.minZ;
      const oz1 = wall.maxZ - (result.z - r);
      const min = Math.min(ox0, ox1, oz0, oz1);
      if (min === ox0) result.x = wall.minX - r;
      else if (min === ox1) result.x = wall.maxX + r;
      else if (min === oz0) result.z = wall.minZ - r;
      else result.z = wall.maxZ + r;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// detect mobile
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// First-person controller (lives inside Canvas)
// ─────────────────────────────────────────────────────────────────────────────
function FirstPersonController({
  playerPos,
  modalOpen,
  onPointerLockChange,
  isMobile,
  touchMoveRef,
  touchLookRef,
}: {
  playerPos: React.RefObject<THREE.Vector3>;
  modalOpen: boolean;
  onPointerLockChange: (locked: boolean) => void;
  isMobile: boolean;
  touchMoveRef: React.RefObject<{ x: number; y: number }>;
  touchLookRef: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();
  const yaw   = useRef(0);
  const pitch = useRef(-0.1);
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef(new Set<string>());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const lockedRef = useRef(false);

  useEffect(() => {
    // Set initial camera position
    camera.position.copy(playerPos.current!);

    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const canvasEl = canvas as HTMLCanvasElement;

    // Pointer lock handlers
    function onPLChange() {
      const locked = document.pointerLockElement === canvasEl;
      lockedRef.current = locked;
      onPointerLockChange(locked);
      document.body.classList.toggle("pointer-locked", locked);
    }

    function onMouseMove(e: MouseEvent) {
      if (!lockedRef.current || modalOpen) return;
      yaw.current   -= e.movementX * 0.002;
      pitch.current -= e.movementY * 0.002;
      pitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch.current));
    }

    // Click canvas to request pointer lock
    function onCanvasClick() {
      if (!lockedRef.current && !modalOpen) {
        canvasEl.requestPointerLock();
      }
    }

    function onKeyDown(e: KeyboardEvent) { keys.current.add(e.code); }
    function onKeyUp(e: KeyboardEvent)   { keys.current.delete(e.code); }

    canvasEl.addEventListener("click", onCanvasClick);
    document.addEventListener("pointerlockchange", onPLChange);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      canvasEl.removeEventListener("click", onCanvasClick);
      document.removeEventListener("pointerlockchange", onPLChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useFrame((_, delta) => {
    // Apply look from touch on mobile
    if (isMobile && touchLookRef.current) {
      yaw.current   -= touchLookRef.current.x * delta * 1.8;
      pitch.current -= touchLookRef.current.y * delta * 1.8;
      pitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch.current));
    }

    euler.current.set(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler.current);

    // Movement (blocked when modal open)
    if (!modalOpen) {
      const speed = 6.5 * delta;
      const fwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
      const rgt = new THREE.Vector3( Math.cos(yaw.current), 0, -Math.sin(yaw.current));

      const moveVec = new THREE.Vector3();
      let moved = false;

      // Keyboard
      if (keys.current.has("KeyW") || keys.current.has("ArrowUp"))    { moveVec.addScaledVector(fwd, speed); moved = true; }
      if (keys.current.has("KeyS") || keys.current.has("ArrowDown"))  { moveVec.addScaledVector(fwd, -speed); moved = true; }
      if (keys.current.has("KeyA") || keys.current.has("ArrowLeft"))  { moveVec.addScaledVector(rgt, -speed); moved = true; }
      if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) { moveVec.addScaledVector(rgt, speed); moved = true; }

      // Touch joystick
      if (isMobile && touchMoveRef.current) {
        const { x, y } = touchMoveRef.current;
        if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
          moveVec.addScaledVector(rgt, x * speed * 6);
          moveVec.addScaledVector(fwd, -y * speed * 6);
          moved = true;
        }
      }

      if (moved) {
        velocity.current.add(moveVec);
      }

      velocity.current.multiplyScalar(0.82);

      const next = playerPos.current!.clone().add(velocity.current);
      next.y = 1.7; // fixed height
      const resolved = resolveCollision(next);
      playerPos.current!.copy(resolved);
    }

    camera.position.copy(playerPos.current!);
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proximity detection (inside Canvas)
// ─────────────────────────────────────────────────────────────────────────────
function ProximityDetector({
  playerPos,
  missionIndex,
  onNearbyChange,
  interactables,
}: {
  playerPos: React.RefObject<THREE.Vector3>;
  missionIndex: MissionIndex;
  onNearbyChange: (id: string | null, label: string) => void;
  interactables: FacilityInteractable[];
}) {
  const lastId = useRef<string | null>(null);

  useFrame(() => {
    let closest: FacilityInteractable | null = null;
    let closestDist = Infinity;

    for (const t of interactables) {
      if (t.mission !== missionIndex) continue;
      const dx = playerPos.current!.x - t.pos[0];
      const dz = playerPos.current!.z - t.pos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < t.radius && dist < closestDist) {
        closestDist = dist;
        closest = t;
      }
    }

    const newId = closest?.id ?? null;
    if (newId !== lastId.current) {
      lastId.current = newId;
      onNearbyChange(newId, closest?.label ?? "");
    }
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing 3D assets — UNCHANGED
// ─────────────────────────────────────────────────────────────────────────────

function RotatingReactor() {
  const reactor = useRef<THREE.Group>(null);
  const core    = useRef<THREE.Mesh>(null);
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

function MechanicalMoth({ highlighted }: { highlighted: boolean }) {
  const moth       = useRef<THREE.Group>(null);
  const upperLeft  = useRef<THREE.Group>(null);
  const upperRight = useRef<THREE.Group>(null);
  const lowerLeft  = useRef<THREE.Group>(null);
  const lowerRight = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (moth.current) {
      moth.current.position.y = 5.4 + Math.sin(t * 1.4) * 0.13;
      moth.current.rotation.y = Math.sin(t * 0.45) * 0.15;
    }
    const flap = Math.sin(t * 7) * 0.55;
    if (upperLeft.current)  upperLeft.current.rotation.y  = -flap;
    if (upperRight.current) upperRight.current.rotation.y =  flap;
    if (lowerLeft.current)  lowerLeft.current.rotation.y  =  flap * 0.65;
    if (lowerRight.current) lowerRight.current.rotation.y = -flap * 0.65;
  });

  const ei = highlighted ? 3.5 : 1.3;
  const wm = (
    <meshStandardMaterial
      color="#a5f3fc" emissive="#0891b2" emissiveIntensity={ei}
      metalness={0.7} roughness={0.2} transparent opacity={0.8} side={THREE.DoubleSide}
    />
  );

  return (
    <Float speed={1.4} floatIntensity={0.2}>
      <group ref={moth} position={[0, 5.4, 0]}>
        <mesh>
          <capsuleGeometry args={[0.16, 0.9, 8, 16]} />
          <meshStandardMaterial color="#cbd5e1" emissive={highlighted ? "#22d3ee" : "#64748b"} emissiveIntensity={highlighted ? 2 : 0.7} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={3} />
        </mesh>
        <mesh position={[-0.12, 0.62, 0.15]}><sphereGeometry args={[0.055, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0.12, 0.62, 0.15]}><sphereGeometry args={[0.055, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[-0.1, 0.87, 0]} rotation={[0, 0, -0.4]}><cylinderGeometry args={[0.012, 0.025, 0.35, 8]} /><meshStandardMaterial color="#67e8f9" /></mesh>
        <mesh position={[0.1, 0.87, 0]} rotation={[0, 0, 0.4]}><cylinderGeometry args={[0.012, 0.025, 0.35, 8]} /><meshStandardMaterial color="#67e8f9" /></mesh>
        <group ref={upperLeft} position={[-0.12, 0.25, 0]}>
          <mesh position={[-0.65, 0.12, 0]} rotation={[0, 0, 0.2]}><sphereGeometry args={[0.78, 24, 16]} />{wm}</mesh>
          <mesh position={[-0.65, 0.12, 0.04]}><sphereGeometry args={[0.42, 16, 12]} /><meshBasicMaterial color="#22d3ee" wireframe /></mesh>
        </group>
        <group ref={upperRight} position={[0.12, 0.25, 0]}>
          <mesh position={[0.65, 0.12, 0]} rotation={[0, 0, -0.2]}><sphereGeometry args={[0.78, 24, 16]} />{wm}</mesh>
          <mesh position={[0.65, 0.12, 0.04]}><sphereGeometry args={[0.42, 16, 12]} /><meshBasicMaterial color="#22d3ee" wireframe /></mesh>
        </group>
        <group ref={lowerLeft} position={[-0.1, -0.15, 0]}>
          <mesh position={[-0.45, -0.5, 0]} rotation={[0, 0, 0.5]}><sphereGeometry args={[0.48, 20, 14]} />{wm}</mesh>
        </group>
        <group ref={lowerRight} position={[0.1, -0.15, 0]}>
          <mesh position={[0.45, -0.5, 0]} rotation={[0, 0, -0.5]}><sphereGeometry args={[0.48, 20, 14]} />{wm}</mesh>
        </group>
        <pointLight color="#22d3ee" intensity={highlighted ? 8 : 4} distance={4} />
      </group>
    </Float>
  );
}

function IndustrialColumn({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.11, 0.16, 6.3, 12]} /><meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} /></mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, -2.5 + i, 0]}>
          <torusGeometry args={[0.17, 0.025, 8, 24]} />
          <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}

function EnergyParticles() {
  const p = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (p.current) p.current.rotation.y += d * 0.15; });
  return (
    <group ref={p} position={[0, 2.8, 0]}>
      <Sparkles count={100} scale={[5, 5, 5]} size={3} speed={0.5} color="#22d3ee" />
    </group>
  );
}

function EnergyTransmission() {
  const orbs = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    orbs.current.forEach((orb, i) => {
      if (!orb) return;
      const p = (t * 0.8 + i * 0.65) % 4.8;
      orb.position.y = -2.4 + p;
    });
  });
  return (
    <group position={[0, 2.8, 0]}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.cos(a) * 2.8, z = Math.sin(a) * 2.8;
        return (
          <group key={i}>
            <mesh position={[x, 0, z]}>
              <cylinderGeometry args={[0.035, 0.035, 4.8, 10]} />
              <meshStandardMaterial color="#0891b2" emissive="#06b6d4" emissiveIntensity={2} transparent opacity={0.65} />
            </mesh>
            <mesh ref={(el) => { if (el) orbs.current[i] = el; }} position={[x, -2.4, z]}>
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

function MechanicalShellDetails() {
  return (
    <group>
      {Array.from({ length: 20 }).map((_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 4.85, 1.1, Math.sin(a) * 4.85]} rotation={[0, -a, 0]}>
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
        const a = (i / 4) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 3.1, 0.5, Math.sin(a) * 3.1]}>
            <mesh><cylinderGeometry args={[0.48, 0.55, 1.3, 24]} /><meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} /></mesh>
            <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.3, 0.3, 0.08, 24]} /><meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3} /></mesh>
            <Torus args={[0.57, 0.035, 8, 32]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={2} /></Torus>
            <pointLight color="#06b6d4" intensity={2} distance={2.5} />
          </group>
        );
      })}
      {[0,1,2,3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
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
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4]}>
            <cylinderGeometry args={[0.035, 0.035, 2.7, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
        );
      })}
      <pointLight color="#a78bfa" intensity={3} distance={6} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Facility environment (new geometry added around the machine)
// ─────────────────────────────────────────────────────────────────────────────

// Pulsing floor nav marker
function FloorMarker({ position, color, pulseOffset = 0 }: { position: [number,number,number]; color: string; pulseOffset?: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const mat = mesh.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * 2 + pulseOffset) * 0.7;
  });
  return (
    <mesh ref={mesh} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.4, 0.7, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.8} />
    </mesh>
  );
}

// Control terminal (used for reactor panel and moth scanner)
function Terminal({
  position,
  rotation,
  color,
  label,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  label: string;
}) {
  const screen = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!screen.current) return;
    const mat = screen.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.5;
  });

  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      {/* Base */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.8, 1.2, 0.35]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Screen */}
      <mesh ref={screen} position={[0, 0.75, 0.19]}>
        <boxGeometry args={[1.4, 0.75, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      {/* Buttons row */}
      {[-0.4, 0, 0.4].map((bx) => (
        <mesh key={bx} position={[bx, 0.22, 0.19]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </mesh>
      ))}
      {/* Stand */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      <pointLight color={color} intensity={3} distance={5} />
    </group>
  );
}

// Wall segment
function Wall({
  position,
  size,
  color = "#1e293b",
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
    </mesh>
  );
}

// Glowing floor strip (directional cue)
function FloorStrip({ from, to, color }: { from: [number,number,number]; to: [number,number,number]; color: string }) {
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[2] + to[2]) / 2;
  const len = Math.sqrt((to[0]-from[0])**2 + (to[2]-from[2])**2);
  const angle = Math.atan2(to[0]-from[0], to[2]-from[2]);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const mat = mesh.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 1.2) * 0.4;
  });
  return (
    <mesh ref={mesh} position={[cx, 0.005, cz]} rotation={[-Math.PI/2, 0, angle]}>
      <planeGeometry args={[0.12, len]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.7} />
    </mesh>
  );
}

function FacilityEnvironment({ missionIndex }: { missionIndex: MissionIndex }) {
  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 15, 5]} intensity={1.2} castShadow />
      <pointLight position={[0, 8, 0]} color="#0891b2" intensity={6} distance={30} />
      <pointLight position={[-12, 4, 5]} color="#4f46e5" intensity={3} distance={20} />
      <pointLight position={[12, 4, -15]} color="#7c3aed" intensity={3} distance={20} />
      <pointLight position={[-10, 3, -20]} color="#0891b2" intensity={2} distance={15} />

      {/* ── Fog ── */}
      <color attach="background" args={["#050914"]} />
      <fog attach="fog" args={["#050914", 18, 55]} />

      {/* ── Floor ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -7]}>
        <planeGeometry args={[40, 60]} />
        <meshStandardMaterial color="#0a1020" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 9, -7]}>
        <planeGeometry args={[40, 60]} />
        <meshStandardMaterial color="#050a14" metalness={0.4} roughness={0.8} />
      </mesh>

      {/* ── Outer walls ── */}
      <Wall position={[0, 4.5, 14]} size={[40, 9, 0.5]} />   {/* front */}
      <Wall position={[0, 4.5, -28]} size={[40, 9, 0.5]} />  {/* back */}
      <Wall position={[-19.75, 4.5, -7]} size={[0.5, 9, 60]} /> {/* left */}
      <Wall position={[19.75, 4.5, -7]} size={[0.5, 9, 60]} />  {/* right */}

      {/* ── Interior zone-separator walls (matching collision geometry) ── */}
      {/* Zone 1→2: left segment */}
      <Wall position={[-12.5, 3, 3]} size={[13, 6, 0.5]} />
      {/* Zone 1→2: right segment */}
      <Wall position={[12.5, 3, 3]} size={[13, 6, 0.5]} />
      {/* Door arch frame left gap */}
      <Wall position={[-5, 5.5, 3]} size={[2, 1, 0.5]} color="#0d1a2e" />
      <Wall position={[5, 5.5, 3]} size={[2, 1, 0.5]} color="#0d1a2e" />

      {/* Zone 2→3: left segment */}
      <Wall position={[-13.5, 3, -7]} size={[11, 6, 0.5]} />
      {/* Zone 2→3: right segment */}
      <Wall position={[13.5, 3, -7]} size={[11, 6, 0.5]} />
      {/* Zone 2→3 door arch */}
      <Wall position={[0, 5.5, -7]} size={[8, 1, 0.5]} color="#0d1a2e" />

      {/* Zone 3 entry arch */}
      <Wall position={[-11, 3, -13]} size={[16, 6, 0.5]} />
      <Wall position={[11, 3, -13]} size={[16, 6, 0.5]} />
      <Wall position={[0, 5.5, -13]} size={[6, 1, 0.5]} color="#0d1a2e" />

      {/* ── Wall-mounted light strips ── */}
      {[-18, 18].map((x) => (
        <group key={x}>
          {[-20, -10, 0, 8].map((z) => (
            <mesh key={z} position={[x, 5.5, z]}>
              <boxGeometry args={[0.05, 0.15, 3]} />
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Floor grid lines ── */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[-18 + i * 4, 0.001, -7]}>
          <planeGeometry args={[0.03, 58]} />
          <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={0.5} transparent opacity={0.4} />
        </mesh>
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, Math.PI/2]} position={[0, 0.001, -27 + i * 4.5]}>
          <planeGeometry args={[0.03, 38]} />
          <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={0.5} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* ── Navigation floor markers ── */}
      {/* Zone 1: cyan pads near machine perimeter entry */}
      <FloorMarker position={[8, 0.02, 11]} color="#22d3ee" pulseOffset={0} />
      <FloorMarker position={[-8, 0.02, 11]} color="#22d3ee" pulseOffset={1} />
      {/* Zone 2: amber pads in corridor */}
      <FloorMarker position={[-10, 0.02, 1]} color="#f59e0b" pulseOffset={0.5} />
      <FloorMarker position={[-10, 0.02, -2]} color="#f59e0b" pulseOffset={1.5} />
      {/* Zone 3: violet pads in far zone */}
      <FloorMarker position={[10, 0.02, -18]} color="#a78bfa" pulseOffset={0.3} />
      <FloorMarker position={[-10, 0.02, -18]} color="#a78bfa" pulseOffset={1.3} />

      {/* ── Floor guide strips ── */}
      {missionIndex === 2 && (
        <>
          <FloorStrip from={[0, 0, 8]} to={[-10, 0, 5]} color="#f59e0b" />
          <FloorStrip from={[-10, 0, 5]} to={[-10, 0, 2]} color="#f59e0b" />
        </>
      )}
      {missionIndex === 3 && (
        <>
          <FloorStrip from={[0, 0, -8]} to={[10, 0, -12]} color="#a78bfa" />
          <FloorStrip from={[10, 0, -12]} to={[10, 0, -18]} color="#a78bfa" />
        </>
      )}

      {/* ── Zone labels: glowing arches over doorways ── */}
      {/* Zone 1 arch glow */}
      <mesh position={[0, 5, 3]}>
        <boxGeometry args={[4.5, 0.08, 0.1]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
      </mesh>
      {/* Zone 2 arch glow */}
      <mesh position={[0, 5, -7]}>
        <boxGeometry args={[8.5, 0.08, 0.1]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3} />
      </mesh>
      {/* Zone 3 arch glow */}
      <mesh position={[0, 5, -13]}>
        <boxGeometry args={[6.5, 0.08, 0.1]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={3} />
      </mesh>

      {/* ── Mission terminals ── */}
      <Terminal
        position={[-10, 0, 5]}
        rotation={[0, Math.PI / 4, 0]}
        color="#06b6d4"
        label="REACTOR CONTROL"
      />
      <Terminal
        position={[10, 0, -18]}
        rotation={[0, -Math.PI / 6, 0]}
        color="#a78bfa"
        label="SPECIMEN SCANNER"
      />

      {/* ── Original machine assets (UNCHANGED) ── */}
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
            <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={2} />
          </mesh>
          {Array.from({ length: 8 }).map((_, j) => {
            const a = (j / 8) * Math.PI * 2;
            return (
              <group key={j} position={[Math.cos(a) * 3.65, 0.25, Math.sin(a) * 3.65]}>
                <mesh><boxGeometry args={[0.65, 0.45, 0.65]} /><meshStandardMaterial color="#334155" metalness={0.8} roughness={0.35} /></mesh>
                <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.3, 0.04, 0.3]} /><meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={2} /></mesh>
              </group>
            );
          })}
        </group>
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <IndustrialColumn key={i} position={[Math.cos(a) * 4.35, 2.8, Math.sin(a) * 4.35]} />;
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
      <MechanicalMoth highlighted={missionIndex === 3} />
      <EnergyParticles />
      <EnergyTransmission />
      <Sparkles count={60} scale={[10, 8, 10]} size={2} speed={0.3} color="#67e8f9" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Touch controls overlay (mobile)
// ─────────────────────────────────────────────────────────────────────────────
function TouchControls({
  touchMoveRef,
  touchLookRef,
}: {
  touchMoveRef: React.RefObject<{ x: number; y: number }>;
  touchLookRef: React.RefObject<{ x: number; y: number }>;
}) {
  const joystickOrigin = useRef<{ x: number; y: number } | null>(null);
  const lookOrigin     = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="pointer-events-auto absolute inset-0 z-20" style={{ touchAction: "none" }}>
      {/* Left half: movement joystick */}
      <div
        className="absolute bottom-0 left-0 top-0 w-1/2"
        onTouchStart={(e) => {
          const t = e.touches[0];
          joystickOrigin.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchMove={(e) => {
          if (!joystickOrigin.current) return;
          const t = e.touches[0];
          const dx = (t.clientX - joystickOrigin.current.x) / 60;
          const dy = (t.clientY - joystickOrigin.current.y) / 60;
          touchMoveRef.current!.x = Math.max(-1, Math.min(1, dx));
          touchMoveRef.current!.y = Math.max(-1, Math.min(1, dy));
        }}
        onTouchEnd={() => {
          joystickOrigin.current = null;
          touchMoveRef.current!.x = 0;
          touchMoveRef.current!.y = 0;
        }}
      >
        <div className="absolute bottom-16 left-16 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-white/5">
          <div className="h-8 w-8 rounded-full bg-white/20" />
        </div>
      </div>
      {/* Right half: look drag — stops above the interact button area */}
      <div
        className="absolute bottom-28 right-0 top-0 w-1/2"
        onTouchStart={(e) => {
          const t = e.touches[0];
          lookOrigin.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchMove={(e) => {
          if (!lookOrigin.current) return;
          const t = e.touches[0];
          touchLookRef.current!.x = (t.clientX - lookOrigin.current.x) * 0.01;
          touchLookRef.current!.y = (t.clientY - lookOrigin.current.y) * 0.01;
          lookOrigin.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={() => {
          lookOrigin.current = null;
          touchLookRef.current!.x = 0;
          touchLookRef.current!.y = 0;
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────

let feedbackIdCounter = 0;

export default function Home() {
  const isMobile = useIsMobile();

  // ── Game phase ─────────────────────────────────────────────────────────────
  const [gamePhase, setGamePhase] = useState<"start" | "playing" | "complete" | "report">("start");
  const [missionIndex, setMissionIndex] = useState<MissionIndex>(1);

  // ── Pointer lock state ────────────────────────────────────────────────────
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const playerPos = useRef(new THREE.Vector3(0, 1.7, 12));

  // ── Interaction state ─────────────────────────────────────────────────────
  const [nearbyTarget, setNearbyTarget] = useState<string | null>(null);
  const [nearbyLabel, setNearbyLabel] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // ── Mission 1: Inspection ─────────────────────────────────────────────────
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>(
    INSPECTION_ITEMS.map((i) => ({ ...i }))
  );
  const [exp01Complete, setExp01Complete] = useState(false);
  const [activeInspectId, setActiveInspectId] = useState<string | null>(null);

  // ── Mission 2: Reactor ─────────────────────────────────────────────────────
  const [reactorOnline, setReactorOnline]   = useState(false);
  const [reactorPower, setReactorPower]     = useState(0);
  const [peakReactorPower, setPeakReactorPower] = useState(0);
  const [exp02Complete, setExp02Complete]   = useState(false);
  const [reactorTargetReachedScored, setReactorTargetReachedScored] = useState(false);

  // ── Mission 3: Moth scan ───────────────────────────────────────────────────
  const [scanStarted, setScanStarted]       = useState(false);
  const [scanProgress, setScanProgress]     = useState(0);
  const [mothDiscovered, setMothDiscovered] = useState(false);
  const [exp03Complete, setExp03Complete]   = useState(false);
  const [mothContactScored, setMothContactScored]   = useState(false);
  const [scanCompleteScored, setScanCompleteScored] = useState(false);
  const [anomaliesScored, setAnomaliesScored]       = useState(0);

  // ── Scoring ────────────────────────────────────────────────────────────────
  const [score, setScore]               = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [feedback, setFeedback]         = useState<FeedbackEvent | null>(null);
  const scoredActions = useRef(new Set<string>());

  // ── Touch refs ────────────────────────────────────────────────────────────
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const touchLookRef = useRef({ x: 0, y: 0 });

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    setTimerRunning(gamePhase === "playing");
  }, [gamePhase]);

  // ── Reactor power ramp ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!reactorOnline) { setReactorPower(0); return; }
    const id = setInterval(() => {
      setReactorPower((p) => {
        const next = p + (Math.random() * 2 + 0.5);
        const capped = Math.min(next, 98.7);
        setPeakReactorPower((prev) => Math.max(prev, capped));
        return capped;
      });
    }, 150);
    return () => clearInterval(id);
  }, [reactorOnline]);

  // ── Scan ticker ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scanStarted || scanProgress >= 100) return;
    const id = setInterval(() => {
      setScanProgress((p) => Math.min(p + Math.random() * 1.5 + 0.5, 100));
    }, 120);
    return () => clearInterval(id);
  }, [scanStarted, scanProgress]);

  // ── Scoring helper ─────────────────────────────────────────────────────────
  const awardPoints = useCallback((
    actionId: string,
    points: number,
    message: string,
    type: FeedbackEvent["type"] = "correct"
  ) => {
    if (scoredActions.current.has(actionId)) return;
    scoredActions.current.add(actionId);
    setScore((s) => s + points);
    feedbackIdCounter += 1;
    setFeedback({ id: feedbackIdCounter, message, points, type });
  }, []);

  // ── E key interaction ──────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "KeyE" && nearbyTarget && !activeModal && gamePhase === "playing") {
        setActiveModal(nearbyTarget);
        // Release pointer lock when modal opens
        if (document.pointerLockElement) document.exitPointerLock();
      }
      if (e.code === "Escape" && activeModal) {
        setActiveModal(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nearbyTarget, activeModal, gamePhase]);

  // ── Inspection toggle ──────────────────────────────────────────────────────
  function handleToggleInspection(id: string) {
    const item = inspectionItems.find((it) => it.id === id);
    if (!item || item.checked) return;
    setInspectionItems((items) => items.map((it) => it.id === id ? { ...it, checked: true } : it));
    setActiveInspectId(id);
    awardPoints(`inspect-${id}`, INSPECTION_POINTS[id] ?? 100, `${item.component.toUpperCase()} INSPECTED`);

    // Check if all inspected
    const newItems = inspectionItems.map((it) => it.id === id ? { ...it, checked: true } : it);
    if (newItems.every((it) => it.checked) && !exp01Complete) {
      setExp01Complete(true);
      setTimeout(() => {
        setMissionIndex(2);
        setActiveModal(null);
      }, 800);
    }
  }

  // ── Reactor complete ───────────────────────────────────────────────────────
  function handleCompleteReactor() {
    if (exp02Complete) return;
    setExp02Complete(true);
    setActiveModal(null);
    setTimeout(() => setMissionIndex(3), 600);
  }

  // ── Moth / scan ────────────────────────────────────────────────────────────
  function handleMothContact() {
    if (!mothContactScored) {
      setMothDiscovered(true);
      setMothContactScored(true);
      awardPoints("moth-contact", MOTH_CONTACT_POINTS, "SPECIMEN CONTACT");
    }
  }

  function handleScanComplete() {
    if (scanCompleteScored) return;
    setScanCompleteScored(true);
    awardPoints("scan-complete", SCAN_COMPLETE_POINTS, "FULL SCAN COMPLETE!");
  }

  function handleAnomalyDiscovered(slot: number) {
    if (slot < anomaliesScored) return;
    setAnomaliesScored(slot + 1);
    awardPoints(`anomaly-${slot}`, SCAN_ANOMALY_POINTS, "ANOMALY DETECTED!");
  }

  function handleCompleteScan() {
    if (exp03Complete) return;
    setExp03Complete(true);
    setActiveModal(null);
    setTimeout(() => setGamePhase("complete"), 800);
  }

  function handleReactorTargetReached() {
    awardPoints("reactor-target", REACTOR_BONUS_POINTS, `REACTOR ${REACTOR_TARGET_POWER}%+ TARGET!`);
  }

  // ── Proximity callback ─────────────────────────────────────────────────────
  function handleNearbyChange(id: string | null, label: string) {
    setNearbyTarget(id);
    setNearbyLabel(label);
  }

  // ── Mission progress (0–1) ─────────────────────────────────────────────────
  function getMissionProgress(): number {
    if (missionIndex === 1) return inspectionItems.filter((i) => i.checked).length / inspectionItems.length;
    if (missionIndex === 2) return Math.min(reactorPower / 100, 1);
    return scanProgress / 100;
  }

  // ── Play Again ─────────────────────────────────────────────────────────────
  function handlePlayAgain() {
    setGamePhase("start");
    setMissionIndex(1);
    setInspectionItems(INSPECTION_ITEMS.map((i) => ({ ...i })));
    setExp01Complete(false);
    setActiveInspectId(null);
    setReactorOnline(false);
    setReactorPower(0);
    setPeakReactorPower(0);
    setExp02Complete(false);
    setReactorTargetReachedScored(false);
    setScanStarted(false);
    setScanProgress(0);
    setMothDiscovered(false);
    setExp03Complete(false);
    setMothContactScored(false);
    setScanCompleteScored(false);
    setAnomaliesScored(0);
    setScore(0);
    setElapsedSeconds(0);
    setTimerRunning(false);
    setFeedback(null);
    setActiveModal(null);
    setNearbyTarget(null);
    scoredActions.current = new Set();
    playerPos.current.set(0, 1.7, 12);
  }

  // ── Grade ─────────────────────────────────────────────────────────────────
  function getGrade(): { label: string; color: string } {
    if (score >= 2500) return { label: "S — EXCEPTIONAL",  color: "text-yellow-300" };
    if (score >= 1800) return { label: "A — OUTSTANDING",  color: "text-emerald-400" };
    if (score >= 1200) return { label: "B — COMPETENT",    color: "text-cyan-300" };
    if (score >= 700)  return { label: "C — ADEQUATE",     color: "text-amber-400" };
    return               { label: "D — NEEDS REVIEW",    color: "text-red-400" };
  }

  function formatTime(s: number) {
    return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#050914] text-white">

      {/* ── Report view (full-screen overlay) ── */}
      {gamePhase === "report" && (
        <div className="absolute inset-0 z-50 overflow-y-auto bg-[#050914]">
          <LabReport
            inspectionItems={inspectionItems}
            reactorPower={peakReactorPower}
            onBack={() => setGamePhase("complete")}
          />
        </div>
      )}

      {/* ── Start screen ── */}
      {gamePhase === "start" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-[#030712]">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[140px]" />
          <div className="relative z-10 w-full max-w-2xl px-6 text-center">
            <p className="animate-pulse text-[10px] tracking-[0.45em] text-cyan-400 md:text-xs">
              CLASSIFIED RESEARCH FACILITY · 2049
            </p>
            <div className="mx-auto my-6 h-px w-20 bg-cyan-400/70" />
            <h1 className="text-4xl font-black leading-tight tracking-[0.06em] md:text-7xl">
              THE MOTH<br /><span className="text-cyan-400">IN THE MACHINE</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-xs leading-7 tracking-wider text-gray-400 md:text-sm">
              THREE MISSIONS. ONE UNKNOWN ORGANISM.<br />EXPLORE THE FACILITY. FIND THE TRUTH.
            </p>
            <div className="mt-8 space-y-3 text-[10px] tracking-widest text-gray-500">
              <p>WASD / ARROW KEYS — MOVE &nbsp;·&nbsp; MOUSE — LOOK &nbsp;·&nbsp; E — INTERACT &nbsp;·&nbsp; ESC — RELEASE MOUSE</p>
            </div>
            <button
              onClick={() => setGamePhase("playing")}
              className="mt-8 border border-cyan-400/60 bg-cyan-400/10 px-10 py-4 text-[11px] font-bold tracking-[0.3em] text-cyan-300 transition duration-300 hover:scale-105 hover:bg-cyan-400/20 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]"
            >
              ENTER FACILITY →
            </button>
            <p className="mt-4 text-[8px] tracking-[0.3em] text-gray-600">
              CLICK THE 3D VIEW TO LOCK MOUSE CURSOR
            </p>
          </div>
        </div>
      )}

      {/* ── Completion screen ── */}
      {gamePhase === "complete" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md px-4">
            <div className="relative border border-cyan-400/40 bg-[#071321]/95 p-8 text-center">
              <div className="absolute left-1/2 top-0 h-1 w-32 -translate-x-1/2 bg-cyan-400" />
              <p className="text-[9px] tracking-[0.5em] text-cyan-400">ALL MISSIONS COMPLETE</p>
              <h2 className="mt-3 text-4xl font-black tracking-wider">FACILITY<br />CLEARED</h2>
              <div className="my-6 h-px bg-cyan-400/20" />
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="border border-white/10 bg-black/30 p-3">
                  <p className="text-[8px] tracking-[0.3em] text-gray-500">FINAL SCORE</p>
                  <p className="mt-1 text-2xl font-black text-white">{score.toLocaleString()}</p>
                </div>
                <div className="border border-white/10 bg-black/30 p-3">
                  <p className="text-[8px] tracking-[0.3em] text-gray-500">TOTAL TIME</p>
                  <p className="mt-1 text-2xl font-black text-cyan-300">{formatTime(elapsedSeconds)}</p>
                </div>
                <div className="col-span-2 border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-[8px] tracking-[0.3em] text-gray-500">PERFORMANCE</p>
                  <p className={`mt-1 text-xl font-black tracking-widest ${getGrade().color}`}>
                    {getGrade().label}
                  </p>
                </div>
              </div>
              <div className="my-5 h-px bg-white/10" />
              <div className="space-y-2">
                <button
                  onClick={() => setGamePhase("report")}
                  className="w-full border border-cyan-400 bg-cyan-400/10 py-3 text-[10px] font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  VIEW FINAL RESEARCH REPORT →
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="w-full border border-white/20 bg-white/5 py-3 text-[10px] font-bold tracking-[0.3em] text-gray-300 transition hover:bg-white/10"
                >
                  ↺ PLAY AGAIN
                </button>
              </div>
              <p className="mt-4 text-[8px] tracking-[0.3em] text-gray-600">
                RESTRICTED RESEARCH DIVISION · M.I.M. FACILITY
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Mission modal ── */}
      {activeModal && gamePhase === "playing" && (
        <MissionModal
          targetId={activeModal}
          missionIndex={missionIndex}
          inspectionItems={inspectionItems}
          onToggleInspection={handleToggleInspection}
          reactorOnline={reactorOnline}
          reactorPower={reactorPower}
          onToggleReactor={() => setReactorOnline((v) => !v)}
          onCompleteReactor={handleCompleteReactor}
          reactorComplete={exp02Complete}
          reactorTargetReachedScored={reactorTargetReachedScored}
          onReactorTargetReached={() => {
            setReactorTargetReachedScored(true);
            handleReactorTargetReached();
          }}
          mothDiscovered={mothDiscovered}
          scanStarted={scanStarted}
          scanProgress={scanProgress}
          onStartScan={() => setScanStarted(true)}
          onCompleteScan={handleCompleteScan}
          scanComplete={exp03Complete}
          mothContactScored={mothContactScored}
          scanCompleteScored={scanCompleteScored}
          anomaliesScored={anomaliesScored}
          onMothContact={handleMothContact}
          onScanCompleteScored={handleScanComplete}
          onAnomalyDiscovered={handleAnomalyDiscovered}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ── Game HUD ── */}
      {gamePhase === "playing" && (
        <GameHUD
          missionIndex={missionIndex}
          missionProgress={getMissionProgress()}
          score={score}
          elapsedSeconds={elapsedSeconds}
          feedback={feedback}
          nearbyTarget={nearbyTarget}
          nearbyLabel={nearbyLabel}
          isPointerLocked={isPointerLocked}
          modalOpen={activeModal !== null}
          mission1Done={exp01Complete}
          mission2Done={exp02Complete}
          mission3Done={exp03Complete}
        />
      )}

      {/* ── Mobile touch controls ── */}
      {isMobile && gamePhase === "playing" && !activeModal && (
        <TouchControls touchMoveRef={touchMoveRef} touchLookRef={touchLookRef} />
      )}

      {/* ── Mobile INTERACT button ── */}
      {isMobile && gamePhase === "playing" && !!nearbyTarget && !activeModal && (
        <button
          className="pointer-events-auto absolute bottom-10 right-6 z-30 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-cyan-400 bg-[#050914]/80 shadow-[0_0_20px_rgba(34,211,238,0.4)] backdrop-blur-sm active:scale-95"
          style={{ touchAction: "manipulation" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setActiveModal(nearbyTarget);
          }}
          aria-label="Interact"
        >
          <span className="text-lg font-black leading-none text-cyan-300">E</span>
          <span className="mt-0.5 text-[7px] font-bold tracking-[0.15em] text-cyan-400">
            INTERACT
          </span>
        </button>
      )}

      {/* ── 3D Canvas (always rendered, even on start/complete for atmosphere) ── */}
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 120 }}
        dpr={isMobile ? [1, 2.5] : [1, 2.0]}
        gl={{
          antialias: true,
          alpha: false,
          precision: "highp",
          powerPreference: isMobile ? "default" : "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
        className="absolute inset-0"
      >
        <FacilityEnvironment missionIndex={missionIndex} />

        {gamePhase === "playing" && (
          <>
            <FirstPersonController
              playerPos={playerPos}
              modalOpen={activeModal !== null}
              onPointerLockChange={setIsPointerLocked}
              isMobile={isMobile}
              touchMoveRef={touchMoveRef}
              touchLookRef={touchLookRef}
            />
            <ProximityDetector
              playerPos={playerPos}
              missionIndex={missionIndex}
              onNearbyChange={handleNearbyChange}
              interactables={FACILITY_INTERACTABLES}
            />
          </>
        )}
      </Canvas>
    </main>
  );
}
