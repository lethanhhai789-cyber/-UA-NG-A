import * as THREE from 'three';
import { Team } from '../../types';

// Palette for horse breeds and coat colors
const HORSE_COAT_COLORS: Record<string, { body: number; mane: number; hoof: number; muzzle: number }> = {
  white: { body: 0xf3f4f6, mane: 0xffffff, hoof: 0x4b5563, muzzle: 0xd1d5db }, // Bạch Mã
  red_chestnut: { body: 0xa83220, mane: 0x6e1b0c, hoof: 0x2b1308, muzzle: 0x7a2414 }, // Xích Thố
  gold: { body: 0xd99b26, mane: 0xf5ecc4, hoof: 0x4a320c, muzzle: 0xad7617 }, // Kim Mã
  palomino: { body: 0x2e8b57, mane: 0x195232, hoof: 0x11291b, muzzle: 0x1f663c }, // Lục Mã (stylized team coat)
  black: { body: 0x1f2937, mane: 0x111827, hoof: 0x030712, muzzle: 0x374151 }, // Hắc Mã
  brown: { body: 0x0891b2, mane: 0x164e63, hoof: 0x083344, muzzle: 0x0e7490 }, // Phi Long
  dappled: { body: 0xea580c, mane: 0x9a3412, hoof: 0x431407, muzzle: 0xc2410c }, // Phượng Hoàng
  grey: { body: 0xdb2777, mane: 0x9d174d, hoof: 0x500724, muzzle: 0xbe185d }, // Hùng Kê
};

export class Horse3D {
  public group: THREE.Group;
  public team: Team;
  
  // Joints for procedural kinematics
  private neckJoint: THREE.Group;
  private headJoint: THREE.Group;
  private tailJoint: THREE.Group;
  private maneMesh: THREE.Mesh;
  
  // Leg joints
  private frontLeftShoulder: THREE.Group;
  private frontLeftKnee: THREE.Group;
  private frontRightShoulder: THREE.Group;
  private frontRightKnee: THREE.Group;

  private rearLeftHip: THREE.Group;
  private rearLeftHock: THREE.Group;
  private rearRightHip: THREE.Group;
  private rearRightHock: THREE.Group;

  // Jockey
  private jockeyTorso: THREE.Group;

