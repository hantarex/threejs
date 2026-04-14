import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

export function setupLighting(scene, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  return new Promise((resolve, reject) => {
    new HDRLoader()
      .load(
        '/hdr/studio_small_08_1k.hdr',
        (texture) => {
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          scene.environment = envMap;
          scene.environmentIntensity = 0.6;
          texture.dispose();
          pmremGenerator.dispose();

          // Directional light from above
          const keyLight = new THREE.DirectionalLight(0xffffff, 0.3);
          keyLight.position.set(2, 20, 3);
          keyLight.castShadow = true;
          keyLight.shadow.mapSize.set(2048, 2048);
          keyLight.shadow.bias = -0.001;
          scene.add(keyLight);

          // Ambient light - primary light source (HDR provides most lighting)
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
          scene.add(ambientLight);

          resolve();
        },
        undefined,
        (err) => {
          console.warn('HDR load failed, using fallback lighting:', err);
          // Fallback: ambient + directional light
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
          scene.add(ambientLight);

          const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
          dirLight.position.set(5, 8, 5);
          dirLight.castShadow = true;
          scene.add(dirLight);

          resolve();
        }
      );
  });
}
