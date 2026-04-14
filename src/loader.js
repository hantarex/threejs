import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const textureLoader = new THREE.TextureLoader();

// Восстановить B-канал 2-канального normal map через Canvas API
function fixNormalMap(texture) {
  const img = texture.image;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const rx = data[i]   / 255 * 2 - 1;  // R → [-1, 1]
    const gy = data[i+1] / 255 * 2 - 1;  // G → [-1, 1]
    const bz = Math.sqrt(Math.max(0, 1 - rx * rx - gy * gy));
    data[i+2] = Math.round((bz + 1) / 2 * 255);  // Reconstruct B
  }

  ctx.putImageData(imageData, 0, 0);
  const fixed = new THREE.CanvasTexture(canvas);
  // Copy orientation settings from original
  fixed.flipY    = texture.flipY;
  fixed.repeat   = texture.repeat.clone();
  fixed.offset   = texture.offset.clone();
  fixed.wrapS    = texture.wrapS;
  fixed.wrapT    = texture.wrapT;
  fixed.magFilter = texture.magFilter;
  fixed.minFilter = THREE.LinearFilter;
  fixed.generateMipmaps = false;
  return fixed;
}

// Try to load a texture, return null if it fails
function loadTextureIfExists(path) {
  return new Promise((resolve) => {
    textureLoader.load(path, resolve, undefined, () => resolve(null));
  });
}

export function loadWeapon(scene, weaponPath, onProgress) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      weaponPath,
      (gltf) => {
        const model = gltf.scene;

        // Extract weapon name from path (e.g., /models/ak47/scene.glb → ak47)
        const weaponName = weaponPath.split('/')[2];
        const texturePath = `/textures/${weaponName}`;

        // Try to load local textures, but don't fail if they don't exist
        Promise.all([
          loadTextureIfExists(`${texturePath}/color.png`),
          loadTextureIfExists(`${texturePath}/metal.png`),
          loadTextureIfExists(`${texturePath}/normal.png`),
          loadTextureIfExists(`${texturePath}/ao.png`)
        ]).then(([colorMap, metalMap, normalMap, aoMap]) => {
          // If we have local textures, apply them
          if (colorMap || metalMap || normalMap || aoMap) {
            // Configure textures
            if (colorMap) colorMap.colorSpace = THREE.SRGBColorSpace;

            // Fix texture orientation for custom textures
            [colorMap, metalMap, normalMap, aoMap].filter(t => t).forEach(texture => {
              // Mirror Y axis only
              texture.repeat.set(1, -1);
              texture.offset.set(0, 1);
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              texture.magFilter = THREE.LinearFilter;
              texture.minFilter = THREE.LinearMipmapLinearFilter;
            });

            // Apply textures to materials
            model.traverse((child) => {
              if (child.isMesh && child.geometry) {
                let material = child.material;
                if (material) {
                  material = material.clone();
                } else {
                  material = new THREE.MeshStandardMaterial();
                }

                // Apply skin textures
                if (colorMap) material.map = colorMap;
                if (metalMap) {
                  material.metalnessMap = metalMap;
                }
                if (normalMap) material.normalMap = fixNormalMap(normalMap);
                if (aoMap) {
                  material.aoMap = aoMap;
                  material.aoMapIntensity = 1.2;
                }
                material.metalness = 0.4;
                material.roughness = 0.55;
                material.needsUpdate = true;

                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
          } else {
            // No custom textures found, use embedded textures from GLB
            model.traverse((child) => {
              if (child.isMesh && child.geometry) {
                if (child.material) {
                  // Ensure material is cloned and properly configured
                  let material = child.material.clone();
                  if (material.map) {
                    material.map.colorSpace = THREE.SRGBColorSpace;
                  }
                  material.needsUpdate = true;
                  child.material = material;
                }
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
          }

          // Center the model using bounding box
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Ensure size is always positive
          size.x = Math.abs(size.x);
          size.y = Math.abs(size.y);
          size.z = Math.abs(size.z);

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim;

          model.position.sub(center.multiplyScalar(scale));
          model.scale.setScalar(scale);

          // Ensure positive scale
          model.scale.x = Math.abs(model.scale.x);
          model.scale.y = Math.abs(model.scale.y);
          model.scale.z = Math.abs(model.scale.z);

          scene.add(model);
          resolve(model);
        }).catch(reject);
      },
      (event) => onProgress?.(event.loaded / event.total),
      reject
    );
  });
}
