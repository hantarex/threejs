
# Исследование системы стикеров skinport.com

> Проведено через Chrome DevTools MCP (evaluate_script + WebGL shader extraction)  
> Объект: https://3d.skinport.com/ru — MAC-10 "Heat" с 4× Reason Gaming (Holo) | Katowice 2014

---

## 1. Архитектура — что ожидалось vs что есть на самом деле

| | Ожидание | Реальность |
|--|----------|-----------|
| Геометрия стикера | `DecalGeometry` / отдельные меши | **Нет отдельных мешей вообще** |
| Позиционирование | World-space transform | **UV offset/scale в пространстве uv1** |
| Рендеринг | Separate draw call | **Часть основного weapon shader** |
| Текстуры | Один PNG | **sampler2DArray (все слоты = один массив)** |

Стикеры рендерятся **внутри шейдера самого оружия** через `MeshStandardMaterial.onBeforeCompile` с флагом `#define F_STICKERS`.

---

## 2. Three.js сцена (дамп)

```
Scene (children: 5)
├── SpotLight
├── PointLight
├── DirectionalLight
├── PerspectiveCamera
└── weapon_smg_mac10_ag2vmdl_c (Group)
    └── phase2weapons…mac10… (Object3D)
        ├── weapon (Bone)
        │   └── weapon_offset (Bone)
        │       ├── bolt, clip, strap1…8, trigger
        └── phase2…body_legacy (SkinnedMesh)   ← ЕДИНСТВЕННЫЙ меш оружия
            material: MeshStandardMaterial
            defines:  ["STANDARD", "F_STICKERS"]
```

**Никаких стикерных мешей нет.** Все 4 стикера = часть `SkinnedMesh.material`.

---

## 3. Геометрия — UV-каналы меша

```
Атрибуты SkinnedMesh:
  position    (8096 vertices, itemSize=3)
  uv          (itemSize=2) — основной UV для skin-текстуры
  uv1         (itemSize=2) — СТИКЕРНЫЙ UV-канал
  normal, tangent, skinIndex, skinWeight
```

### uv1 диапазон:
```
X: [-1.96, +0.92]
Y: [ 0.07,  0.83]
```

`uv1` — непрерывное пространство по поверхности оружия. Каждый слот стикера определяется **offset + scale** в этом пространстве.

---

## 4. Позиции стикеров (извлечённые uniforms)

Для MAC-10 "Heat", все 4 слота = Reason Gaming (Holo) | Katowice 2014:

| Слот | `g_vStickerNOffset` | `g_vStickerNScale` | Rotation | Wear |
|------|--------------------|--------------------|----------|------|
| 0 | (0.257, -0.299) | 6.530612 | 0 | 0 |
| 1 | (0.114, -0.126) | 6.530612 | 0 | 0 |
| 2 | (0.090, -0.297) | 6.530612 | 0 | 0 |
| 3 | (-0.157, -0.299) | 6.530612 | 0 | 0 |

`scale = 6.530612` означает: размер стикера ≈ `1/6.53 ≈ 0.153` от размера всего uv1-пространства.

---

## 5. UV-формула позиционирования (из скомпилированного GLSL)

```glsl
// _30958 = uv1 (приходит как varying из vertex shader)
// sticker._309100 = g_vStickerNOffset
// sticker._309105 = g_vStickerNScale

vec2 relUV = ((uv1 - vec2(0.5)) - offset) * abs(scale.x);

// Вращение (rotation в [0,1] → умножить на 2π)
float angle = rotation * 6.28318;
vec2 rotated = vec2(
    relUV.x * cos(angle) - relUV.y * sin(angle),
    relUV.x * sin(angle) + relUV.y * cos(angle)
) + vec2(0.5);

// Клиппинг: если вне [0,1] — пиксель не получает стикер
if (clamp(rotated, 0.0, 1.0) != rotated) return;

// Семплирование texture array (z = индекс слота)
vec4 stickerColor = texture(g_tSticker0, vec3(rotated, float(slotIndex)));
```

---

## 6. Текстурные ресурсы

Все URL найдены через Network scan:

