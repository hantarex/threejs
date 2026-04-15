# Реализация shader injection стикеров

> Итог отладки — что сломалось и как исправили

---

## Что реализовано

Стикеры рендерятся **внутри шейдера оружия** через `MeshStandardMaterial.onBeforeCompile` — точно так же, как на skinport.com.

Никаких отдельных мешей. Стикер = UV-based overlay в fragment shader.

---

## Критические баги Three.js r160+ (и фиксы)

### 1. `output_fragment` → `opaque_fragment`

В Three.js r152+ chunk переименован. Все примеры в интернете используют старое название.

```javascript
// ❌ Не работает — замена не матчится, код никогда не вставляется
.replace('#include <output_fragment>', `blendStickers(...)\n#include <output_fragment>`)

// ✅ Правильно
.replace('#include <opaque_fragment>', `blendStickers(outgoingLight);\n#include <opaque_fragment>`)
```

### 2. Применять к `outgoingLight`, не к `diffuseColor`

`diffuseColor` (vec4) — базовый цвет до PBR-освещения.  
`outgoingLight` (vec3) — финальный освещённый цвет, то что идёт в `gl_FragColor`.

```glsl
// ❌ Стикеры перекрываются освещением, не видны
void blendStickers(inout vec4 col) { ... }
blendStickers(diffuseColor);

// ✅ Стикеры видны поверх освещения
void blendStickers(inout vec3 col) { ... }
blendStickers(outgoingLight);
```

### 3. Как отладить shader injection

Проверить список include-ов в fragment shader прямо в `onBeforeCompile`:

```javascript
mat.onBeforeCompile = shader => {
  const includes = [...shader.fragmentShader.matchAll(/#include <([^>]+)>/g)].map(m => m[1]);
  console.log(includes); // найти нужный chunk
};
```

Проверить что инъекция сработала после вызова оригинального callback:

```javascript
mat.onBeforeCompile = shader => {
  origOBC(shader);
  console.log('has blendStickers:', shader.fragmentShader.includes('blendStickers'));
};
```

---

## Итоговая архитектура

```
prepareModel(model, weaponKey)
  └── для каждого MeshStandardMaterial:
        mat.defines['USE_STICKER_SYSTEM'] = ''
        mat.defines['USE_UV1'] = ''          ← включает attribute vec2 uv1
        mat.onBeforeCompile = shader => {
          // Vertex: добавить varying + скопировать uv1
          shader.vertexShader
            .replace('#include <common>', + 'varying vec2 vStickerUv;')
            .replace('#include <uv_vertex>', + 'vStickerUv = uv1;')
          
          // Fragment: декларации + функция + вызов
          shader.fragmentShader
            .replace('#include <common>', + evalSticker() + blendStickers() декларации)
            .replace('#include <opaque_fragment>', 'blendStickers(outgoingLight);\n' + ...)
          
          Object.assign(shader.uniforms, uniformsRef)
        }
        mat.needsUpdate = true

apply(scene, model, weaponKey, slotIndex, textureUrl)
  └── загрузить текстуру → uniforms.g_tStickerN.value = tex
                          uniforms.g_bEnableStickerN.value = 1
```

---

## UV формула (из шейдеров skinport)

```glsl
vec4 evalSticker(sampler2D tex, vec2 suv, vec2 offset, float scale, float rot) {
  vec2 r = ((suv - 0.5) - offset) * abs(scale);
  float c = cos(rot * 6.28318), s = sin(rot * 6.28318);
  vec2 uv = vec2(r.x*c - r.y*s, r.x*s + r.y*c) + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(tex, uv);
}
```

## Slot offsets (MAC-10 Heat, из skinport DevTools)

| Слот | offset | scale |
|------|--------|-------|
| 0 | (0.257, -0.299) | 6.530612 |
| 1 | (0.114, -0.126) | 6.530612 |
| 2 | (0.090, -0.297) | 6.530612 |
| 3 | (-0.157, -0.299) | 6.530612 |

## Текстура стикера

```
https://3d.skinport.com/assets/stickers/textures/sticker_reason_psd_80d3c5d9.png
```
Reason Gaming (Holo) | Katowice 2014 — именно то что на MAC-10 Heat на skinport.
