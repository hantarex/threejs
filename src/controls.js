import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 0.8;
  controls.maxDistance = 6.0;
  controls.maxPolarAngle = Math.PI;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.target.set(0, 0, 0);

  // Stop auto-rotate when user grabs the model
  domElement.addEventListener('pointerdown', () => {
    controls.autoRotate = false;
  });

  return controls;
}
