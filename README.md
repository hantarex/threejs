# CS:GO Weapon Skin Viewer — Three.js Demo

3D демо-приложение для просмотра CS:GO оружия (AK-47) в интерактивной 3D сцене.

## Возможности

✅ **3D визуализация** — детальная процедурная модель AK-47 с текстурами  
✅ **HDR Освещение** — реалистичное освещение из Polyhaven  
✅ **Интерактивность** — вращение мышью, zoom колёсиком, auto-rotate  
✅ **Постобработка** — Bloom эффект для металлических бликов  
✅ **Responsive** — адаптивный размер под окно браузера  
✅ **Быстро** — Vite dev server с instant reload  

## Быстрый старт

```bash
cd /home/sham/PhpstormProjects/treejs

# Установка зависимостей (если ещё не установлены)
npm install

# Запуск dev сервера
npm run dev
```

Откроется браузер на `http://localhost:5173/`

## Управление

- **Drag мышью** — вращать модель
- **Scroll** — zoom in/out
- **Автоматическое вращение** — включено по умолчанию (отключается при клике)

## Файловая структура

```
src/
├── main.js              # Точка входа
├── scene.js             # Three.js сцена, камера, renderer
├── lighting.js          # HDR освещение + directional lights
├── loader.js            # GLTFLoader для загрузки .glb
├── controls.js          # OrbitControls для взаимодействия
├── postprocessing.js    # EffectComposer + Bloom
├── fallback.js          # Процедурная модель AK-47 (если нет .glb)
├── ui.js                # UI overlay (название, скин, loading bar)
└── style.css            # Стили
```

## Замена модели на готовую GLB

Если хочешь использовать готовую GLB модель вместо процедурной:

1. Скачай GLB файл с одного из источников:
   - [Poly Pizza](https://poly.pizza/m/em1Hi9GuCv) (no auth needed)
   - [Sketchfab AK-47](https://sketchfab.com/search?q=ak47&type=models) (free)
   - [Free3D](https://free3d.com/3d-models/ak47) (free)

2. Переименуй файл в `scene.glb` и положи в:
   ```
   public/models/ak47/scene.glb
   ```

3. Перезагрузи страницу — код автоматически загрузит новую модель!

## Техстек

- **Three.js** — 3D графика
- **Vite** — быстрый bundler
- **HDRLoader** — загрузка HDR карт освещения
- **GLTFLoader** — загрузка 3D моделей в формате glTF/GLB
- **OrbitControls** — управление камерой через мышь
- **EffectComposer** — постобработка (bloom)

## Сборка для production

```bash
npm run build
```

Скомпилированный проект будет в папке `dist/`

## Лицензии активов

- **HDR карта**: studio_small_08_1k.hdr от Polyhaven (CC0)
- **3D модель**: процедурная, MIT-compatible

## Тюнинг

### Изменить название оружия/скина
Редактировать `src/ui.js`:
```javascript
<span class="weapon-name">YOUR NAME</span>
<span class="skin-name">YOUR SKIN <em>| CONDITION</em></span>
```

### Отключить auto-rotate
В `src/controls.js изменить:
```javascript
controls.autoRotate = false;
```

### Изменить HDR карту
1. Скачай другую HDR с [Polyhaven](https://polyhaven.com/hdris)
2. Положи в `public/hdr/`
3. Измени путь в `src/lighting.js`:
```javascript
.load('/hdr/YOUR_HDR_FILE.hdr', ...)
```

## Troubleshooting

**Модель не загружается?**  
Проверь консоль браузера. Если видишь `GLB load failed`, это нормально — используется fallback процедурная модель.

**Медленно?**  
Отключи bloom в `src/main.js` или понизь `toneMappingExposure` в `src/scene.js`.

**Хочу другую текстуру?**  
Редактируй функции `createMetalTexture()` и `createWoodTexture()` в `src/fallback.js`.
