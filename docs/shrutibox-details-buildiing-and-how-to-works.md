# Análisis Interno del Shruti Box: Construcción, Acústica y Producción de Sonido

## Resumen Ejecutivo

El shruti box es un aerófono de lengüetas libres (*free reed*) derivado del harmonium europeo, adaptado en la India como instrumento exclusivo de drone. Su funcionamiento interno combina un sistema de fuelle dual como regulador de presión de aire, una tabla de lengüetas de latón (*reed board*) montada sobre madera de teca, y un mecanismo de válvulas tipo cerradura (*keyhole shutters*) que controlan qué lengüetas reciben aire. Este informe analiza en profundidad cada componente, la física de la producción de sonido, y las implicaciones directas para la síntesis digital en el contexto de la app Shrutibox Digital.[^1][^2][^3][^4]

***

## Anatomía y Construcción

### Estructura General

El shruti box es esencialmente una caja de madera rectangular que funciona como cámara de presión. Los modelos MKS (Monoj Kumar Sardar), fabricados en las cercanías de Kolkata, utilizan madera de teca maciza (*Tectona grandis*) para el marco y la reed board, con laterales de madera laminada. Las dimensiones típicas del modelo grande son 40 cm × 31 cm × 7.5 cm (16" × 12.5" × 3.5"), con un peso de 3.6–4 kg.[^5][^6][^7]

| Componente | Material | Función |
|---|---|---|
| Marco y reed board | Teca maciza | Resonancia, soporte estructural[^6][^8] |
| Laterales | Madera laminada | Estructura[^6] |
| Fuelle | Cartón con bloqueos de cuero | Presión de aire[^6] |
| Lengüetas | Latón (brass) | Producción de sonido[^1][^5] |
| Válvulas (keys) | Plástico o cuero | Control de flujo de aire[^6] |
| Herrajes | Latón (pies, asa, pestillos) | Sujeción mecánica[^8] |
| Gussets (esquinas fuelle) | Material flexible | Mantener paneles del fuelle alineados[^4] |

### El Sistema de Fuelle Dual

Este es uno de los elementos más críticos para entender el comportamiento acústico del instrumento. El shruti box posee **dos fuelles**, no uno, y funcionan como un sistema de regulación de presión análogo al reservorio de un órgano.[^9]

- **Fuelle trasero (pump bellows)**: operado manualmente por el ejecutante. Al presionarlo hacia dentro, inyecta aire a la cámara interna. Tiene una válvula unidireccional de cuero que impide que el aire escape cuando el fuelle se abre para tomar aire nuevo.[^10][^9]
- **Fuelle delantero/superior (reservoir bellows)**: actúa como reservorio. El peso de la reed board empuja este fuelle hacia abajo, manteniendo presión constante sobre las lengüetas. Si la entrada de aire (del pump) es mayor que la salida (por las lengüetas abiertas), este fuelle se eleva, almacenando el exceso y regulando la presión.[^11][^9]

Este mecanismo dual es lo que permite el **drone continuo sin interrupciones** al cambiar la dirección del bombeo. Sin el fuelle reservorio, habría cortes audibles de sonido en cada cambio de dirección del pump (como ocurre en un acordeón). La presión se mantiene relativamente constante gracias a la gravedad que actúa sobre la reed board, creando un sistema autorreguante elegante.[^9][^11]

### La Reed Board (Tabla de Lengüetas)

La reed board es el corazón acústico del instrumento. Consiste en una tabla plana de teca con 13 lengüetas individuales montadas, afinadas cromáticamente de C3 a C4 (o equivalente según el modelo).[^4][^5]

Cada lengüeta está compuesta por:

- **Tongue (lengua/lámina)**: tira de latón fina, fijada por un extremo con doble remache a una placa individual.[^12][^9]
- **Frame (marco)**: placa de latón con una apertura ligeramente más grande que la tongue, permitiendo que ésta oscile libremente a través de la ranura.[^12]
- **Mounting**: las placas individuales se atornillan y pegan a la reed board.[^9]
- **Chambers (cámaras)**: rectangulares y planas, sin ahusamiento (*tapering*), una por cada lengüeta.[^9]

Punto clave: las lengüetas solo trabajan en una dirección (push/presión positiva), ya que el fuelle del shruti box genera presión positiva sobre las lengüetas, a diferencia de instrumentos como la concertina o la armónica que usan ambas direcciones.[^9]

### Sistema de Válvulas

En el frente del instrumento hay 13 cubiertas tipo cerradura (*keyhole shutters*). Cada una corresponde a una lengüeta. Al girar la cubierta, se expone el orificio de sonido (*sound hole*), permitiendo que el aire presurizado fluya por la lengüeta correspondiente.[^2][^4]

A diferencia del harmonium con teclas de resorte, las válvulas del shruti box **permanecen abiertas o cerradas** hasta que el ejecutante las mueva manualmente. Esto lo hace ideal para mantener un drone continuo sin esfuerzo.[^3][^2]

***

## Física de la Producción de Sonido

### Mecanismo de Oscilación de la Lengüeta Libre

La lengüeta libre (*free reed*) es un oscilador de resistencia negativa acústica. El ciclo completo de oscilación involucra múltiples fuerzas y tres fases distintas por ciclo, no dos como a veces se simplifica:[^12]

**Fase 1 – Aproximación al marco**: La presión estática del aire empuja la tongue hacia el frame. El efecto Bernoulli amplifica el movimiento: al estrecharse el *windway* (espacio periférico entre tongue y frame), la velocidad del aire aumenta, reduciendo la presión del lado del frame, lo que succiona la tongue con fuerza creciente.[^13][^12]

**Fase 2 – Dentro del marco**: El windway llega a su mínimo. La tongue frecuentemente atraviesa el frame por inercia (más la presión estática del aire y la inercia del propio aire al detenerse abruptamente). Este es el punto del *impulso de mantenimiento* que sostiene la oscilación.[^12]

**Fase 3 – Salida y recuperación**: Al salir del frame, el windway se abre súbitamente, la presión sobre la tongue cae drásticamente, y la elasticidad del material provoca el retorno. La tongue generalmente sobrepasa su posición original (overshoot) por inercia, antes de que el ciclo se reinicie.[^12]

### Producción de Sonido: Pulsos de Aire, No Vibración Mecánica

Un punto fundamental: **el sonido del shruti box NO proviene del movimiento mecánico de la lengüeta** en sí. La energía acústica proviene de los **pulsos periódicos de aire** que la tongue genera al abrir y cerrar su windway repetidamente. Es análogo a una sirena: interrupciones rítmicas del flujo de aire generan ondas de presión audibles. Un diapasón, cuyas puntas se mueven igual que una free reed (misma física de cantilever vibrante), apenas produce sonido porque no tiene flujo de aire que interrumpir.[^12]

### Propiedades Acústicas Clave

| Propiedad | Descripción | Implicación para síntesis |
|---|---|---|
| **Factor Q alto** | La lengüeta es un oscilador isocrono; su frecuencia es estable e independiente de la presión del aire[^12] | El pitch NO debe variar significativamente con el "volumen" |
| **Attack lento** | Alto Q = muchos ciclos para alcanzar amplitud estable[^12][^14] | Envelope con attack largo (comparado con un piano) |
| **Espectro armónico extendido** | Armónicos hasta más de 20 kHz, incluyendo pares e impares[^12] | Onda rica en armónicos, no sinusoidal |
| **Asimetría de pulsos** | Un pulso grande + uno menor por ciclo (tongue remachada de un solo lado)[^12] | La forma de onda tiene asimetría inherente |
| **Micro-variación de pitch** | Variaciones de 1–2 Hz correlacionadas con cambios de presión del fuelle[^15] | Simular sutil detuning con la dinámica del fuelle |
| **Modos superiores en transiente** | 2do modo transversal (~6× fundamental) y 1er modo torsional aparecen en el attack[^14][^12] | El transiente de inicio tiene contenido en frecuencias altas que desaparece en el steady state |

### El Espectro de la Lengüeta Desnuda vs. el Filtro de la Caja

La investigación de Puranik y Scavone (McGill, 2023) demostró con rigor que el sonido del harmonium (y por extensión del shruti box) se modela eficazmente con una estructura **source-filter**, análoga al modelo de producción de voz humana:[^15]

- **Source (fuente)**: el flujo de aire modulado por la lengüeta. Es una señal periódica con armónicos que se extienden a frecuencias muy altas. El LTAS (Long Term Average Spectrum) muestra picos armónicos hasta el armónico 37+ para una nota de 349 Hz.[^15]
- **Filter (filtro)**: la caja de madera y las cámaras internas actúan como un filtro acústico que colorea el sonido crudo de la lengüeta. El análisis IAIF (Iterative Adaptive Inverse Filtering) revela 8–9 picos prominentes en la respuesta en frecuencia de este filtro, que pueden aproximarse con 10 secciones biquad en cascada.[^15]

El flujo de aire estimado por IAIF muestra una **discontinuidad dentro de cada período** que ocurre cuando la lengüeta pasa de un lado al otro de su frame, confirmando la teoría de los "dos pulsos por ciclo".[^15]

### Rol de la Presión del Fuelle

La presión del fuelle cumple dos funciones:[^15]

1. **Control de amplitud**: mayor presión = mayor volumen. La frecuencia permanece esencialmente estable (isocronía del oscilador de alto Q).[^12]
2. **Micro-variación de frecuencia**: cambios sutiles de 1–2 Hz en f₀ cuando la presión varía. Aunque mínima, esta variación es **perceptible** y contribuye al carácter orgánico del sonido. Notablemente, la frecuencia tiende a subir ligeramente cuando el aire se agota y la presión baja.[^15]

***

## Características Tímbricas Específicas del Shruti Box

### Sonido "Naked Reed" y la Caja como Resonador

A diferencia de instrumentos como el clarinete u oboe, donde la lengüeta excita un tubo resonante que define radicalmente el timbre, en el shruti box se escucha esencialmente la **lengüeta desnuda** con modificación limitada del cuerpo de madera. La caja de madera no es un resonador en el sentido de un tubo de órgano; su función acústica es más sutil, actuando como un filtro pasivo que atenúa ciertos armónicos y refuerza otros según sus modos de resonancia propios.[^15][^12]

Esto explica por qué:
- El sonido del shruti box es inherentemente **rico en armónicos** con espectro extendido.[^12]
- La diferencia tímbrica entre un shruti box barato y uno de calidad reside más en la **calidad de las lengüetas** (tolerancia de corte, material, masa) y la **madera del cuerpo** (que determina el filtro) que en la complejidad del mecanismo.[^9]
- Las lengüetas de latón de escala larga (*long scale*) producen un sonido más limpio y responden más rápido que las cortas con peso adicional.[^9]

### Voicing y Afinación

La afinación se realiza raspando metal de la tongue:[^16]

- **Raspar cerca de la punta libre** → sube el pitch (reduce masa en el extremo vibrante).[^16]
- **Raspar cerca del extremo fijo** → baja el pitch.[^16]

El *voicing* (ajuste tímbrico) se logra modificando el windway:[^12]

- **Curvar la tongue hacia el frame** → reduce contenido de alta frecuencia (sonido más suave).
- **Curvar alejándola del frame** → aumenta armónicos altos (sonido más brillante).
- Formar kinks o loops en la tongue altera la forma de los pulsos de aire emitidos.[^12]

La curvatura de la tongue también afecta la **velocidad del attack**: lengüetas curvadas excitan modos superiores (2do transversal, 1er torsional) más fácilmente, resultando en un onset más rápido.[^14]

***

## Implicaciones Directas para la Síntesis Digital

### Lo Que Tus Samples MKS Ya Capturan

Al grabar directamente de tu MKS, los samples ya contienen:

- El espectro completo de la lengüeta + el filtrado de la caja de teca.
- La asimetría natural de los pulsos de aire.
- El contenido armónico extendido.
- Las características de voicing propias de ese instrumento específico.

### Lo Que la Síntesis/Playback Debe Replicar

Para ir más allá de un simple sample player y acercarte al comportamiento analógico, los parámetros críticos a modelar son:

**1. Dinámica del fuelle (bellows behavior)**
- Variación de amplitud suave y continua, no discreta.
- Micro-variación de pitch (±1–2 Hz) correlacionada con cambios de presión.[^15]
- El "breathing" natural del fuelle: ciclos de inhale/exhale con leve modulación de amplitud.[^17]
- El fuelle reservorio amortigua transiciones bruscas (efecto low-pass en la envolvente de amplitud).[^9]

**2. Transiente de ataque**
- Attack lento e inherente al mecanismo free reed (alto Q).[^12]
- Contenido transitorio de alta frecuencia que decae rápidamente (modos superiores).[^14]
- El attack es dependiente de la presión del fuelle: con menos presión, onset aún más lento.[^12]
- Crossfade entre el transiente grabado y el loop de sustain puede emularlo.

**3. Interacción entre múltiples lengüetas**
- Cuando varias notas suenan simultáneamente, comparten la misma reserva de aire.
- Más notas abiertas = menos presión por lengüeta = volumen individual ligeramente menor.
- Los batimientos (*beatings*) entre lengüetas cercanas son naturales y deseables (parte del carácter).

**4. Variabilidad micro-tímbrica**
- Cada lengüeta tiene su propio espectro ligeramente diferente, incluso en el mismo instrumento.[^12]
- Ligeras diferencias de voicing y tolerancia de corte crean una "firma" única por nota.

**5. Comportamiento de release**
- Al cerrar una válvula, el sonido no corta instantáneamente; la presión residual en la cámara permite que la lengüeta continúe oscilando brevemente con amplitud decreciente.
- Al detener el fuelle (sin cerrar válvulas), el drone decae gradualmente conforme la presión del reservorio se agota.

### Modelo Source-Filter Aplicable

Basado en el trabajo de Puranik y Scavone, una implementación avanzada podría usar:[^15]

1. **Source**: wavetable generada a partir del LTAS de tus grabaciones MKS (los primeros 30-40 armónicos), leída a la frecuencia de cada nota.
2. **Filter**: cascade de 8-10 biquads que modele la respuesta de la caja de teca de tu MKS específico (estimable vía IAIF de tus grabaciones).
3. **Bellows model**: modulación de amplitud + micro-pitch variation controlada por un parámetro "presión" virtual que simule los ciclos del pump bellows.

***

## Tabla Comparativa: Shruti Box Analógico vs. Tu App Actual

| Aspecto | Shruti Box Analógico | App Actual (Tone.js fatsine) | Mejora Posible |
|---|---|---|---|
| Fuente de sonido | Pulsos de aire asimétricos con espectro extendido | Síntesis fatsine (3 oscillators detuned)[^18] | Usar samples MKS o wavetable basada en LTAS |
| Filtrado de caja | Filtro pasivo de madera (8-9 formantes) | Sin filtro de caja | Implementar cascade biquad modelando la respuesta |
| Dinámica del fuelle | Presión continua variable con inercia | Volume 0-1 + speed 0.25-3x[^18] | Modelar inercia del reservorio + micro-pitch variation |
| Attack | Lento, con modos transitorios superiores | ADSR fijo (A=0.08)[^18] | Attack variable según "presión"; burst HF en transiente |
| Release | Decay gradual por presión residual | Release fijo (R=0.8)[^18] | Release dependiente de estado del fuelle virtual |
| Multi-nota | Presión compartida (menos volumen por nota) | Volumen independiente por nota[^18] | Dividir presión virtual entre notas activas |
| Micro-variación | Pitch drift ±1-2 Hz natural | Pitch fijo por nota | LFO sutil en pitch controlado por "presión" |

***

## Conclusión Técnica

El shruti box es un instrumento de engañosa simplicidad mecánica que produce un sonido acústicamente complejo. La clave de su carácter orgánico reside en la interacción no-lineal entre presión del fuelle, oscilación de la lengüeta libre (con su alto Q y espectro extendido), y el filtrado pasivo de la caja de madera. Para replicar fielmente ese comportamiento en la app, el camino más efectivo es combinar **samples reales de tu MKS** (que ya capturan source + filter) con un **modelo de fuelle virtual** que module amplitud, micro-pitch y distribución de presión entre notas activas, más un **modelo de transiente** que contemple la lentitud inherente del onset free reed y los modos superiores transitorios.

---

## References

1. [Shruti Box - Organology: Musical Instruments Encyclopedia](https://organology.net/instrument/shruti-box/) - The Shruti Box generates sound through the vibration of free reeds, activated by air pressure from t...

2. [What the Heck Is a Shruti Box? – Flypaper](https://flypaper.soundfly.com/discover/what-the-heck-is-a-shruti-box/) - The shruti box's warm, textural drone can be used as a backing track for soloing instrumentalists, a...

3. [Shruti box - Wikipedia](https://en.wikipedia.org/wiki/Shruti_box)

4. [FAQs](https://www.shrutibox.co.uk/faqs/) - The instrument works by moving air through small metal 'free' reeds fixed to an internal wooden reed...

5. [Shruti Box MKS - C - Kala Kendar's Music Warehouse](https://www.kalakendar.com/shruti-box-mks-c/) - Redesigned shruti box for 2025. The reed board is made from well seasoned Teak wood, thirteen indivi...

6. [Details](https://www.india-instruments.com/shrutibox-details/monoj-kumar-sardar-musicians-mall-large-c.html)

7. [MKS Special Concert Shruti Large Box, Natural Color With Bag FBB](https://www.maharajamusicals.com/mks-special-concert-shruti-large-box-natural-color-with-bag-fbb/) - This is a special large Shruti Box. It has been crafted using teak Wood and there are 2 sets of spec...

8. [M1 Shruti Box | Shruti Box Company](https://www.shrutibox.co.uk/m1/) - Teak (Tectona grandis) reed-board. Dynamics control, The counter-balanced dual bellows are smooth ru...

9. [Inside and Out Part 4 – The Shruti Box | Music and Melodeons](https://ukebert.wordpress.com/2012/07/16/inside-and-out-part-4-the-shruti-box/) - The Shruti box has two sets of bellows, one on each side, secured by catches. The idea is very simil...

10. [A Brief Tour of the Harmonium - Ananda](https://www.ananda.org/a-brief-tour-of-the-harmonium/) - The harmonium is a simple, hand-pumped reed organ. Pumping the external bellows inflates the interna...

11. [home made shruti box/harmonium : r/Accordion - Reddit](https://www.reddit.com/r/Accordion/comments/1dknisi/home_made_shruti_boxharmonium/) - A shruti box has two bellows. One inhaling air, one storing air under spring preassure. Without the ...

12. [The physics of free reeds](http://www.colinpykett.org.uk/physics-of-free-reed-wind-instruments.htm) - It shows that the reed is an acoustic negative resistance oscillator, oscillation being maintained b...

13. [Free reed aerophone - Wikipedia](https://en.wikipedia.org/wiki/Free_reed_instrument)

14. [A Survey of Recent Studies on Initial Transients in Free Reed Oscillation](https://pub.dega-akustik.de/ICA2019/data/articles/001430.pdf)

15. [[PDF] Physically inspired signal model for harmonium sound synthesis](https://www.dafx.de/paper-archive/2023/DAFx23_paper_47.pdf) - The proposed system used a source-filter struc- ture in which a 1D physics-based model of a free ree...

16. [How (and why) to tune a Shruti Box - YouTube](https://www.youtube.com/watch?v=2G8UBdOZYpU) - ... tuner. Use your electronic tuner to check the tuning of each reed. Write down how sharp or flat ...

17. [How To Play Shruti Box for Absolute Beginners with Ixchel Prisma](https://www.youtube.com/watch?v=hvVXtux4BYU) - Welcome to your first lesson on how to play the shruti box. In this video you will learn some basic ...

18. [shrutibox-app-README.md](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_7f8148a4-77e5-4692-a5f5-5bf995ab34cd/a28c6782-6d09-4d0e-b16a-f292f75acbdb/shrutibox-app-README.md?AWSAccessKeyId=ASIA2F3EMEYE55R64TQP&Signature=YNDr2AnIcw8ryQr0oP%2B5yvybnPk%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIAOHr1bKJ%2BPMC54ehdecIQvi528NleIqifmc%2BufmkaY9AiBUXDawJw%2FWFy2tkfAq02eRFrHtvKwObD0gljv33rt94CrzBAhfEAEaDDY5OTc1MzMwOTcwNSIM4RahnR2%2Fi5FtRzhfKtAElOs66Jl5JTJyrVseHft14%2BpyeV6LqC64%2BsEpyxZXOYGeEMVFFLaD9aKowUZZHvRHsPs7dzaxMW%2BeCjnpDzKJL%2FIfPNqtutP%2BFbAmlnxubvcJXoL1d22o%2F8hxYM0fkkpDB%2BQ6P2l%2BfK%2BQKoqdaTQqYnW3RnMGBep8dOtX2dYQNS98YFKCVhM8u4gJWmv4Z%2F9Zmuj2wmP6NoPH8xngF027eo92zrUfBTac49K%2BHt4Ny6QggATLbeYS9dyR2dUoR%2F9i9BoxMJQ2vmQyREGley4AuQLFbmHlVrYU3gv%2FF5wfAA2vM2ZGhFhi%2FZD0lzwFsFqBmRsWMnSqa6EDC2SeRm7oWw3l37NA6A13tLM6LYx7Jyel%2FkmslSGTgSkPuqv3IqrSgyF05DHTVNyJ3WriCbQWbl5a0IDkSUGhjVEEGhJsb0%2B35T0RPMgQLOl0LiwbDuQKzD5RL55oqW1cH2NEji%2FyKgCcGnYvfiRnyiRSIOjKsZ9RdkcsHCQ%2Fn8BkGcdPvrZNRSsdH1bjb1zqjC3HYx%2Futdjljmld430Z9c5C3VwW4G0c0kd5Kzjke%2FXNvbofwN%2FIx3oewOeUaRBU89xKIMAzYQEd%2BShPCfRg%2F74%2FIJcX7NjLm86M74vhVbPZII7EMWudbCzE2kDR2PUcgCMA0WQssWTdosZsHzxAkz6xdVX265ZG4tdQFoq0yW4pCKtDMX0lZXvVUQoNzE88YEWyGFd38cyrExFlkax7LoIHJuVrGYL1dde2VLsMKN9uzxZEYi9iRA6%2FfEGxL8QhqdsETg6CUzDEx43NBjqZAfrYp3zBb6sik3YN3h63SjVjav05Bzf%2FPaUvf4%2FM0y310sjbwqHjuPMkKalj7YvtIARhC%2FAQ0nRJNh%2BZypZl9%2FW0dgtZIYH%2B0dXaStYkC9%2B3QBbvG8k2qtAbwM9q2XyMVn4ya5ahmmLjhUcHkdRgK1YnwILkFBcGyW4Hf1uLFHCG2K41vzVkK%2FN0LMoaU2Cqm6IhX6zcyxLMjQ%3D%3D&Expires=1772319301) - # Shrutibox Digital

Replica digital de un shrutibox acustico **Monoj Kumar Sardar 440Hz**, construi...