  // Dust emitter hook
  public hoofPositions: THREE.Vector3[] = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];

  constructor(team: Team) {
    this.team = team;
    this.group = new THREE.Group();
    this.group.name = `horse_team_${team.id}`;

    const coat = HORSE_COAT_COLORS[team.horseColor] || HORSE_COAT_COLORS.white;
    const teamColorNum = parseInt(team.colorHex.replace('#', '0x'), 16);
    const clothColorNum = parseInt(team.clothColorHex.replace('#', '0x'), 16);
    const jockeyColorNum = parseInt(team.jockeyColorHex.replace('#', '0x'), 16);

    // Shared PBR materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: coat.body,
      roughness: 0.55,
      metalness: 0.1,
    });

    const maneMat = new THREE.MeshStandardMaterial({
      color: coat.mane,
      roughness: 0.85,
      metalness: 0.05,
    });

    const hoofMat = new THREE.MeshStandardMaterial({
      color: coat.hoof,
      roughness: 0.35,
      metalness: 0.3,
    });

    const muzzleMat = new THREE.MeshStandardMaterial({
      color: coat.muzzle,
      roughness: 0.7,
      metalness: 0.05,
    });

    const saddleMat = new THREE.MeshStandardMaterial({
      color: 0x221810,
      roughness: 0.4,
      metalness: 0.2,
    });

    const saddleClothMat = new THREE.MeshStandardMaterial({
      color: clothColorNum,
      roughness: 0.7,
      metalness: 0.1,
    });

    const jockeyJerseyMat = new THREE.MeshStandardMaterial({
      color: teamColorNum,
      roughness: 0.6,
      metalness: 0.1,
    });

    const jockeyPantsMat = new THREE.MeshStandardMaterial({
      color: 0xf9fafb, // white race silks pants
      roughness: 0.7,
      metalness: 0.05,
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: teamColorNum,
      roughness: 0.2,
      metalness: 0.4,
    });

    // 1. Torso Group (Center of horse body)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.35; // height above track

    // Muscular main body barrel
    const barrelGeo = new THREE.CylinderGeometry(0.42, 0.46, 1.45, 12);
    barrelGeo.rotateZ(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, bodyMat);
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    torsoGroup.add(barrelMesh);

    // Chest expansion
    const chestGeo = new THREE.SphereGeometry(0.46, 10, 8);
    chestGeo.scale(1.1, 1.15, 0.95);
    const chestMesh = new THREE.Mesh(chestGeo, bodyMat);
    chestMesh.position.set(0.65, 0.05, 0);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Rump / hindquarters
    const rumpGeo = new THREE.SphereGeometry(0.45, 10, 8);
    rumpGeo.scale(1.15, 1.1, 0.95);
    const rumpMesh = new THREE.Mesh(rumpGeo, bodyMat);
    rumpMesh.position.set(-0.65, 0.05, 0);
    rumpMesh.castShadow = true;
    torsoGroup.add(rumpMesh);

    // Saddle Cloth & Saddle
    const saddleClothGeo = new THREE.BoxGeometry(0.75, 0.55, 0.92);
    const saddleClothMesh = new THREE.Mesh(saddleClothGeo, saddleClothMat);
    saddleClothMesh.position.set(0.05, 0.15, 0);
    torsoGroup.add(saddleClothMesh);

    const saddleGeo = new THREE.BoxGeometry(0.45, 0.15, 0.55);
    const saddleMesh = new THREE.Mesh(saddleGeo, saddleMat);
    saddleMesh.position.set(0.05, 0.45, 0);
    torsoGroup.add(saddleMesh);

    // Team Number Decal badge on saddlecloth
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 128, 128);
      ctx.lineWidth = 10;
      ctx.strokeStyle = team.colorHex;
      ctx.strokeRect(6, 6, 116, 116);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 74px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${team.laneIndex + 1}`, 64, 66);
    }
    const numTex = new THREE.CanvasTexture(canvas);
    numTex.colorSpace = THREE.SRGBColorSpace;
    const numMat = new THREE.MeshBasicMaterial({ map: numTex });
    const numPlaneGeo = new THREE.PlaneGeometry(0.26, 0.26);
    const numLeft = new THREE.Mesh(numPlaneGeo, numMat);
    numLeft.position.set(0.05, 0.18, 0.47);
    torsoGroup.add(numLeft);
    const numRight = new THREE.Mesh(numPlaneGeo, numMat);
    numRight.position.set(0.05, 0.18, -0.47);
    numRight.rotation.y = Math.PI;
    torsoGroup.add(numRight);

    // 2. Neck & Head Hierarchy
    this.neckJoint = new THREE.Group();
    this.neckJoint.position.set(0.7, 0.22, 0);
    this.neckJoint.rotation.z = Math.PI / 4; // angled upward forward

    const neckGeo = new THREE.CylinderGeometry(0.24, 0.35, 0.85, 10);
    const neckMesh = new THREE.Mesh(neckGeo, bodyMat);
    neckMesh.position.y = 0.4;
    neckMesh.castShadow = true;
    this.neckJoint.add(neckMesh);

    // Flowing Mane along neck crest
    const maneGeo = new THREE.BoxGeometry(0.12, 0.85, 0.1);
    this.maneMesh = new THREE.Mesh(maneGeo, maneMat);
    this.maneMesh.position.set(-0.2, 0.45, 0);
    this.neckJoint.add(this.maneMesh);

    // Head Joint at top of neck
    this.headJoint = new THREE.Group();
    this.headJoint.position.set(0, 0.82, 0);
    this.headJoint.rotation.z = -Math.PI / 3; // head tilts slightly downward

    const headGeo = new THREE.BoxGeometry(0.48, 0.28, 0.28);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.x = 0.2;
    headMesh.castShadow = true;
    this.headJoint.add(headMesh);

    // Muzzle & nostrils
    const muzzleGeo = new THREE.BoxGeometry(0.28, 0.22, 0.24);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzleMesh.position.x = 0.48;
    this.headJoint.add(muzzleMesh);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.06, 0.2, 4);
    const earLeft = new THREE.Mesh(earGeo, bodyMat);
    earLeft.position.set(-0.02, 0.22, 0.1);
    earLeft.rotation.z = -0.2;
    this.headJoint.add(earLeft);
    const earRight = new THREE.Mesh(earGeo, bodyMat);
    earRight.position.set(-0.02, 0.22, -0.1);
    earRight.rotation.z = -0.2;
    this.headJoint.add(earRight);

    this.neckJoint.add(this.headJoint);
    torsoGroup.add(this.neckJoint);

    // 3. Tail Group (Fluttering in wind)
    this.tailJoint = new THREE.Group();
    this.tailJoint.position.set(-0.85, 0.2, 0);
    this.tailJoint.rotation.z = -Math.PI / 6;

    const tailGeo = new THREE.ConeGeometry(0.18, 0.95, 8);
    tailGeo.rotateZ(Math.PI);
    const tailMesh = new THREE.Mesh(tailGeo, maneMat);
    tailMesh.position.set(-0.25, -0.4, 0);
    this.tailJoint.add(tailMesh);
    torsoGroup.add(this.tailJoint);

    // 4. Jockey Figure (Lean aerodynamic racing pose)
    this.jockeyTorso = new THREE.Group();
    this.jockeyTorso.position.set(0.1, 0.65, 0);
    this.jockeyTorso.rotation.z = 0.5; // crouched forward

    // Jockey chest & jersey
    const jChestGeo = new THREE.BoxGeometry(0.32, 0.42, 0.35);
    const jChestMesh = new THREE.Mesh(jChestGeo, jockeyJerseyMat);
    jChestMesh.castShadow = true;
    this.jockeyTorso.add(jChestMesh);

    // Jockey head & helmet
    const jHeadGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const jHeadMesh = new THREE.Mesh(jHeadGeo, helmetMat);
    jHeadMesh.position.set(0.08, 0.35, 0);
    this.jockeyTorso.add(jHeadMesh);

    // Jockey legs gripping sides
    const jLegGeo = new THREE.BoxGeometry(0.14, 0.42, 0.12);
    const jLegLeft = new THREE.Mesh(jLegGeo, jockeyPantsMat);
    jLegLeft.position.set(-0.05, -0.22, 0.22);
    jLegLeft.rotation.x = -0.4;
    this.jockeyTorso.add(jLegLeft);

    const jLegRight = new THREE.Mesh(jLegGeo, jockeyPantsMat);
    jLegRight.position.set(-0.05, -0.22, -0.22);
    jLegRight.rotation.x = 0.4;
    this.jockeyTorso.add(jLegRight);

    // Jockey arms holding reins
    const jArmGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
    jArmGeo.rotateZ(-Math.PI / 3);
    const jArmLeft = new THREE.Mesh(jArmGeo, jockeyJerseyMat);
    jArmLeft.position.set(0.2, 0.08, 0.2);
    this.jockeyTorso.add(jArmLeft);

    const jArmRight = new THREE.Mesh(jArmGeo, jockeyJerseyMat);
    jArmRight.position.set(0.2, 0.08, -0.2);
    this.jockeyTorso.add(jArmRight);

    torsoGroup.add(this.jockeyTorso);

    // 5. Four Articulated Legs
    const createForeleg = (isLeft: boolean) => {
      const zOffset = isLeft ? 0.32 : -0.32;
      const shoulder = new THREE.Group();
      shoulder.position.set(0.6, -0.15, zOffset);

      // Upper leg
      const upperGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.6, 8);
      const upper = new THREE.Mesh(upperGeo, bodyMat);
      upper.position.y = -0.28;
      upper.castShadow = true;
      shoulder.add(upper);

      // Knee Joint
      const knee = new THREE.Group();
      knee.position.y = -0.55;

      // Lower cannon bone
      const lowerGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.65, 8);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.position.y = -0.3;
      lower.castShadow = true;
      knee.add(lower);

      // Hoof
      const hoofGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.15, 8);
      const hoof = new THREE.Mesh(hoofGeo, hoofMat);
      hoof.position.y = -0.62;
      hoof.castShadow = true;
      knee.add(hoof);

      shoulder.add(knee);
      torsoGroup.add(shoulder);
      return { shoulder, knee };
    };

    const createHindleg = (isLeft: boolean) => {
      const zOffset = isLeft ? 0.34 : -0.34;
      const hip = new THREE.Group();
      hip.position.set(-0.6, -0.12, zOffset);

      // Upper thigh (powerful muscular cylinder)
      const thighGeo = new THREE.CylinderGeometry(0.16, 0.1, 0.65, 8);
      const thigh = new THREE.Mesh(thighGeo, bodyMat);
      thigh.position.y = -0.28;
      thigh.castShadow = true;
      hip.add(thigh);

      // Hock Joint
      const hock = new THREE.Group();
      hock.position.y = -0.55;

      // Lower cannon bone
      const lowerGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.65, 8);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.position.y = -0.3;
      lower.castShadow = true;
      hock.add(lower);

      // Hoof
      const hoofGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.15, 8);
      const hoof = new THREE.Mesh(hoofGeo, hoofMat);
      hoof.position.y = -0.62;
      hoof.castShadow = true;
      hock.add(hoof);

      hip.add(hock);
      torsoGroup.add(hip);
      return { hip, hock };
    };

    const fl = createForeleg(true);
    this.frontLeftShoulder = fl.shoulder;
    this.frontLeftKnee = fl.knee;

    const fr = createForeleg(false);
    this.frontRightShoulder = fr.shoulder;
    this.frontRightKnee = fr.knee;

    const rl = createHindleg(true);
    this.rearLeftHip = rl.hip;
    this.rearLeftHock = rl.hock;

    const rr = createHindleg(false);
    this.rearRightHip = rr.hip;
    this.rearRightHock = rr.hock;

    this.group.add(torsoGroup);
  }

  /**
   * Update galloping kinematics & hurdle jump animation per frame
   */
  public update(delta: number, isRacing: boolean, isJumping: boolean, jumpProgress: number) {
    const time = performance.now() * 0.001;
    const gallopSpeed = isRacing ? 12 : 2; // gallop frequency
    const cycle = (time * gallopSpeed) % (Math.PI * 2);

    const torso = this.group.children[0];

    if (isJumping) {
      // ⚡ VƯỢT RÀO VẬN DỤNG CAO ANIMATION ARC
      // jumpProgress ranges from 0.0 to 1.0 over ~1.8 seconds
      const p = jumpProgress;

      // Parabolic jump arc height: peaks at 2.6m
      const jumpHeight = Math.sin(p * Math.PI) * 2.6;
      torso.position.y = 1.35 + jumpHeight;

      if (p < 0.35) {
        // Takeoff phase: body pitches up ~30 degrees, front legs tuck
        const t = p / 0.35;
        torso.rotation.z = THREE.MathUtils.lerp(0, 0.52, t);
        this.frontLeftShoulder.rotation.z = -0.9;
        this.frontLeftKnee.rotation.z = 1.2; // tuck hooves
        this.frontRightShoulder.rotation.z = -0.8;
        this.frontRightKnee.rotation.z = 1.1;

        this.rearLeftHip.rotation.z = 0.8 * (1 - t);
        this.rearRightHip.rotation.z = 0.7 * (1 - t);
        this.neckJoint.rotation.z = THREE.MathUtils.lerp(Math.PI / 4, 0.4, t);
      } else if (p < 0.7) {
        // Apex clearing hurdle: streamlined horizontal flight
        const t = (p - 0.35) / 0.35;
        torso.rotation.z = THREE.MathUtils.lerp(0.52, -0.2, t);
        this.frontLeftShoulder.rotation.z = 0.4;
        this.frontLeftKnee.rotation.z = 0.4;
        this.frontRightShoulder.rotation.z = 0.3;
        this.frontRightKnee.rotation.z = 0.3;

        this.rearLeftHip.rotation.z = -0.7;
        this.rearLeftHock.rotation.z = -0.8; // rear legs tuck back
        this.rearRightHip.rotation.z = -0.6;
        this.rearRightHock.rotation.z = -0.7;
        this.tailJoint.rotation.z = 0.3;
      } else {
        // Landing phase: front legs extend forward, then smooth recovery
        const t = (p - 0.7) / 0.3;
        torso.rotation.z = THREE.MathUtils.lerp(-0.2, 0, t);
        this.frontLeftShoulder.rotation.z = THREE.MathUtils.lerp(0.5, 0, t);
        this.frontRightShoulder.rotation.z = THREE.MathUtils.lerp(0.4, 0, t);
        this.rearLeftHip.rotation.z = THREE.MathUtils.lerp(-0.4, 0, t);
        this.rearRightHip.rotation.z = THREE.MathUtils.lerp(-0.3, 0, t);
      }

      // Jockey crouches tight to horse during jump
      this.jockeyTorso.rotation.z = 0.75;
      return;
    }

    // Normal Gallop Kinematics
    if (isRacing) {
      // Torso bobbing and pitch in 4-beat rhythm
      torso.position.y = 1.35 + Math.sin(cycle * 2) * 0.12;
      torso.rotation.z = Math.sin(cycle) * 0.08;

      // Neck bobbing
      this.neckJoint.rotation.z = Math.PI / 4 + Math.sin(cycle) * 0.14;
      this.headJoint.rotation.z = -Math.PI / 3 - Math.sin(cycle) * 0.1;

      // Tail and mane fluttering
      this.tailJoint.rotation.z = -Math.PI / 6 + Math.sin(cycle * 2) * 0.25;
      this.tailJoint.rotation.y = Math.cos(cycle) * 0.15;
      this.maneMesh.rotation.y = Math.sin(cycle * 3) * 0.1;

      // Jockey sway
      this.jockeyTorso.rotation.z = 0.48 + Math.sin(cycle) * 0.1;

      // 4-Leg Gallop Gait Phase Offsets
      // Front Left
      const flPhase = cycle;
      this.frontLeftShoulder.rotation.z = Math.sin(flPhase) * 0.75;
      this.frontLeftKnee.rotation.z = Math.max(0, Math.sin(flPhase - 0.8)) * 1.1;

      // Front Right (trailing)
      const frPhase = cycle + 0.6;
      this.frontRightShoulder.rotation.z = Math.sin(frPhase) * 0.75;
      this.frontRightKnee.rotation.z = Math.max(0, Math.sin(frPhase - 0.8)) * 1.1;

      // Rear Left
      const rlPhase = cycle + 2.8;
      this.rearLeftHip.rotation.z = Math.sin(rlPhase) * 0.8;
      this.rearLeftHock.rotation.z = Math.max(0, -Math.sin(rlPhase + 0.5)) * 1.1;

      // Rear Right
      const rrPhase = cycle + 3.4;
      this.rearRightHip.rotation.z = Math.sin(rrPhase) * 0.8;
      this.rearRightHock.rotation.z = Math.max(0, -Math.sin(rrPhase + 0.5)) * 1.1;
    } else {
      // Idle / ready stance
      torso.position.y = 1.35 + Math.sin(time * 2) * 0.02;
      torso.rotation.z = 0;
      this.neckJoint.rotation.z = Math.PI / 4 + Math.sin(time * 2.5) * 0.04;
      this.tailJoint.rotation.z = -Math.PI / 6 + Math.sin(time * 1.8) * 0.08;

      this.frontLeftShoulder.rotation.z = 0;
      this.frontLeftKnee.rotation.z = 0;
      this.frontRightShoulder.rotation.z = 0;
      this.frontRightKnee.rotation.z = 0;
      this.rearLeftHip.rotation.z = 0;
      this.rearLeftHock.rotation.z = 0;
      this.rearRightHip.rotation.z = 0;
      this.rearRightHock.rotation.z = 0;
    }
  }

  public setLaneAndProgress(laneZ: number, trackLength: number, progressPercent: number) {
    // 0% = start line (X = 0), 100% = finish line (X = trackLength)
    const posX = (progressPercent / 100) * trackLength;
    this.group.position.set(posX, 0, laneZ);
  }
}
