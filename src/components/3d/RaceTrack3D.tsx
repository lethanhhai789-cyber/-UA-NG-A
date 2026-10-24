import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraMode, Team } from '../../types';
import { Horse3D } from './Horse3D';

interface RaceTrack3DProps {
  teams: Team[];
  isRacing: boolean;
  cameraMode: CameraMode;
  totalLanes?: number;
  hurdleJumpTeamId?: string | null;
  onJumpComplete?: (teamId: string) => void;
}

const TRACK_LENGTH = 110; // meters from start to finish
const LANE_WIDTH = 2.4;

export const RaceTrack3D: React.FC<RaceTrack3DProps> = ({
  teams,
  isRacing,
  cameraMode,
  totalLanes = 8,
  hurdleJumpTeamId = null,
  onJumpComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const horsesRef = useRef<Map<string, Horse3D>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Jump animation tracker
  const jumpStateRef = useRef<{
    teamId: string;
    startTime: number;
    duration: number;
  } | null>(null);

  // Dust particles ref
  const dustParticlesRef = useRef<THREE.Points | null>(null);

  // Smooth camera vectors
  const camTargetPos = useRef(new THREE.Vector3());
  const camLookAtPos = useRef(new THREE.Vector3());

  // Handle Hurdle jump trigger from props
  useEffect(() => {
    if (hurdleJumpTeamId) {
      jumpStateRef.current = {
        teamId: hurdleJumpTeamId,
        startTime: performance.now(),
        duration: 2000, // 2.0s slow-mo jump
      };
    }
  }, [hurdleJumpTeamId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene & Renderer setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.007);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 300);
    cameraRef.current = camera;
    camera.position.set(-10, 12, 18);
    camera.lookAt(15, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Reflection environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3. Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sunLight.position.set(40, 50, 30);
    sunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 180;
      sunLight.shadow.camera.left = -60;
      sunLight.shadow.camera.right = 60;
      sunLight.shadow.camera.top = 40;
      sunLight.shadow.camera.bottom = -40;
      sunLight.shadow.bias = -0.0005;
    }
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x4ade80, 0.85);
    scene.add(hemiLight);

    // 4. Track & Environment Construction
    const trackGroup = new THREE.Group();
    const trackWidth = totalLanes * LANE_WIDTH + 3;

    // Grass ground field
    const grassGeo = new THREE.PlaneGeometry(TRACK_LENGTH + 80, trackWidth + 90);
    grassGeo.rotateX(-Math.PI / 2);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3d7e35,
      roughness: 0.85,
      metalness: 0.05,
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.set(TRACK_LENGTH / 2, -0.05, 0);
    grassMesh.receiveShadow = !isSoftwareGl;
    trackGroup.add(grassMesh);

    // Dirt / Sand racetrack surface
    const trackCanvas = document.createElement('canvas');
    trackCanvas.width = 512;
    trackCanvas.height = 512;
    const tctx = trackCanvas.getContext('2d');
    if (tctx) {
      tctx.fillStyle = '#b47e43'; // sand-dirt base
      tctx.fillRect(0, 0, 512, 512);
      // Speckles
      for (let i = 0; i < 4000; i++) {
        tctx.fillStyle = Math.random() > 0.5 ? '#96632d' : '#cca06d';
        tctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }
    }
    const trackTexture = new THREE.CanvasTexture(trackCanvas);
    trackTexture.wrapS = THREE.RepeatWrapping;
    trackTexture.wrapT = THREE.RepeatWrapping;
    trackTexture.repeat.set(16, 2);
    trackTexture.colorSpace = THREE.SRGBColorSpace;

    const trackGeo = new THREE.PlaneGeometry(TRACK_LENGTH + 20, trackWidth);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshStandardMaterial({
      map: trackTexture,
      roughness: 0.9,
      metalness: 0.05,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.position.set(TRACK_LENGTH / 2, 0.01, 0);
    trackMesh.receiveShadow = !isSoftwareGl;
    trackGroup.add(trackMesh);

    // Lane dividing lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    for (let i = 0; i <= totalLanes; i++) {
      const z = -trackWidth / 2 + 1.5 + i * LANE_WIDTH;
      const lineGeo = new THREE.PlaneGeometry(TRACK_LENGTH + 18, 0.12);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(TRACK_LENGTH / 2, 0.02, z);
      trackGroup.add(lineMesh);
    }

    // White safety rails (Fence along both sides)
    const createRail = (zPos: number) => {
      const railGroup = new THREE.Group();
      const railMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      
      // Horizontal pipes
      for (let h of [0.45, 0.85, 1.25]) {
        const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, TRACK_LENGTH + 24, 8);
        pipeGeo.rotateZ(Math.PI / 2);
        const pipe = new THREE.Mesh(pipeGeo, railMat);
        pipe.position.set(TRACK_LENGTH / 2, h, zPos);
        railGroup.add(pipe);
      }

      // Vertical posts every 4 meters
      for (let x = -8; x <= TRACK_LENGTH + 14; x += 4) {
        const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.35, 8);
        const post = new THREE.Mesh(postGeo, railMat);
        post.position.set(x, 0.675, zPos);
        railGroup.add(post);
      }
      return railGroup;
    };
    trackGroup.add(createRail(-trackWidth / 2 + 0.5));
    trackGroup.add(createRail(trackWidth / 2 - 0.5));

    // STARTING GATE STALLS (X = 0)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-2, 0, 0);
    const gateFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.7, roughness: 0.3 });
    const gatePillarGeo = new THREE.BoxGeometry(0.4, 3.8, 0.4);

    for (let i = 0; i <= totalLanes; i++) {
      const z = -trackWidth / 2 + 1.5 + i * LANE_WIDTH;
      const pillar = new THREE.Mesh(gatePillarGeo, gateFrameMat);
      pillar.position.set(0, 1.9, z);
      gateGroup.add(pillar);

      if (i < totalLanes) {
        // Stall Number Plate
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const c = canvas.getContext('2d');
        if (c) {
          c.fillStyle = '#1e3a8a';
          c.fillRect(0, 0, 128, 128);
          c.fillStyle = '#facc15';
          c.font = 'bold 80px sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(`${i + 1}`, 64, 64);
        }
        const tex = new THREE.CanvasTexture(canvas);
        const numMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.8),
          new THREE.MeshBasicMaterial({ map: tex })
        );
        numMesh.position.set(0.22, 3.2, z + LANE_WIDTH / 2);
        gateGroup.add(numMesh);
      }
    }
    // Top crossbeam
    const beamGeo = new THREE.BoxGeometry(0.4, 0.4, trackWidth);
    const topBeam = new THREE.Mesh(beamGeo, gateFrameMat);
    topBeam.position.set(0, 3.8, 0);
    gateGroup.add(topBeam);
    trackGroup.add(gateGroup);

    // FINISH LINE ARCH & BANNER (X = TRACK_LENGTH)
    const finishArchGroup = new THREE.Group();
    finishArchGroup.position.set(TRACK_LENGTH, 0, 0);

    const archMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.5, roughness: 0.3 });
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 0.8), archMat);
    leftPillar.position.set(0, 3.75, -trackWidth / 2);
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 0.8), archMat);
    rightPillar.position.set(0, 3.75, trackWidth / 2);
    finishArchGroup.add(leftPillar);
    finishArchGroup.add(rightPillar);

    const archTopBeam = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, trackWidth + 1), archMat);
    archTopBeam.position.set(0, 7.2, 0);
    finishArchGroup.add(archTopBeam);

    // Digital LED Banner
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 256;
    const bctx = bannerCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#0f172a';
      bctx.fillRect(0, 0, 1024, 256);
      bctx.strokeStyle = '#eab308';
      bctx.lineWidth = 12;
      bctx.strokeRect(6, 6, 1012, 244);
      bctx.fillStyle = '#f59e0b';
      bctx.font = 'bold 88px sans-serif';
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.fillText('🏁 VỀ ĐÍCH - TRI THỨC THPT 🏁', 512, 128);
    }
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    bannerTex.colorSpace = THREE.SRGBColorSpace;
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth - 1, 2.2),
      new THREE.MeshBasicMaterial({ map: bannerTex })
    );
    bannerMesh.position.set(-0.45, 6.0, 0);
    finishArchGroup.add(bannerMesh);

    // Checkered finish line pattern on ground
    const finishLineGeo = new THREE.PlaneGeometry(1.8, trackWidth);
    finishLineGeo.rotateX(-Math.PI / 2);
    const chkCanvas = document.createElement('canvas');
    chkCanvas.width = 128;
    chkCanvas.height = 256;
    const chkCtx = chkCanvas.getContext('2d');
    if (chkCtx) {
      chkCtx.fillStyle = '#ffffff';
      chkCtx.fillRect(0, 0, 128, 256);
      chkCtx.fillStyle = '#000000';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 4; c++) {
          if ((r + c) % 2 === 0) {
            chkCtx.fillRect(c * 32, r * 32, 32, 32);
          }
        }
      }
    }
    const chkTex = new THREE.CanvasTexture(chkCanvas);
    chkTex.wrapS = THREE.RepeatWrapping;
    chkTex.wrapT = THREE.RepeatWrapping;
    chkTex.repeat.set(1, 8);
    const finishLineMesh = new THREE.Mesh(finishLineGeo, new THREE.MeshBasicMaterial({ map: chkTex }));
    finishLineMesh.position.set(0, 0.03, 0);
    finishArchGroup.add(finishLineMesh);

    trackGroup.add(finishArchGroup);

    // STEEPLE HURDLES (HÀNG RÀO GỖ CHƯỚNG NGẠI VẬT)
    // Placed at X = 50m and X = 85m for "Vận dụng cao" jump milestones!
    const createHurdleRow = (xPos: number) => {
      const hurdleRow = new THREE.Group();
      hurdleRow.position.set(xPos, 0, 0);
      const hurdleWoodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
      const greenBrushMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });

      for (let i = 0; i < totalLanes; i++) {
        const laneZ = -trackWidth / 2 + 1.5 + i * LANE_WIDTH + LANE_WIDTH / 2;
        // Wooden frame barrier
        const barGeo = new THREE.BoxGeometry(0.3, 0.85, LANE_WIDTH - 0.4);
        const barrier = new THREE.Mesh(barGeo, hurdleWoodMat);
        barrier.position.set(0, 0.45, laneZ);
        barrier.castShadow = !isSoftwareGl;
        hurdleRow.add(barrier);

        // Green hedge brush top
        const brushGeo = new THREE.BoxGeometry(0.4, 0.35, LANE_WIDTH - 0.3);
        const brush = new THREE.Mesh(brushGeo, greenBrushMat);
        brush.position.set(0, 0.95, laneZ);
        hurdleRow.add(brush);
      }
      return hurdleRow;
    };
    trackGroup.add(createHurdleRow(50));
    trackGroup.add(createHurdleRow(85));

    // STADIUM GRANDSTAND ALONG THE SIDES (Khán đài cổ động viên)
    const standGroup = new THREE.Group();
    standGroup.position.set(TRACK_LENGTH / 2, 0, trackWidth / 2 + 7);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    for (let step = 0; step < 5; step++) {
      const stepGeo = new THREE.BoxGeometry(TRACK_LENGTH + 30, 0.8, 1.6);
      const stepMesh = new THREE.Mesh(stepGeo, standMat);
      stepMesh.position.set(0, step * 0.8 + 0.4, step * 1.6);
      standGroup.add(stepMesh);
    }
    // Cheering Banner along stadium
    const stdBannerCanvas = document.createElement('canvas');
    stdBannerCanvas.width = 1024;
    stdBannerCanvas.height = 128;
    const sctx = stdBannerCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#dc2626';
      sctx.fillRect(0, 0, 1024, 128);
      sctx.fillStyle = '#fef08a';
      sctx.font = 'bold 54px sans-serif';
      sctx.textAlign = 'center';
      sctx.textBaseline = 'middle';
      sctx.fillText('★ CHÚC CÁC SĨ TỬ THI TỐT - TỰ TIN BỨT PHÁ ĐIỂM 10 ★', 512, 64);
    }
    const stdTex = new THREE.CanvasTexture(stdBannerCanvas);
    const stdBannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(TRACK_LENGTH + 20, 2.5),
      new THREE.MeshBasicMaterial({ map: stdTex })
    );
    stdBannerMesh.position.set(0, 4.8, 8.2);
    standGroup.add(stdBannerMesh);
    trackGroup.add(standGroup);

    // Floodlight Towers
    for (let lx of [15, 55, 95]) {
      const tower = new THREE.Group();
      tower.position.set(lx, 0, -trackWidth / 2 - 4);
      const poleGeo = new THREE.CylinderGeometry(0.2, 0.35, 14, 8);
      const poleMesh = new THREE.Mesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 }));
      poleMesh.position.y = 7;
      tower.add(poleMesh);

      const lampHeadGeo = new THREE.BoxGeometry(2.4, 1.2, 0.8);
      const lampHead = new THREE.Mesh(lampHeadGeo, new THREE.MeshStandardMaterial({ color: 0x334155 }));
      lampHead.position.set(0, 14, 0);
      lampHead.rotation.x = Math.PI / 6;
      tower.add(lampHead);

      const lightBulb = new THREE.PointLight(0xfffae0, 1.2, 35);
      lightBulb.position.set(0, 13.8, 0.6);
      tower.add(lightBulb);
      trackGroup.add(tower);
    }

    scene.add(trackGroup);

    // DUST PARTICLE SYSTEM (kicking behind galloping hooves)
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = -999;
      particlePositions[i * 3 + 1] = -999;
      particlePositions[i * 3 + 2] = -999;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xc89d6b,
      size: 0.28,
      transparent: true,
      opacity: 0.65,
    });
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(dustParticles);
    dustParticlesRef.current = dustParticles;

    // 5. Build Horse 3D Rigs
    const horseMap = new Map<string, Horse3D>();
    teams.forEach((team) => {
      const horse = new Horse3D(team);
      const laneZ = -trackWidth / 2 + 1.5 + team.laneIndex * LANE_WIDTH + LANE_WIDTH / 2;
      horse.setLaneAndProgress(laneZ, TRACK_LENGTH, team.progress);
      scene.add(horse.group);
      horseMap.set(team.id, horse);
    });
    horsesRef.current = horseMap;

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 6. Animation Loop
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Handle Hurdle Jump
      let isAnyJumping = false;
      let jumpProg = 0;
      let jumpTeamId = '';
      if (jumpStateRef.current) {
        const elapsed = now - jumpStateRef.current.startTime;
        jumpProg = Math.min(elapsed / jumpStateRef.current.duration, 1.0);
        jumpTeamId = jumpStateRef.current.teamId;
        isAnyJumping = true;

        if (jumpProg >= 1.0) {
          const completedId = jumpStateRef.current.teamId;
          jumpStateRef.current = null;
          if (onJumpComplete) onJumpComplete(completedId);
        }
      }

      // Update horses position and kinematics
      let leadX = 0;
      let leadZ = 0;

      horsesRef.current.forEach((horse, teamId) => {
        const teamData = teams.find((t) => t.id === teamId);
        if (teamData) {
          horse.team = teamData;
          const laneZ = -trackWidth / 2 + 1.5 + teamData.laneIndex * LANE_WIDTH + LANE_WIDTH / 2;
          horse.setLaneAndProgress(laneZ, TRACK_LENGTH, teamData.progress);

          const isThisHorseJumping = isAnyJumping && jumpTeamId === teamId;
          horse.update(delta, isRacing, isThisHorseJumping, jumpProg);

          const curX = horse.group.position.x;
          if (curX > leadX) {
            leadX = curX;
            leadZ = laneZ;
          }
        }
      });

      // Update Dust particles behind active horses
      if (dustParticlesRef.current && isRacing) {
        const posAttr = dustParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        horsesRef.current.forEach((horse) => {
          if (Math.random() > 0.4) {
            const pIdx = Math.floor(Math.random() * particleCount);
            arr[pIdx * 3] = horse.group.position.x - 0.8 - Math.random() * 0.4;
            arr[pIdx * 3 + 1] = 0.1 + Math.random() * 0.4;
            arr[pIdx * 3 + 2] = horse.group.position.z + (Math.random() - 0.5) * 0.4;
          }
        });
        posAttr.needsUpdate = true;
      }

      // Dynamic Camera Positioning
      if (cameraRef.current) {
        const cam = cameraRef.current;
        let targetX = 15;
        let targetY = 12;
        let targetZ = 18;
        let lookX = leadX + 4;
        let lookY = 2;
        let lookZ = 0;

        if (isAnyJumping) {
          // Slow-mo dramatic cinematic jump cam!
          targetX = leadX - 3.5;
          targetY = 2.8;
          targetZ = leadZ + 4.5;
          lookX = leadX + 2;
          lookY = 3.2;
          lookZ = leadZ;
        } else if (cameraMode === 'chase') {
          // Bám đuôi kịch tính: Behind leaders
          targetX = leadX - 7;
          targetY = 4.2;
          targetZ = leadZ + 1.2;
          lookX = leadX + 12;
          lookY = 1.8;
          lookZ = leadZ;
        } else if (cameraMode === 'broadcast') {
          // Góc đài truyền hình: Lateral tracking smoothly
          targetX = leadX - 4;
          targetY = 8.5;
          targetZ = trackWidth / 2 + 14;
          lookX = leadX + 6;
          lookY = 1.5;
          lookZ = leadZ * 0.4;
        } else if (cameraMode === 'overhead') {
          // Toàn cảnh từ trên cao: High birds-eye angle
          targetX = leadX + 5;
          targetY = 26;
          targetZ = 0.5;
          lookX = leadX + 8;
          lookY = 0;
          lookZ = 0;
        } else {
          // Dynamic camera: auto-switches based on race milestones
          if (leadX > TRACK_LENGTH * 0.85) {
            // Finish sprint!
            targetX = TRACK_LENGTH + 4;
            targetY = 3.5;
            targetZ = -4;
            lookX = leadX;
            lookY = 2.0;
            lookZ = leadZ;
          } else {
            targetX = leadX - 6;
            targetY = 7.5;
            targetZ = trackWidth / 2 + 10;
            lookX = leadX + 6;
            lookY = 2.0;
            lookZ = 0;
          }
        }

        camTargetPos.current.set(targetX, targetY, targetZ);
        camLookAtPos.current.set(lookX, lookY, lookZ);

        cam.position.lerp(camTargetPos.current, 0.06);
        const curLook = new THREE.Vector3();
        cam.getWorldDirection(curLook);
        const desiredLook = camLookAtPos.current.clone().sub(cam.position).normalize();
        curLook.lerp(desiredLook, 0.08);
        cam.lookAt(cam.position.clone().add(curLook.multiplyScalar(20)));
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [totalLanes]);

  // Sync teams changes to horses
  useEffect(() => {
    teams.forEach((team) => {
      const horse = horsesRef.current.get(team.id);
      if (horse) {
        horse.team = team;
      }
    });
  }, [teams]);

  return (
    <div className="relative w-full h-full min-h-[420px] overflow-hidden bg-slate-900 select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
