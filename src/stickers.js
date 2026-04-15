import * as THREE from 'three';

// Slot offsets extracted from skinport via Chrome DevTools
// MAC-10 Heat × 4× Reason Gaming (Holo) | Katowice 2014
export const STICKER_SLOTS = {
  mac10_legacy: [
    { offset: [ 0.257, -0.299], scale: 6.530612 },
    { offset: [ 0.114, -0.126], scale: 6.530612 },
    { offset: [ 0.090, -0.297], scale: 6.530612 },
    { offset: [-0.157, -0.299], scale: 6.530612 },
  ],
};

// ─── Texture helpers ──────────────────────────────────────────────────────────

const textureCache = new Map();

function loadTex(url) {
  if (textureCache.has(url)) return Promise.resolve(textureCache.get(url));
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = true;
      textureCache.set(url, tex);
      resolve(tex);
    }, undefined, reject);
  });
}

// ─── Manager ─────────────────────────────────────────────────────────────────

export function createStickerManager() {
  const slotUrls = [null, null, null, null];
  // Shared uniforms object — mutated directly when apply()/remove() called
  let uniforms = null;

  function prepareModel(model, weaponKey) {
    uniforms = {
      g_tSticker0: { value: null }, g_tSticker1: { value: null },
      g_tSticker2: { value: null }, g_tSticker3: { value: null },

      g_bEnableSticker0: { value: 0 }, g_bEnableSticker1: { value: 0 },
      g_bEnableSticker2: { value: 0 }, g_bEnableSticker3: { value: 0 },

      g_vSticker0Offset: { value: new THREE.Vector2() },
      g_vSticker1Offset: { value: new THREE.Vector2() },
      g_vSticker2Offset: { value: new THREE.Vector2() },
      g_vSticker3Offset: { value: new THREE.Vector2() },

      g_vSticker0Scale: { value: 6.530612 },
      g_vSticker1Scale: { value: 6.530612 },
      g_vSticker2Scale: { value: 6.530612 },
      g_vSticker3Scale: { value: 6.530612 },

      g_flSticker0Rotation: { value: 0 },
      g_flSticker1Rotation: { value: 0 },
      g_flSticker2Rotation: { value: 0 },
      g_flSticker3Rotation: { value: 0 },
    };

    // Set slot offsets from config
    const slots = STICKER_SLOTS[weaponKey] ?? STICKER_SLOTS.mac10_legacy;
    slots.forEach((s, i) => {
      uniforms[`g_vSticker${i}Offset`].value.set(s.offset[0], s.offset[1]);
      uniforms[`g_vSticker${i}Scale`].value = s.scale;
    });

    // Patch every MeshStandardMaterial
    model.traverse(obj => {
      if (!obj.isMesh && !obj.isSkinnedMesh) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(mat => {
        if (!mat?.isMeshStandardMaterial) return;
        patchMaterial(mat, uniforms);
      });
    });
  }

  function patchMaterial(mat, u) {
    // Unique define to bust Three.js program cache
    mat.defines = mat.defines ?? {};
    mat.defines.USE_STICKER_SYSTEM = '';

    mat.onBeforeCompile = shader => {
      console.log('[stickers] onBeforeCompile called ✓');

      // ── Vertex: pass uv1 to fragment ──────────────────────────────────
      // Three.js defines attribute vec2 uv1 when USE_UV1 is set.
      // We declare our own varying and copy from uv1 explicitly.
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vStickerUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvStickerUv = uv1;');

      // ── Fragment: sticker sampling ────────────────────────────────────
      const stickerGLSL = /* glsl */`
varying vec2 vStickerUv;
uniform sampler2D g_tSticker0, g_tSticker1, g_tSticker2, g_tSticker3;
uniform int g_bEnableSticker0, g_bEnableSticker1, g_bEnableSticker2, g_bEnableSticker3;
uniform vec2 g_vSticker0Offset, g_vSticker1Offset, g_vSticker2Offset, g_vSticker3Offset;
uniform float g_vSticker0Scale, g_vSticker1Scale, g_vSticker2Scale, g_vSticker3Scale;
uniform float g_flSticker0Rotation, g_flSticker1Rotation, g_flSticker2Rotation, g_flSticker3Rotation;

vec4 evalSticker(sampler2D tex, vec2 suv, vec2 offset, float scale, float rot) {
  vec2 r = ((suv - 0.5) - offset) * abs(scale);
  float c = cos(rot * 6.28318), s = sin(rot * 6.28318);
  vec2 uv = vec2(r.x*c - r.y*s, r.x*s + r.y*c) + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(tex, uv);
}

void blendStickers(inout vec3 col) {
  vec2 suv = vStickerUv;
  if (g_bEnableSticker0 != 0) { vec4 s = evalSticker(g_tSticker0, suv, g_vSticker0Offset, g_vSticker0Scale, g_flSticker0Rotation); col = mix(col, s.rgb, s.a); }
  if (g_bEnableSticker1 != 0) { vec4 s = evalSticker(g_tSticker1, suv, g_vSticker1Offset, g_vSticker1Scale, g_flSticker1Rotation); col = mix(col, s.rgb, s.a); }
  if (g_bEnableSticker2 != 0) { vec4 s = evalSticker(g_tSticker2, suv, g_vSticker2Offset, g_vSticker2Scale, g_flSticker2Rotation); col = mix(col, s.rgb, s.a); }
  if (g_bEnableSticker3 != 0) { vec4 s = evalSticker(g_tSticker3, suv, g_vSticker3Offset, g_vSticker3Scale, g_flSticker3Rotation); col = mix(col, s.rgb, s.a); }
}
`;

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${stickerGLSL}`)
        .replace('#include <opaque_fragment>', `blendStickers(outgoingLight);\n#include <opaque_fragment>`);

      Object.assign(shader.uniforms, u);
    };

    // Ensure uv1 attribute is generated by Three.js
    mat.defines.USE_UV1 = '';
    mat.needsUpdate = true;
  }

  async function apply(_scene, _model, _weaponKey, slotIndex, textureUrl) {
    if (!uniforms) return;
    slotUrls[slotIndex] = textureUrl;
    const tex = await loadTex(textureUrl);
    uniforms[`g_tSticker${slotIndex}`].value = tex;
    uniforms[`g_bEnableSticker${slotIndex}`].value = 1;
  }

  function remove(_scene, slotIndex) {
    slotUrls[slotIndex] = null;
    if (!uniforms) return;
    uniforms[`g_bEnableSticker${slotIndex}`].value = 0;
    uniforms[`g_tSticker${slotIndex}`].value = null;
  }

  function clearAll(_scene) {
    slotUrls.fill(null);
    if (!uniforms) return;
    for (let i = 0; i < 4; i++) {
      uniforms[`g_bEnableSticker${i}`].value = 0;
      uniforms[`g_tSticker${i}`].value = null;
    }
  }

  function getSlotUrl(i) { return slotUrls[i]; }

  return { prepareModel, apply, remove, clearAll, getSlotUrl };
}

