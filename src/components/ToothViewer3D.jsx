'use client';
import { useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import styles from './ToothViewer3D.module.css';

/* ═══════════════════════════════════════════════════════════════
   TOOTH POSITIONS – FDI numbering along anatomical dental arch
   ═══════════════════════════════════════════════════════════════ */
const TOOTH_DATA = [
    // Upper arch
    { id: 18, label: '18 (UR8)', x: -3.5, y: 0.8, z: -1.2, upper: true, type: 'molar' },
    { id: 17, label: '17 (UR7)', x: -3.15, y: 0.8, z: -0.4, upper: true, type: 'molar' },
    { id: 16, label: '16 (UR6)', x: -2.75, y: 0.8, z: 0.3, upper: true, type: 'molar' },
    { id: 15, label: '15 (UR5)', x: -2.25, y: 0.8, z: 0.9, upper: true, type: 'premolar' },
    { id: 14, label: '14 (UR4)', x: -1.75, y: 0.8, z: 1.3, upper: true, type: 'premolar' },
    { id: 13, label: '13 (UR3)', x: -1.15, y: 0.8, z: 1.65, upper: true, type: 'canine' },
    { id: 12, label: '12 (UR2)', x: -0.65, y: 0.8, z: 1.82, upper: true, type: 'lateral' },
    { id: 11, label: '11 (UR1)', x: -0.22, y: 0.8, z: 1.9, upper: true, type: 'central' },
    { id: 21, label: '21 (UL1)', x: 0.22, y: 0.8, z: 1.9, upper: true, type: 'central' },
    { id: 22, label: '22 (UL2)', x: 0.65, y: 0.8, z: 1.82, upper: true, type: 'lateral' },
    { id: 23, label: '23 (UL3)', x: 1.15, y: 0.8, z: 1.65, upper: true, type: 'canine' },
    { id: 24, label: '24 (UL4)', x: 1.75, y: 0.8, z: 1.3, upper: true, type: 'premolar' },
    { id: 25, label: '25 (UL5)', x: 2.25, y: 0.8, z: 0.9, upper: true, type: 'premolar' },
    { id: 26, label: '26 (UL6)', x: 2.75, y: 0.8, z: 0.3, upper: true, type: 'molar' },
    { id: 27, label: '27 (UL7)', x: 3.15, y: 0.8, z: -0.4, upper: true, type: 'molar' },
    { id: 28, label: '28 (UL8)', x: 3.5, y: 0.8, z: -1.2, upper: true, type: 'molar' },
    // Lower arch
    { id: 48, label: '48 (LR8)', x: -3.3, y: -0.8, z: -1.0, upper: false, type: 'molar' },
    { id: 47, label: '47 (LR7)', x: -2.95, y: -0.8, z: -0.25, upper: false, type: 'molar' },
    { id: 46, label: '46 (LR6)', x: -2.55, y: -0.8, z: 0.35, upper: false, type: 'molar' },
    { id: 45, label: '45 (LR5)', x: -2.05, y: -0.8, z: 0.85, upper: false, type: 'premolar' },
    { id: 44, label: '44 (LR4)', x: -1.55, y: -0.8, z: 1.2, upper: false, type: 'premolar' },
    { id: 43, label: '43 (LR3)', x: -1.05, y: -0.8, z: 1.45, upper: false, type: 'canine' },
    { id: 42, label: '42 (LR2)', x: -0.55, y: -0.8, z: 1.6, upper: false, type: 'lateral' },
    { id: 41, label: '41 (LR1)', x: -0.18, y: -0.8, z: 1.7, upper: false, type: 'central' },
    { id: 31, label: '31 (LL1)', x: 0.18, y: -0.8, z: 1.7, upper: false, type: 'central' },
    { id: 32, label: '32 (LL2)', x: 0.55, y: -0.8, z: 1.6, upper: false, type: 'lateral' },
    { id: 33, label: '33 (LL3)', x: 1.05, y: -0.8, z: 1.45, upper: false, type: 'canine' },
    { id: 34, label: '34 (LL4)', x: 1.55, y: -0.8, z: 1.2, upper: false, type: 'premolar' },
    { id: 35, label: '35 (LL5)', x: 2.05, y: -0.8, z: 0.85, upper: false, type: 'premolar' },
    { id: 36, label: '36 (LL6)', x: 2.55, y: -0.8, z: 0.35, upper: false, type: 'molar' },
    { id: 37, label: '37 (LL7)', x: 2.95, y: -0.8, z: -0.25, upper: false, type: 'molar' },
    { id: 38, label: '38 (LL8)', x: 3.3, y: -0.8, z: -1.0, upper: false, type: 'molar' },
];

/* ═══════════════════════════════════ Colors ═══════════════════════════════════ */
const severityColor = {
    severe: '#ef4444',
    moderate: '#f59e0b',
    mild: '#22c55e',
    healthy: '#f5f0e8', // natural enamel
};

const ENAMEL_BASE = '#f5f0e8';
const ENAMEL_EDGE = '#e8dcc8';
const ROOT_COLOR = '#ddd0b0';
const GUM_COLOR = '#d4787a';
const GUM_COLOR_DEEP = '#c0686a';

/* ═══════════════════════════════════ Zone / ID mapping ═══════════════════════ */
function zoneToToothIds(zone) {
    if (!zone) return [];
    const matches = [];
    const zL = zone.toLowerCase();
    if (zL.includes('upper right') || zL.includes('ur')) matches.push(18, 17, 16, 15, 14, 13, 12, 11);
    if (zL.includes('upper left') || zL.includes('ul')) matches.push(21, 22, 23, 24, 25, 26, 27, 28);
    if (zL.includes('lower right') || zL.includes('lr')) matches.push(48, 47, 46, 45, 44, 43, 42, 41);
    if (zL.includes('lower left') || zL.includes('ll')) matches.push(31, 32, 33, 34, 35, 36, 37, 38);
    const nm = zone.match(/\d+/g);
    if (nm) nm.forEach(n => { const id = parseInt(n); if (TOOTH_DATA.some(t => t.id === id)) matches.push(id); });
    if (zL.includes('molar')) {
        if (zL.includes('upper')) matches.push(16, 17, 18, 26, 27, 28);
        else if (zL.includes('lower')) matches.push(36, 37, 38, 46, 47, 48);
        else matches.push(16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48);
    }
    if (zL.includes('premolar')) matches.push(14, 15, 24, 25, 34, 35, 44, 45);
    if (zL.includes('incisor') || zL.includes('central') || zL.includes('lateral')) matches.push(11, 12, 21, 22, 31, 32, 41, 42);
    if (zL.includes('canine')) matches.push(13, 23, 33, 43);
    if (!matches.length) { const h = zone.split('').reduce((a, c) => a + c.charCodeAt(0), 0); matches.push(TOOTH_DATA[h % TOOTH_DATA.length].id); }
    return [...new Set(matches)];
}
function sevRank(s) { return s === 'severe' ? 3 : s === 'moderate' ? 2 : 1; }

/* ═══════════════════════════════════════════════════════════════
   TOOTH CROWN GEOMETRY — Detailed procedural shapes per type
   Uses LatheGeometry with anatomically-accurate profiles
   ═══════════════════════════════════════════════════════════════ */
function makeCrownGeo(type) {
    const p = [];
    const V = (x, y) => new THREE.Vector2(x, y);

    if (type === 'molar') {
        // Wide, flat crown with broad occlusal surface and distinct cusps
        p.push(V(0, 0), V(0.22, 0.01), V(0.24, 0.04), V(0.25, 0.1),
            V(0.255, 0.16), V(0.25, 0.22), V(0.24, 0.27),
            V(0.22, 0.3), V(0.18, 0.33), V(0.14, 0.345),
            V(0.12, 0.35), V(0.1, 0.34), V(0.08, 0.35),
            V(0.05, 0.345), V(0.03, 0.35), V(0, 0.34));
    } else if (type === 'premolar') {
        p.push(V(0, 0), V(0.18, 0.01), V(0.19, 0.05), V(0.2, 0.12),
            V(0.195, 0.2), V(0.18, 0.27), V(0.16, 0.32),
            V(0.13, 0.36), V(0.1, 0.38), V(0.07, 0.385),
            V(0.04, 0.39), V(0, 0.385));
    } else if (type === 'canine') {
        // Pointed, conical cusp
        p.push(V(0, 0), V(0.15, 0.01), V(0.16, 0.06), V(0.165, 0.14),
            V(0.16, 0.22), V(0.145, 0.3), V(0.12, 0.36),
            V(0.09, 0.41), V(0.06, 0.44), V(0.03, 0.46),
            V(0, 0.47));
    } else if (type === 'central') {
        // Wide, shovel-shaped upper central incisor
        p.push(V(0, 0), V(0.14, 0.01), V(0.145, 0.05), V(0.15, 0.12),
            V(0.148, 0.2), V(0.14, 0.27), V(0.13, 0.32),
            V(0.12, 0.36), V(0.1, 0.38), V(0.07, 0.39),
            V(0, 0.39));
    } else {
        // Lateral incisor — narrower, slightly angled
        p.push(V(0, 0), V(0.12, 0.01), V(0.125, 0.05), V(0.13, 0.12),
            V(0.128, 0.2), V(0.12, 0.26), V(0.11, 0.31),
            V(0.09, 0.35), V(0.07, 0.37), V(0.04, 0.38),
            V(0, 0.38));
    }

    const geo = new THREE.LatheGeometry(p, 20);
    geo.computeVertexNormals();
    return geo;
}

function makeRootGeo(type) {
    const p = [];
    const V = (x, y) => new THREE.Vector2(x, y);

    if (type === 'molar') {
        // Thick root that tapers
        p.push(V(0, 0), V(0.2, -0.01), V(0.18, -0.08), V(0.14, -0.2),
            V(0.1, -0.32), V(0.07, -0.42), V(0.04, -0.5),
            V(0.02, -0.55), V(0, -0.58));
    } else if (type === 'premolar') {
        p.push(V(0, 0), V(0.16, -0.01), V(0.14, -0.08), V(0.11, -0.2),
            V(0.08, -0.32), V(0.05, -0.42), V(0.03, -0.5),
            V(0, -0.54));
    } else if (type === 'canine') {
        // Long robust root
        p.push(V(0, 0), V(0.14, -0.01), V(0.12, -0.1), V(0.1, -0.25),
            V(0.07, -0.4), V(0.05, -0.52), V(0.03, -0.6),
            V(0.015, -0.66), V(0, -0.7));
    } else {
        // Shorter root for incisors
        p.push(V(0, 0), V(0.12, -0.01), V(0.1, -0.08), V(0.08, -0.2),
            V(0.06, -0.32), V(0.04, -0.42), V(0.02, -0.5),
            V(0, -0.54));
    }

    const geo = new THREE.LatheGeometry(p, 16);
    geo.computeVertexNormals();
    return geo;
}

// Cache geometries
const _crownCache = {};
const _rootCache = {};
function getCrownGeo(t) { if (!_crownCache[t]) _crownCache[t] = makeCrownGeo(t); return _crownCache[t]; }
function getRootGeo(t) { if (!_rootCache[t]) _rootCache[t] = makeRootGeo(t); return _rootCache[t]; }

/* ═══════════════════════════════════════════════════════════════
   INDIVIDUAL TOOTH
   ═══════════════════════════════════════════════════════════════ */
function Tooth({ position, toothData, finding, isHovered, onHover, onUnhover }) {
    const crownRef = useRef();
    const rootRef = useRef();
    const color = finding ? severityColor[finding.severity] || severityColor.moderate : severityColor.healthy;

    useFrame((state) => {
        if (!crownRef.current) return;
        if (isHovered) {
            const s = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.03;
            crownRef.current.scale.setScalar(s);
            if (rootRef.current) rootRef.current.scale.setScalar(s);
        } else {
            crownRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
            if (rootRef.current) rootRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
        }
    });

    const crownGeo = useMemo(() => getCrownGeo(toothData.type), [toothData.type]);
    const rootGeo = useMemo(() => getRootGeo(toothData.type), [toothData.type]);

    // Scale per type
    const sc = { molar: 1.0, premolar: 0.9, canine: 0.88, central: 0.85, lateral: 0.78 };
    const s = sc[toothData.type] || 0.85;

    // Orient root direction (upper teeth: root up; lower: root down)
    const rootFlip = toothData.upper ? 1 : -1;
    const rootY = toothData.upper ? 0 : 0; // root sits at crown base

    // Arch orientation — each tooth faces outward
    const angle = Math.atan2(toothData.z, toothData.x);

    return (
        <group position={position}>
            <group rotation={[0, angle, 0]} scale={[s, s, s]}>
                {/* Crown (visible enamel part) */}
                <mesh
                    ref={crownRef}
                    geometry={crownGeo}
                    rotation={toothData.upper ? [0, 0, 0] : [Math.PI, 0, 0]}
                    onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
                    onPointerOut={onUnhover}
                    castShadow
                    receiveShadow
                >
                    <meshPhysicalMaterial
                        color={color}
                        roughness={0.12}
                        metalness={0.02}
                        clearcoat={0.8}
                        clearcoatRoughness={0.15}
                        sheen={0.3}
                        sheenColor={ENAMEL_EDGE}
                        emissive={isHovered ? color : '#000000'}
                        emissiveIntensity={isHovered ? 0.3 : 0}
                    />
                </mesh>

                {/* Root */}
                <mesh
                    ref={rootRef}
                    geometry={rootGeo}
                    position={[0, 0, 0]}
                    rotation={toothData.upper ? [Math.PI, 0, 0] : [0, 0, 0]}
                    castShadow
                >
                    <meshStandardMaterial
                        color={finding ? new THREE.Color(color).lerp(new THREE.Color(ROOT_COLOR), 0.5) : ROOT_COLOR}
                        roughness={0.55}
                        metalness={0.0}
                    />
                </mesh>

                {/* Glow ring for affected teeth */}
                {finding && (
                    <mesh
                        position={[0, toothData.upper ? 0.18 : -0.18, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <ringGeometry args={[0.18, 0.32, 24]} />
                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={isHovered ? 0.4 : 0.15}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                )}
            </group>

            {/* Tooltip */}
            {isHovered && (
                <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                    <div className={styles.tooltip}>
                        <strong>{toothData.label}</strong>
                        {finding ? (
                            <>
                                <span className={styles.tooltipCondition}>{finding.name}</span>
                                <span className={styles.tooltipSeverity} style={{ color }}>
                                    {finding.severity} — {Math.round(finding.confidence * 100)}%
                                </span>
                            </>
                        ) : (
                            <span className={styles.tooltipHealthy}>Healthy</span>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
}

/* ═══════════════════════════════════════════════════════════════
   GUM TISSUE — Smooth, fleshy arch wrapping around teeth
   Uses TubeGeometry along an arch-shaped CatmullRomCurve
   ═══════════════════════════════════════════════════════════════ */
function GumTissue() {
    const upperOuter = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 40; i++) {
            const t = (i / 40) * Math.PI;
            const x = Math.cos(t) * 3.1;
            const z = Math.sin(t) * 1.9 - 0.3;
            pts.push(new THREE.Vector3(x, 0.78, z));
        }
        return new THREE.CatmullRomCurve3(pts);
    }, []);

    const lowerOuter = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 40; i++) {
            const t = (i / 40) * Math.PI;
            const x = Math.cos(t) * 2.9;
            const z = Math.sin(t) * 1.7 - 0.2;
            pts.push(new THREE.Vector3(x, -0.78, z));
        }
        return new THREE.CatmullRomCurve3(pts);
    }, []);

    return (
        <>
            {/* Upper gum – outer band */}
            <mesh receiveShadow>
                <tubeGeometry args={[upperOuter, 80, 0.35, 16, false]} />
                <meshPhysicalMaterial
                    color={GUM_COLOR}
                    roughness={0.6}
                    metalness={0.0}
                    clearcoat={0.2}
                    transparent
                    opacity={0.55}
                />
            </mesh>
            {/* Lower gum */}
            <mesh receiveShadow>
                <tubeGeometry args={[lowerOuter, 80, 0.33, 16, false]} />
                <meshPhysicalMaterial
                    color={GUM_COLOR}
                    roughness={0.6}
                    metalness={0.0}
                    clearcoat={0.2}
                    transparent
                    opacity={0.55}
                />
            </mesh>
            {/* Inner gum ridge – upper */}
            <mesh receiveShadow>
                <tubeGeometry args={[useMemo(() => {
                    const pts = [];
                    for (let i = 0; i <= 40; i++) {
                        const t = (i / 40) * Math.PI;
                        pts.push(new THREE.Vector3(Math.cos(t) * 2.4, 0.82, Math.sin(t) * 1.3 - 0.1));
                    }
                    return new THREE.CatmullRomCurve3(pts);
                }, []), 60, 0.22, 12, false]} />
                <meshPhysicalMaterial color={GUM_COLOR_DEEP} roughness={0.7} transparent opacity={0.4} />
            </mesh>
            {/* Inner gum ridge – lower */}
            <mesh receiveShadow>
                <tubeGeometry args={[useMemo(() => {
                    const pts = [];
                    for (let i = 0; i <= 40; i++) {
                        const t = (i / 40) * Math.PI;
                        pts.push(new THREE.Vector3(Math.cos(t) * 2.2, -0.82, Math.sin(t) * 1.2));
                    }
                    return new THREE.CatmullRomCurve3(pts);
                }, []), 60, 0.2, 12, false]} />
                <meshPhysicalMaterial color={GUM_COLOR_DEEP} roughness={0.7} transparent opacity={0.4} />
            </mesh>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PATIENT MODEL LOADER & NORMALIZATION
   ═══════════════════════════════════════════════════════════════ */
function ModelLoader() {
    const { progress } = useProgress();
    return (
        <Html center style={{ pointerEvents: 'none' }}>
            <div className={styles.loaderContainer}>
                <div className={styles.loaderSpinner}></div>
                <p className={styles.loaderText}>Loading Scan... {Math.round(progress)}%</p>
                <div className={styles.progressBarOuter}>
                    <div className={styles.progressBarInner} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </Html>
    );
}

function PatientModel({ url, type, materialPreset }) {
    const obj = type === 'obj' ? useLoader(OBJLoader, url) : null;
    const geom = type === 'stl' ? useLoader(STLLoader, url) : null;

    const material = useMemo(() => {
        const props = {
            roughness: 0.25,
            metalness: 0.15,
            clearcoat: 0.5,
            clearcoatRoughness: 0.15,
        };

        switch (materialPreset) {
            case 'enamel':
                return new THREE.MeshPhysicalMaterial({
                    ...props,
                    color: '#f5f0e8',
                    roughness: 0.15,
                    metalness: 0.05,
                    clearcoat: 0.9,
                    clearcoatRoughness: 0.1,
                });
            case 'bone':
                return new THREE.MeshPhysicalMaterial({
                    ...props,
                    color: '#ddd0b0',
                    transparent: true,
                    opacity: 0.65,
                    roughness: 0.4,
                    metalness: 0.0,
                });
            case 'gold':
                return new THREE.MeshPhysicalMaterial({
                    color: '#ffd700',
                    roughness: 0.1,
                    metalness: 0.9,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1,
                });
            case 'diagnostic':
                return new THREE.MeshPhysicalMaterial({
                    ...props,
                    color: '#3b82f6',
                    roughness: 0.2,
                    metalness: 0.2,
                    emissive: '#1d4ed8',
                    emissiveIntensity: 0.15,
                });
            default:
                return new THREE.MeshPhysicalMaterial({
                    ...props,
                    color: '#f5f0e8',
                });
        }
    }, [materialPreset]);

    const normalizedObject = useMemo(() => {
        if (type === 'obj' && obj) {
            const cloned = obj.clone();
            const box = new THREE.Box3().setFromObject(cloned);
            const center = new THREE.Vector3();
            box.getCenter(center);
            cloned.position.sub(center);

            // Scale to a standard bounding box size of 4.5 units
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4.5 / (maxDim || 1);
            cloned.scale.set(scale, scale, scale);

            cloned.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = material;
                }
            });
            return <primitive object={cloned} />;
        }

        if (type === 'stl' && geom) {
            const clonedGeom = geom.clone();
            clonedGeom.center();
            clonedGeom.computeVertexNormals();

            clonedGeom.computeBoundingBox();
            const box = clonedGeom.boundingBox;
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4.5 / (maxDim || 1);

            return (
                <mesh geometry={clonedGeom} scale={[scale, scale, scale]} castShadow receiveShadow material={material} />
            );
        }

        return null;
    }, [obj, geom, type, material]);

    return normalizedObject;
}

/* ═══════════════════════════════════════════════════════════════
   FULL DENTAL SCENE
   ═══════════════════════════════════════════════════════════════ */
function DentalScene({ mode, modelUrl, modelType, materialPreset, findings }) {
    const [hoveredId, setHoveredId] = useState(null);

    const toothFindings = useMemo(() => {
        const map = {};
        if (!findings) return map;
        findings.forEach((f) => {
            const ids = zoneToToothIds(f.toothZone);
            ids.forEach((id) => {
                if (!map[id] || sevRank(f.severity) > sevRank(map[id].severity)) {
                    map[id] = f;
                }
            });
        });
        return map;
    }, [findings]);

    const handleHover = useCallback((id) => setHoveredId(id), []);
    const handleUnhover = useCallback(() => setHoveredId(null), []);

    return (
        <>
            {/* 3-point lighting for realistic look */}
            <ambientLight intensity={0.4} color="#fdf8f0" />
            <directionalLight
                position={[6, 10, 8]}
                intensity={1.3}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                color="#fff8f0"
            />
            <directionalLight position={[-5, -4, 6]} intensity={0.35} color="#c8d8f0" />
            <directionalLight position={[0, -6, -4]} intensity={0.2} color="#e0d0c0" />
            <pointLight position={[0, 1, 7]} intensity={0.5} color="#fff5ee" distance={15} />
            <pointLight position={[0, -1, 5]} intensity={0.3} color="#ffe8d8" distance={12} />

            {mode === 'fdi' ? (
                <>
                    {/* Gum tissue */}
                    <GumTissue />

                    {/* All 32 teeth */}
                    {TOOTH_DATA.map((tooth) => (
                        <Tooth
                            key={tooth.id}
                            position={[tooth.x, tooth.y, tooth.z]}
                            toothData={tooth}
                            finding={toothFindings[tooth.id] || null}
                            isHovered={hoveredId === tooth.id}
                            onHover={() => handleHover(tooth.id)}
                            onUnhover={handleUnhover}
                        />
                    ))}
                </>
            ) : (
                <Suspense fallback={<ModelLoader />}>
                    {modelUrl && <PatientModel url={modelUrl} type={modelType} materialPreset={materialPreset} />}
                </Suspense>
            )}

            {/* Controls */}
            <OrbitControls
                enablePan
                enableZoom
                enableRotate
                autoRotate={mode === 'fdi'}
                autoRotateSpeed={0.6}
                maxDistance={14}
                minDistance={3}
                maxPolarAngle={Math.PI * 0.85}
                minPolarAngle={Math.PI * 0.15}
            />
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORTED COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function ToothViewer3D({ findings }) {
    const [mode, setMode] = useState('subtool2'); // 'fdi', 'teeth1', 'teeth2', 'subtool1', 'subtool2'
    const [materialPreset, setMaterialPreset] = useState('enamel');

    const selectedModel = useMemo(() => {
        switch (mode) {
            case 'teeth1':
                return { type: 'obj', url: '/models/teeth1.OBJ' };
            case 'teeth2':
                return { type: 'obj', url: '/models/teeth2.OBJ' };
            case 'subtool1':
                return { type: 'stl', url: '/models/teeth_1_SubTool1.stl' };
            case 'subtool2':
                return { type: 'stl', url: '/models/teeth_1_SubTool2.stl' };
            default:
                return null;
        }
    }, [mode]);

    return (
        <div className={styles.container}>
            <div className={styles.viewerHeader}>
                <div className={styles.controlsOverlay}>
                    <div className={styles.controlGroup}>
                        <select
                            className={styles.selectInput}
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            title="Select 3D View Mode"
                        >
                            <option value="fdi">🦷 FDI Interactive Arch</option>
                            <option value="teeth1">📁 Patient Scan 1 (OBJ)</option>
                            <option value="teeth2">📁 Patient Scan 2 (OBJ)</option>
                            <option value="subtool1">📁 Patient SubTool 1 (STL)</option>
                            <option value="subtool2">📁 Patient SubTool 2 (STL)</option>
                        </select>
                    </div>

                    {mode !== 'fdi' && (
                        <div className={styles.controlGroup}>
                            <select
                                className={styles.selectInput}
                                value={materialPreset}
                                onChange={(e) => setMaterialPreset(e.target.value)}
                                title="Select Material Preset"
                            >
                                <option value="enamel">Realistic Enamel</option>
                                <option value="bone">Translucent Bone</option>
                                <option value="gold">Metallic Gold</option>
                                <option value="diagnostic">Diagnostic Blue</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className={styles.canvasWrap}>
                    <Canvas
                        camera={{ position: [0, 2.5, 7.5], fov: 38 }}
                        shadows
                        dpr={[1, 2]}
                        style={{ background: 'transparent' }}
                        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
                    >
                        <DentalScene
                            mode={mode}
                            modelUrl={selectedModel?.url}
                            modelType={selectedModel?.type}
                            materialPreset={materialPreset}
                            findings={findings}
                        />
                    </Canvas>
                </div>
            </div>
            {/* Legend */}
            {mode === 'fdi' ? (
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: severityColor.healthy }} />
                        Healthy
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: severityColor.mild }} />
                        Mild
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: severityColor.moderate }} />
                        Moderate
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: severityColor.severe }} />
                        Severe
                    </div>
                </div>
            ) : (
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#a855f7' }} />
                        Active Patient Scan Mode ({selectedModel?.type.toUpperCase()})
                    </div>
                </div>
            )}
            <p className={styles.hint}>🖱️ Drag to rotate • Scroll to zoom • Right-click to pan</p>
        </div>
    );
}
