import { createScene } from './scene.js';
import { setupLighting } from './lighting.js';
import { loadWeapon } from './loader.js';
import { createControls } from './controls.js';
import { createPostProcessing } from './postprocessing.js';
import { createFallbackWeapon } from './fallback.js';
import { createUI } from './ui.js';
import { WEAPONS, DEFAULT_WEAPON } from './weapons.js';
import { createStickerManager } from './stickers.js';
import './style.css';

async function init() {
  const container = document.getElementById('app');
  const { renderer, scene, camera } = createScene(container);
  const ui = createUI(container);

  await setupLighting(scene, renderer);

  let currentModel  = null;
  const currentWeapon = DEFAULT_WEAPON;
  const stickerManager = createStickerManager();

  // Reason Gaming (Holo) | Katowice 2014 — точно как на skinport
  const REASON_STICKER = 'https://3d.skinport.com/assets/stickers/textures/sticker_reason_psd_80d3c5d9.png';
  const STICKERS = [
    REASON_STICKER,
    REASON_STICKER,
    REASON_STICKER,
    REASON_STICKER,
  ];

  const loadCurrentWeapon = async (weaponKey) => {
    if (currentModel) scene.remove(currentModel);
    stickerManager.clearAll(scene);

    const weapon = WEAPONS[weaponKey];
    if (!weapon) return;

    ui.showLoading();
    ui.setWeaponInfo(weapon.name, weapon.skin);

    try {
      currentModel = await loadWeapon(scene, weapon.path, p => ui.setProgress(p));

      // Inject sticker shader BEFORE first render frame
      stickerManager.prepareModel(currentModel, weaponKey);

      // Apply stickers
      for (let i = 0; i < 4; i++) {
        await stickerManager.apply(scene, currentModel, weaponKey, i, STICKERS[i]);
      }

      // Debug handle
      window._dbg = { model: currentModel, scene, stickerManager };
    } catch (err) {
      console.warn('Ошибка загрузки:', err);
      currentModel = await createFallbackWeapon(scene);
    }

    ui.hideLoading();
  };

  await loadCurrentWeapon(DEFAULT_WEAPON);

  const controls = createControls(camera, renderer.domElement);
  window._dbgControls = controls;
  window._dbgCamera   = camera;

  const composer = createPostProcessing(renderer, scene, camera, container);

  ui.onViewChange(mode => {
    if (mode === 'inspect') {
      camera.position.set(0, 0.2, 1.2);
      controls.minDistance = 0.3;
      controls.maxDistance = 2.0;
      controls.autoRotateSpeed = 0.8;
    } else {
      camera.position.set(0, 0.3, 2.5);
      controls.minDistance = 0.8;
      controls.maxDistance = 6.0;
      controls.autoRotateSpeed = 1.2;
    }
  });

  window.addEventListener('resize', () => {
    composer.setSize(container.clientWidth, container.clientHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
  }
  animate();
}

init();
