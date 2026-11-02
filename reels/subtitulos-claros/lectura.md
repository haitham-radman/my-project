# Texto para grabar

Léelo tal cual está escrito: los subtítulos coinciden palabra por palabra con este texto. Cada número es un subtítulo.

**Pausa de medio segundo (cuenta «uno» mentalmente) entre una línea y la siguiente.** Esas pausas me permiten calcular cuándo empieza cada subtítulo sin modelos de transcripción.

1. اجعل ترجمتك العربية واضحة بثلاث خطوات
2. الخطوة الأولى: ابق الحروف متصلة
3. لا تقسم الكلمة إلى حروف منفردة
4. فالحروف المنفصلة
5. تصعب القراءة على المشاهد
6. الخطوة الثانية: اجعل الاتجاه
7. من اليمين إلى اليسار
8. حتى تظهر الجملة بالترتيب الصحيح
9. الخطوة الثالثة: ابتعد عن حواف الشاشة
10. فقد تغطي الأزرار أسفل الترجمة
11. واختر نصا أبيض على خلفية داكنة
12. وأبق الجملة في سطرين على الأكثر
13. احفظ المنشور
14. وراجع الخطوات قبل ريلك القادم

## Consejos

- Una sola toma continua, sin música ni efectos.
- Si te equivocas, repite desde el principio de esa línea; no hace falta empezar de cero, dime qué líneas repetiste.
- Duración objetivo: unos 29 s (66 palabras). Si te sale más de 31 s, léelo un poco más rápido o dime y recortamos el guion.
- Formato: WAV, M4A o MP3. Cualquier micrófono sirve; grábalo en un sitio sin eco.

## Cuando tengas el audio

Adjúntalo en el chat, o súbelo a `reels/subtitulos-claros/audio/` en la rama `ccr-5a811ee7-i8nuiw`. Yo haré:

1. Medir la duración y el nivel (pico y volumen medio) con `reel-preflight`.
2. Detectar las pausas con ffmpeg y asignar su tiempo real a cada subtítulo en `captions.json`.
3. Añadir el audio al proyecto Remotion y renderizar de nuevo (con tu permiso, ya concedido para este reel).
4. Pasar `reel-preflight` y `reel-export` para dejar las copias de TikTok e Instagram.
