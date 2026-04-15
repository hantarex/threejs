import { WEAPONS } from './weapons.js';

export function createUI(container) {
  const overlay = document.createElement('div');
  overlay.className = 'ui-overlay';

  overlay.innerHTML = `
    <div class="top-section">
      <div class="weapon-info">
        <span class="weapon-name" id="weapon-name">MAC-10</span>
        <span class="skin-name" id="skin-name">Heat</span>
      </div>
      <div class="controls">
        <button class="view-btn active" data-view="free">FREE VIEW</button>
        <button class="view-btn" data-view="inspect">INSPECT</button>
      </div>
    </div>
    <div class="loading-bar-wrap" id="loading-wrap">
      <div class="loading-bar" id="loading-bar"></div>
      <span class="loading-text">Loading model...</span>
    </div>
    <div class="hint">Drag to rotate &nbsp;|&nbsp; Scroll to zoom</div>
  `;
  container.appendChild(overlay);

  let _onApply  = null;
  let _onRemove = null;

  return {
    setProgress(ratio) {
      const bar = document.getElementById('loading-bar');
      if (bar) bar.style.width = `${ratio * 100}%`;
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
      overlay.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          overlay.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          callback(btn.dataset.view);
        });
      });
    },
  };
}