// ─── Demo stickers (placeholder canvas images) ────────────────────────────────

export function makePlaceholderSticker(label, bgColor, borderColor) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const pad = 12, r = 28;
  ctx.beginPath();
  ctx.moveTo(pad + r, pad); ctx.lineTo(size - pad - r, pad);
  ctx.quadraticCurveTo(size - pad, pad, size - pad, pad + r);
  ctx.lineTo(size - pad, size - pad - r);
  ctx.quadraticCurveTo(size - pad, size - pad, size - pad - r, size - pad);
  ctx.lineTo(pad + r, size - pad);
  ctx.quadraticCurveTo(pad, size - pad, pad, size - pad - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();
  ctx.fillStyle = bgColor; ctx.fill();
  ctx.strokeStyle = borderColor; ctx.lineWidth = 8; ctx.stroke();
  const grd = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size/2);
  grd.addColorStop(0, 'rgba(255,255,255,0.18)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(size * 0.38)}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
  ctx.fillText(label, size/2, size/2);
  return canvas.toDataURL('image/png');
}

export const DEMO_STICKERS = [
  { label: 'Katowice', dataUrl: null, bg: '#1a0a00', border: '#e8640a', text: 'KTO' },
  { label: 'Cologne',  dataUrl: null, bg: '#001a0a', border: '#0ae864', text: 'CLG' },
  { label: 'Boston',   dataUrl: null, bg: '#00081a', border: '#0a64e8', text: 'BOS' },
  { label: 'Berlin',   dataUrl: null, bg: '#1a001a', border: '#e80ae8', text: 'BRL' },
];
DEMO_STICKERS.forEach(s => { s.dataUrl = makePlaceholderSticker(s.text, s.bg, s.border); });
