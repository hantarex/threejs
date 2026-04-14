import { createScene } from './scene.js';
import { setupLighting } from './lighting.js';
import { loadWeapon } from './loader.js';
import { createControls } from './controls.js';
import { createPostProcessing } from './postprocessing.js';
import { createFallbackWeapon } from './fallback.js';
import { createUI } from './ui.js';
import { WEAPONS, DEFAULT_WEAPON } from './weapons.js';
import './style.css';

async function init() {
  const container = document.getElementById('app');
  const { renderer, scene, camera } = createScene(container);
  const ui = createUI(container);

  // Lighting first (async - loads HDR)
  await setupLighting(scene, renderer);

  let currentModel = null;
  let currentWeapon = DEFAULT_WEAPON;

  // Функция загрузки оружия
  const loadCurrentWeapon = async (weaponKey) => {
    // Удаляем старую модель
    if (currentModel) {
      scene.remove(currentModel);
    }

    const weapon = WEAPONS[weaponKey];
    if (!weapon) return;

    ui.showLoading();
    ui.setWeaponInfo(weapon.name, weapon.skin);

    try {
      currentModel = await loadWeapon(scene, weapon.path, (progress) => ui.setProgress(progress));
      currentWeapon = weaponKey;
    } catch (err) {
      console.warn('Ошибка загрузки:', err);
      currentModel = await createFallbackWeapon(scene);
    }
    ui.hideLoading();
  };

  // Загружаем начальное оружие
  await loadCurrentWeapon(DEFAULT_WEAPON);

  const model = currentModel;

  const controls = createControls(camera, renderer.domElement);
  const composer = createPostProcessing(renderer, scene, camera, container);

  // View mode switching
  ui.onViewChange((mode) => {
    if (mode === 'inspect') {
      // Close-up inspection mode
      camera.position.set(0, 0.2, 1.2);
      controls.minDistance = 0.3;
      controls.maxDistance = 2.0;
      controls.autoRotateSpeed = 0.8;
    } else {
      // Free view mode
      camera.position.set(0, 0.3, 2.5);
      controls.minDistance = 0.8;
      controls.maxDistance = 6.0;
      controls.autoRotateSpeed = 1.2;
    }
  });

  // Weapon selection
  ui.onWeaponChange((weaponKey) => {
    loadCurrentWeapon(weaponKey);
  });

  // Resize the composer too
  window.addEventListener('resize', () => {
    composer.setSize(container.clientWidth, container.clientHeight);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
  }
  animate();
}

init();
