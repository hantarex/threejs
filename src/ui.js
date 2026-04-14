import { WEAPONS } from './weapons.js';

export function createUI(container) {
  const overlay = document.createElement('div');
  overlay.className = 'ui-overlay';

  // Создаём кнопки оружия
  const weaponButtons = Object.entries(WEAPONS).map(([key, weapon]) =>
    `<button class="weapon-btn ${key === 'ak47' ? 'active' : ''}" data-weapon="${key}">${weapon.name}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="top-section">
      <div class="weapon-info">
        <span class="weapon-name" id="weapon-name">AK-47</span>
        <span class="skin-name" id="skin-name">Fire Serpent <em>| Field-Tested</em></span>
      </div>
      <div class="controls">
        <button class="view-btn active" data-view="free">FREE VIEW</button>
        <button class="view-btn" data-view="inspect">INSPECT</button>
      </div>
    </div>
    <div class="weapons-menu">
      ${weaponButtons}
    </div>
    <div class="loading-bar-wrap" id="loading-wrap">
      <div class="loading-bar" id="loading-bar"></div>
      <span class="loading-text">Loading model...</span>
    </div>
    <div class="hint">Drag to rotate &nbsp;|&nbsp; Scroll to zoom</div>
  `;
  container.appendChild(overlay);

  return {
    setProgress(ratio) {
      const bar = document.getElementById('loading-bar');
      if (bar) {
        bar.style.width = `${ratio * 100}%`;
      }
    },
    hideLoading() {
      const wrap = document.getElementById('loading-wrap');
      if (wrap) {
        wrap.style.opacity = '0';
        setTimeout(() => wrap.style.display = 'none', 600);
      }
    },
    showLoading() {
      const wrap = document.getElementById('loading-wrap');
      if (wrap) {
        wrap.style.opacity = '1';
        wrap.style.display = 'block';
      }
    },
    setWeaponInfo(name, skin) {
      const nameEl = document.getElementById('weapon-name');
      const skinEl = document.getElementById('skin-name');
      if (nameEl) nameEl.textContent = name;
      if (skinEl) skinEl.textContent = skin;
    },
    onViewChange(callback) {
      const buttons = container.querySelectorAll('.view-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          callback(btn.dataset.view);
        });
      });
    },
    onWeaponChange(callback) {
      const buttons = container.querySelectorAll('.weapon-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          callback(btn.dataset.weapon);
        });
      });
    }
  };
}
