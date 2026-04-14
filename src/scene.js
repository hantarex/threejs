import * as THREE from 'three';

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x0a0a0f, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(0, 0.3, 2.5);

  // Handle resize
  const observer = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  observer.observe(container);

  return { renderer, scene, camera, container };
}