| Файл | Назначение |
|------|-----------|
| `sticker_reason_psd_80d3c5d9.png` | Основная color texture (RGB + alpha) |
| `_alpha_sticker_reason_psd_80d3c5d9.png` | Отдельный альфа-канал |
| `sticker_reason_holomask_psd_4a1c2f63.png` | Маска для голо-эффекта |
| `holowarp_default_tga_981ecbd9.png` | UV-деформация голограммы |
| `sticker_default_scratches_psd_a9ad199b.png` | Текстура царапин (wear) |
| `default_normal_tga_4c6e7391.png` | Normal map стикера |

Все базовые URL: `https://3d.skinport.com/assets/stickers/textures/`

Текстуры **упакованы в `sampler2DArray`** — один uniform `g_tSticker0` содержит все 4 слота как layers (0–3). Слой `g_nNumStickers + slotIndex` = дополнительные маски.

---

## 7. Shader uniforms — полный список

```glsl
// Текстуры (sampler2DArray)
uniform sampler2DArray g_tSticker0;            // color
uniform sampler2DArray g_tNormalRoughnessSticker0;
uniform sampler2DArray g_tHoloSpectrumSticker0; // голограмма: спектр цветов
uniform sampler2DArray g_tSfxMaskSticker0;      // маска эффектов
uniform sampler2DArray g_tGlitterNormalSticker0;
uniform int g_nNumStickers;                     // = 4

// На каждый слот (0..3):
uniform uint  g_bEnableSticker{N};
uniform vec2  g_vSticker{N}Offset;
uniform vec2  g_vSticker{N}Scale;
uniform float g_flSticker{N}Rotation;
uniform float g_flSticker{N}Wear;
uniform vec2  g_vWearBiasSticker{N};
uniform float g_fWearScratchesSticker{N};
uniform vec3  g_vColorTintSticker{N};
uniform float g_flTintSaturateSticker{N};
uniform float g_flColorBoostSticker{N};
uniform float g_flSfxColorBoostSticker{N};
uniform float g_flGlitterScaleSticker{N};
uniform uint  g_bHolographicSticker{N};
uniform uint  g_bPaperBackingSticker{N};
uniform uint  g_bGlitterSticker{N};
uniform uint  g_bMetallicSticker{N};
uniform uint  g_bClampSpectrumVSticker{N};
uniform uint  g_bAutomaticPBRColorFittingSticker{N};
uniform uint  g_bLegacyTintMultiplySticker{N};
```

---

## 8. Флаги для Reason Gaming (Holo) | Katowice 2014

```json
{
  "g_bHolographicSticker": 1,
  "g_bPaperBackingSticker": 1,
  "g_bGlitterSticker": 0,
  "g_bMetallicSticker": 0,
  "g_bAutomaticPBRColorFittingSticker": 1,
  "g_bClampSpectrumVSticker": 1,
  "g_bLegacyTintMultiplySticker": 0,
  "g_fWearScratchesSticker": 0.4,
  "g_flColorBoostSticker": 1,
  "g_flGlitterScaleSticker": 1,
  "g_flSfxColorBoostSticker": 1,
  "g_flTintSaturateSticker": 1,
  "g_vColorTintSticker": {"x":1,"y":1,"z":1}
}
```

---

## 9. Ключевые отличия от наивного подхода (PlaneGeometry)

| Аспект | PlaneGeometry (наш текущий) | Skinport shader |
|--------|----------------------------|-----------------|
| Геометрия | Отдельный плоский меш | Нет отдельной геометрии |
| Прилипание к поверхности | Нет (float выше) | Да (запечено в шейдере) |
| Деформация со скелетом | Нет | Да (часть SkinnedMesh) |
| Голограмма | Нет | Да (g_tHoloSpectrum) |
| Царапины/wear | Нет | Да (g_fWearScratches) |
| Вращение стикера | Нет | Да (g_flStickerNRotation) |
| Z-fighting | Есть (depthTest:false) | Нет |

---

## 10. Реализация для нашего проекта

Наши модели не имеют CS2-специфичного `uv1` стикерного UV-канала.

**Стратегия адаптации:**
1. Использовать **raycasting** для нахождения точки на поверхности
2. Вычислить UV-координаты в точке попадания (`hit.uv`)
3. Использовать `onBeforeCompile` для инъекции стикерного GLSL в материал оружия
4. Позиционировать через `g_vStickerNOffset` = `hit.uv` — аналогично skinport

Это даёт: прилипание к поверхности + деформация со скелетом + эффекты.
