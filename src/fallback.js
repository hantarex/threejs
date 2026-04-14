import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

async function loadColorTextures() {
  try {
    const colorMap = await textureLoader.loadAsync('/textures/ak47/color.png');
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.flipY = false;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    return colorMap;
  } catch (err) {
    console.warn('Could not load color texture, using fallback colors');
    return null;
  }
}

function createMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base metal color with grain
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 512, 512);

  // Add subtle scratches and grain
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.random() * 20, y + Math.random() * 3);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Wood grain
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical grain pattern
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < 512; i += 8) {
    ctx.fillRect(i, 0, 2, 512);
  }

  // Random wood grain
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
    ctx.fillRect(x, y, Math.random() * 50, Math.random() * 10);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export async function createFallbackWeapon(scene) {
  const group = new THREE.Group();

  const metalTexture = createMetalTexture();
  const woodTexture = createWoodTexture();
  const colorTexture = await loadColorTextures();

  // Main receiver body (steel) - use Fire Serpent texture if available
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: colorTexture ? 0xffffff : 0x2a2a2a,
    metalness: colorTexture ? 0.6 : 0.92,
    roughness: colorTexture ? 0.6 : 0.25,
    map: colorTexture || metalTexture,
  });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.16, 0.1),
    bodyMaterial
  );
  group.add(body);

  // Barrel (shiny steel)
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.75, 16),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.98,
      roughness: 0.15,
    })
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(1.0, 0.02, 0);
  group.add(barrel);

  // Barrel tip (muzzle brake)
  const muzzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.038, 0.12, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.95,
      roughness: 0.2,
    })
  );
  muzzle.rotation.z = Math.PI / 2;
  muzzle.position.set(1.42, 0.02, 0);
  group.add(muzzle);

  // Gas tube above barrel
  const gasBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.08, 0.07),
    new THREE.MeshStandardMaterial({
      color: 0x1f1f1f,
      metalness: 0.85,
      roughness: 0.35,
    })
  );
  gasBlock.position.set(0.9, 0.12, 0);
  group.add(gasBlock);

  // Stock (wood/polymer) - use Fire Serpent texture if available
  const stockMaterial = new THREE.MeshStandardMaterial({
    color: colorTexture ? 0xffffff : 0xa0754a,
    metalness: 0.05,
    roughness: 0.85,
    map: colorTexture || woodTexture,
  });
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.2, 0.08),
    stockMaterial
  );
  stock.position.set(-0.75, -0.02, 0);
  group.add(stock);

  // Stock metal attachment
  const stockMetal = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.3,
    })
  );
  stockMetal.position.set(-0.45, -0.03, 0);
  group.add(stockMetal);

  // Pistol grip
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.25, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.2,
      roughness: 0.6,
    })
  );
  grip.rotation.z = 0.3;
  grip.position.set(-0.08, -0.22, 0);
  group.add(grip);

  // Magazine (curved)
  const magazine = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.35, 0.065),
    new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      metalness: 0.5,
      roughness: 0.6,
    })
  );
  magazine.position.set(0.0, -0.25, 0);
  group.add(magazine);

  // Charging handle (bolt carrier)
  const chargeHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.25,
    })
  );
  chargeHandle.position.set(0.5, 0.15, 0);
  group.add(chargeHandle);

  // Charging handle rod
  const chargeRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.92,
      roughness: 0.2,
    })
  );
  chargeRod.rotation.z = Math.PI / 2;
  chargeRod.position.set(0.35, 0.15, 0);
  group.add(chargeRod);

  // Dust cover / upper receiver
  const dustCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.06, 0.09),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.3,
    })
  );
  dustCover.position.set(0.5, 0.12, 0);
  group.add(dustCover);

  // Side rail mount
  const sideRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.04, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.88,
      roughness: 0.28,
    })
  );
  sideRail.position.set(0.5, 0.09, 0.07);
  group.add(sideRail);

  scene.add(group);
  return group;
}
