/**
 * RIGO THE CHAMELEON v2 - Mascota oficial del ecosistema de inglés
 * Estilo: Kawaii realista (silueta de camaleón con cresta, cola enrollada, 4 patas)
 *
 * Uso:  <script src="rigo.js"></script>
 *       <rigo-mascot grade="Noveno"></rigo-mascot>
 *       (el atributo grade filtra los hints personalizados)
 *
 * API pública:
 *   rigo.welcome()        -> saludo inicial antes del NIE
 *   rigo.loginSuccess(n)  -> celebración al ingresar
 *   rigo.setGrade(grade)  -> filtra hints al grado actual
 *   rigo.inviteGame()     -> invita al juego final
 *   rigo.cheer()          -> festeja una respuesta correcta
 *   rigo.comfort()        -> consuela tras un error
 *   rigo.say(texto, ms)   -> mensaje libre
 *   rigo.setEmotion(e)    -> cambia emoción manualmente
 *
 * Eventos emitidos:
 *   rigo-hint-requested   -> cuando el estudiante toca a Rigo pidiendo ayuda
 */
(function () {
  'use strict';

  const EMOTIONS = [
    'neutral', 'welcome', 'happy', 'confused', 'thinking',
    'sneaky', 'sad', 'excited', 'game', 'love', 'easterEgg'
  ];

  const RANDOM_MESSAGES = [
    { text: "You can do it!", grade: null },
    { text: "¡Tú puedes!", grade: null },
    { text: "English is fun!", grade: null },
    { text: "Keep going, friend!", grade: null },
    { text: "¡No te rindas!", grade: null },
    { text: "I believe in you!", grade: null },
    { text: "Practice makes perfect", grade: null },
    { text: "Learning is cool", grade: null },
    { text: "You're doing great!", grade: null },
    { text: "Respira y continúa", grade: null },
    { text: "One step at a time", grade: null }
  ];

  // HINTS: si grade es null aparecen para todos los grados.
  //        si grade es un array, solo aparecen para esos grados.
  // Grados válidos: "Séptimo", "Octavo", "Noveno", "Primer Año", "Segundo Año", "Prueba"
  const HINT_MESSAGES = [
    { text: "Psst... piensa en el pasado", grade: null },
    { text: "Tranqui, revisa la pregunta otra vez", grade: null },
    { text: "Una pista: lee despacio", grade: null },
    { text: "Confía en tu primera idea", grade: null },
    { text: "¿Ya intentaste? ¡Tú puedes!", grade: null },
    { text: "Shhh no le digas al teacher Eliseo. pero la primera respuesta del audio es (What)", grade: null },
    { text: "Que Dios te ayude porque yo no", grade: null },
    { text: "La respuesta está en tu corazón", grade: null },
    { text: "Deja de tocarme o llamo a mi abogado", grade: null },
    { text: "Ya ni le muevas, no sé inglés", grade: null },
    { text: "Esto es culpa de Darwin", grade: ["Noveno"] },
    { text: "¿Todavía no has terminado?", grade: null },
    { text: "Diocuarde, yo ya hubiera terminado", grade: null },
    { text: "¿Ya viste el nuevo capítulo de la Rosa de Guadalupe?", grade: null },
    { text: "El diccionario de Inglés está llorando", grade: null },
    { text: "Si fallas, te convierto en sopa de letras", grade: null },
    { text: "Respira, no es cálculo", grade: null },
    { text: "El inglés es como yo: bonito", grade: null },
    { text: "Yo solo soy un camaleón, no un traductor", grade: null },
    { text: "Mejor pregúntale al Wilmer", grade: ["Segundo Año"] },
    { text: "Esta pregunta la sabe hasta mi abuela", grade: null },
    { text: "¿Y si mejor estudias? (broma XD)", grade: null },
    { text: "Que ya sea recreo please!", grade: null },
    { text: "No, ningún hello ni ningún afternoon", grade: null }
  ];

  const CHEER_MESSAGES = [
    "¡Excelente!", "¡Ajuuuua!", "¡Genial!", "¡Perfecto!",
    "¡Increíble!", "¡Eres una máquina!", "¡Sí señor!"
  ];

  const COMFORT_MESSAGES = [
    "Casi casi, inténtalo otra vez",
    "No pasa nada, seguimos",
    "Todos aprendemos de los errores",
    "Respira e intenta de nuevo",
    "Nadie nace sabiendo"
  ];

  class RigoMascot extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.currentEmotion = 'neutral';
      this.bubbleTimer = null;
      this.randomTimer = null;
      this.blinkTimer = null;
      this.grade = null;

      this.isDragging = false;
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
      this.hasMoved = false;
    }

    static get observedAttributes() { return ['grade']; }

    attributeChangedCallback(name, _oldVal, newVal) {
      if (name === 'grade') this.grade = newVal || null;
    }

    connectedCallback() {
      this.grade = this.getAttribute('grade') || null;
      this.render();
      this.restorePosition();
      this.setupInteractions();
      this.startRandomMessages();
      this.startBlinking();
    }

    disconnectedCallback() {
      clearTimeout(this.randomTimer);
      clearInterval(this.blinkTimer);
      clearTimeout(this.bubbleTimer);
    }

    // Filtra mensajes según grado: null = todos; array = solo esos grados.
    pickMessage(pool) {
      const candidates = pool.filter(m =>
        m.grade === null || (Array.isArray(m.grade) && this.grade && m.grade.includes(this.grade))
      );
      if (!candidates.length) return pool[0].text;
      return candidates[Math.floor(Math.random() * candidates.length)].text;
    }

    // ======================= SVG CAMALEÓN =======================
    getSVG(emotion) {
      if (emotion === 'easterEgg') {
        return `
          <svg viewBox="0 0 200 200" width="100%" height="100%">
            <g stroke="#1a1a1a" stroke-width="3">
              <rect x="5" y="5" width="92" height="92" fill="#FF6B9D"/>
              <rect x="103" y="5" width="92" height="92" fill="#FFE66D"/>
              <rect x="5" y="103" width="92" height="92" fill="#4ECDC4"/>
              <rect x="103" y="103" width="92" height="92" fill="#A8E6CF"/>
            </g>
            <g font-family="Impact, sans-serif" font-size="22" fill="#1a1a1a" text-anchor="middle" font-weight="bold">
              <text x="51" y="58">RIGO</text>
              <text x="149" y="58">POP</text>
              <text x="51" y="156">ART</text>
              <text x="149" y="156">!</text>
            </g>
          </svg>
        `;
      }

      const face = this.getFaceParts(emotion);
      const bodyAnim = emotion === 'excited' ? 'style="animation: rigoBounce 0.6s ease-in-out infinite;"' : '';

      const wavingArm = emotion === 'welcome'
        ? `<g style="transform-origin: 150px 125px; animation: rigoWave 0.9s ease-in-out infinite;">
             <path d="M 150 125 Q 165 105 170 85" fill="none" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>
             <path d="M 150 125 Q 165 105 170 85" fill="none" class="rigo-skin-stroke" stroke-width="9" stroke-linecap="round" opacity="0.95"/>
             <ellipse cx="172" cy="82" rx="10" ry="8" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
             <path d="M 168 78 L 165 72 M 172 76 L 172 68 M 176 78 L 179 72" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
           </g>`
        : '';

      const gameGlasses = emotion === 'game'
        ? `<rect x="44" y="76" width="40" height="22" rx="4" fill="#1a1a1a"/>
           <rect x="116" y="76" width="40" height="22" rx="4" fill="#1a1a1a"/>
           <rect x="84" y="84" width="32" height="4" fill="#1a1a1a"/>
           <rect x="50" y="80" width="8" height="6" fill="#fff" opacity="0.4"/>
           <rect x="122" y="80" width="8" height="6" fill="#fff" opacity="0.4"/>`
        : '';

      const questionMark = emotion === 'confused'
        ? `<text x="165" y="40" font-family="Impact, sans-serif" font-size="32" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="1.5" font-weight="bold">?</text>`
        : '';

      const thoughtBubble = emotion === 'thinking'
        ? `<circle cx="168" cy="50" r="10" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
           <circle cx="185" cy="32" r="6" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>`
        : '';

      const tear = emotion === 'sad'
        ? `<path d="M 52 108 Q 54 118 56 108 Q 58 118 56 122 Q 52 124 50 120 Z" fill="#4FC3F7" stroke="#1a1a1a" stroke-width="1.5"/>`
        : '';

      return `
        <svg viewBox="0 0 200 200" width="100%" height="100%" ${bodyAnim}>
          <defs>
            <radialGradient id="cheek" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#FF6B9D" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#FF6B9D" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="belly" cx="50%" cy="30%">
              <stop offset="0%" stop-color="#D4F5A8" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#B8E986" stop-opacity="0.6"/>
            </radialGradient>
          </defs>

          <!-- COLA ENROLLADA -->
          <path d="M 55 150 Q 35 150, 25 135 Q 15 120, 20 105 Q 25 92, 38 92 Q 48 92, 48 102 Q 48 108, 42 108 Q 37 108, 37 103"
                fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
          <path d="M 55 150 Q 35 150, 25 135 Q 15 120, 20 105 Q 25 92, 38 92 Q 48 92, 48 102 Q 48 108, 42 108 Q 37 108, 37 103"
                fill="none" class="rigo-skin-stroke" stroke-width="12" stroke-linecap="round" opacity="0.95"/>
          <g stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round" opacity="0.5">
            <path d="M 50 148 Q 48 152 46 150" fill="none"/>
            <path d="M 38 144 Q 35 147 33 144" fill="none"/>
            <path d="M 28 130 Q 25 130 24 127" fill="none"/>
          </g>

          <!-- PATAS TRASERAS -->
          <ellipse cx="70" cy="168" rx="14" ry="9" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <path d="M 60 170 L 58 175 M 66 172 L 65 178 M 72 172 L 72 178" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
          <ellipse cx="130" cy="168" rx="14" ry="9" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <path d="M 120 172 L 120 178 M 128 172 L 128 178 M 136 170 L 138 175" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>

          <!-- CUERPO -->
          <path d="M 55 135 Q 50 160, 75 165 Q 100 170, 125 165 Q 150 160, 145 135 Q 145 125, 135 118 L 65 118 Q 55 125, 55 135 Z"
                class="rigo-skin" stroke="#1a1a1a" stroke-width="3.5"/>
          <ellipse cx="100" cy="150" rx="28" ry="15" fill="url(#belly)"/>
          <g stroke="#1a1a1a" stroke-width="1" stroke-linecap="round" opacity="0.3" fill="none">
            <path d="M 82 145 Q 100 148 118 145"/>
            <path d="M 80 152 Q 100 156 120 152"/>
            <path d="M 82 159 Q 100 162 118 159"/>
          </g>

          <!-- PATITAS DELANTERAS -->
          <ellipse cx="55" cy="150" rx="9" ry="12" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <path d="M 50 158 L 48 163 M 55 160 L 55 165 M 60 158 L 62 163" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
          <ellipse cx="145" cy="150" rx="9" ry="12" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <path d="M 140 158 L 138 163 M 145 160 L 145 165 M 150 158 L 152 163" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>

          ${wavingArm}

          <!-- CRESTA DENTADA -->
          <path d="M 70 55 L 78 38 L 85 52 L 92 32 L 100 50 L 108 30 L 116 50 L 123 38 L 130 55 Z"
                class="rigo-skin" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>

          <!-- CABEZA -->
          <path d="M 100 45 C 55 45, 40 80, 45 110 C 50 135, 70 135, 100 135 C 130 135, 150 135, 155 110 C 160 80, 145 45, 100 45 Z"
                class="rigo-skin" stroke="#1a1a1a" stroke-width="3.5"/>

          <!-- MOTITAS -->
          <g fill="#FFE066" opacity="0.7">
            <circle cx="70" cy="60" r="2"/>
            <circle cx="85" cy="50" r="1.5"/>
            <circle cx="130" cy="58" r="2"/>
            <circle cx="115" cy="48" r="1.5"/>
            <circle cx="98" cy="65" r="1.5"/>
            <circle cx="90" cy="140" r="1.5"/>
            <circle cx="115" cy="142" r="2"/>
            <circle cx="135" cy="155" r="1.5"/>
          </g>
          <g fill="#52BF48" opacity="0.45">
            <circle cx="78" cy="72" r="2"/>
            <circle cx="122" cy="68" r="2"/>
            <circle cx="100" cy="55" r="1.5"/>
            <circle cx="75" cy="130" r="1.5"/>
            <circle cx="125" cy="132" r="1.5"/>
            <circle cx="65" cy="145" r="1.5"/>
          </g>

          <!-- OJOS -->
          ${face.leftEye}
          ${face.rightEye}

          <!-- MEJILLAS -->
          <ellipse cx="48" cy="108" rx="11" ry="7" fill="url(#cheek)"/>
          <ellipse cx="152" cy="108" rx="11" ry="7" fill="url(#cheek)"/>

          <!-- FOSAS NASALES -->
          <circle cx="94" cy="108" r="1.5" fill="#1a1a1a"/>
          <circle cx="106" cy="108" r="1.5" fill="#1a1a1a"/>

          ${face.mouth}
          ${gameGlasses}
          ${questionMark}
          ${thoughtBubble}
          ${tear}

          <!-- BRILLO SUPERIOR -->
          <ellipse cx="85" cy="58" rx="14" ry="6" fill="#fff" opacity="0.3"/>
        </svg>
      `;
    }

    getFaceParts(emotion) {
      // Ojos laterales salientes como la referencia
      const LE_CX = 55, LE_CY = 88;
      const RE_CX = 145, RE_CY = 88;

      let leftEye, rightEye, mouth;

      switch (emotion) {
        case 'happy':
          leftEye = this.happyEye(LE_CX, LE_CY);
          rightEye = this.happyEye(RE_CX, RE_CY);
          mouth = `<path d="M 85 122 Q 100 138 115 122" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'excited':
          leftEye = this.sparkleEye(LE_CX, LE_CY);
          rightEye = this.sparkleEye(RE_CX, RE_CY);
          mouth = `<ellipse cx="100" cy="126" rx="13" ry="9" fill="#FF3366" stroke="#1a1a1a" stroke-width="3"/>
                   <path d="M 90 124 Q 100 118 110 124" fill="none" stroke="#FFB8CC" stroke-width="2"/>`;
          break;
        case 'welcome':
          leftEye = this.bigEye(LE_CX, LE_CY);
          rightEye = this.bigEye(RE_CX, RE_CY);
          mouth = `<path d="M 85 122 Q 100 134 115 122" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'confused':
          leftEye = this.bigEye(LE_CX, LE_CY, -2);
          rightEye = this.smallEye(RE_CX, RE_CY);
          mouth = `<path d="M 88 124 Q 94 119 100 124 Q 106 129 112 124" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'thinking':
          leftEye = `<ellipse cx="${LE_CX}" cy="${LE_CY}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
                     <path d="M 44 88 L 66 90" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>`;
          rightEye = this.bigEye(RE_CX, RE_CY, 0, 2);
          mouth = `<path d="M 90 126 L 112 122" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'sneaky':
          leftEye = `<ellipse cx="${LE_CX}" cy="${LE_CY}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
                     <path d="M 42 88 Q 55 80 68 88" fill="none" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>
                     <path d="M 47 90 Q 55 86 63 90" fill="#1a1a1a" stroke="none"/>`;
          rightEye = `<ellipse cx="${RE_CX}" cy="${RE_CY}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
                      <path d="M 132 88 Q 145 80 158 88" fill="none" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>
                      <path d="M 137 90 Q 145 86 153 90" fill="#1a1a1a" stroke="none"/>`;
          mouth = `<path d="M 85 124 Q 100 132 118 118" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'sad':
          leftEye = this.bigEye(LE_CX, LE_CY + 2, 0, 3);
          rightEye = this.bigEye(RE_CX, RE_CY + 2, 0, 3);
          mouth = `<path d="M 85 130 Q 100 120 115 130" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'game':
          leftEye = `<ellipse cx="${LE_CX}" cy="${LE_CY}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>`;
          rightEye = `<ellipse cx="${RE_CX}" cy="${RE_CY}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>`;
          mouth = `<path d="M 85 122 Q 100 134 115 122" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'love':
          leftEye = this.heartEye(LE_CX, LE_CY);
          rightEye = this.heartEye(RE_CX, RE_CY);
          mouth = `<path d="M 85 122 Q 100 136 115 122" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          break;
        case 'neutral':
        default:
          leftEye = this.bigEye(LE_CX, LE_CY);
          rightEye = this.bigEye(RE_CX, RE_CY);
          mouth = `<path d="M 90 124 Q 100 130 110 124" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
      }
      return { leftEye, rightEye, mouth };
    }

    // Ojo grande kawaii con párpado saliente (estilo camaleón real)
    bigEye(cx, cy, pupilOffsetX = 0, pupilOffsetY = 0) {
      return `
        <g>
          <ellipse cx="${cx}" cy="${cy}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <circle cx="${cx}" cy="${cy}" r="13" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
          <circle cx="${cx + pupilOffsetX}" cy="${cy + pupilOffsetY}" r="9" fill="#1a1a1a"/>
          <circle cx="${cx - 3 + pupilOffsetX}" cy="${cy - 3 + pupilOffsetY}" r="3.5" fill="#fff"/>
          <circle cx="${cx + 4 + pupilOffsetX}" cy="${cy + 4 + pupilOffsetY}" r="1.5" fill="#fff"/>
        </g>
      `;
    }

    smallEye(cx, cy) {
      return `
        <g>
          <ellipse cx="${cx}" cy="${cy}" rx="14" ry="13" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <circle cx="${cx}" cy="${cy}" r="8" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
          <circle cx="${cx}" cy="${cy}" r="5" fill="#1a1a1a"/>
          <circle cx="${cx - 1.5}" cy="${cy - 1.5}" r="2" fill="#fff"/>
        </g>
      `;
    }

    happyEye(cx, cy) {
      return `
        <g>
          <ellipse cx="${cx}" cy="${cy}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <path d="M ${cx - 10} ${cy + 2} Q ${cx} ${cy - 10} ${cx + 10} ${cy + 2}"
                fill="none" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>
        </g>
      `;
    }

    sparkleEye(cx, cy) {
      return `
        <g>
          <ellipse cx="${cx}" cy="${cy}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <circle cx="${cx}" cy="${cy}" r="13" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
          <circle cx="${cx}" cy="${cy}" r="10" fill="#1a1a1a"/>
          <path d="M ${cx - 4} ${cy - 5} L ${cx - 1} ${cy - 1} L ${cx + 4} ${cy - 4}
                   L ${cx + 1} ${cy + 2} L ${cx + 5} ${cy + 5} L ${cx} ${cy + 3}
                   L ${cx - 5} ${cy + 6} L ${cx - 2} ${cy + 1} Z" fill="#fff"/>
          <circle cx="${cx + 5}" cy="${cy + 5}" r="1.5" fill="#fff"/>
        </g>
      `;
    }

    heartEye(cx, cy) {
      return `
        <g>
          <ellipse cx="${cx}" cy="${cy}" rx="18" ry="17" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
          <path d="M ${cx} ${cy + 6}
                   C ${cx - 10} ${cy - 2}, ${cx - 12} ${cy - 8}, ${cx - 6} ${cy - 8}
                   C ${cx - 2} ${cy - 8}, ${cx} ${cy - 4}, ${cx} ${cy - 2}
                   C ${cx} ${cy - 4}, ${cx + 2} ${cy - 8}, ${cx + 6} ${cy - 8}
                   C ${cx + 12} ${cy - 8}, ${cx + 10} ${cy - 2}, ${cx} ${cy + 6} Z"
                fill="#FF3366" stroke="#1a1a1a" stroke-width="2"/>
          <circle cx="${cx - 4}" cy="${cy - 5}" r="1.5" fill="#fff"/>
        </g>
      `;
    }

    // ======================= RENDER =======================
    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            font-family: 'Comic Sans MS', 'Chalkboard SE', system-ui, sans-serif;
            touch-action: none;
          }
          #rigo-wrapper {
            position: relative;
            width: 140px;
            height: 140px;
            cursor: grab;
            filter: drop-shadow(3px 4px 0 rgba(0,0,0,0.25));
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          #rigo-wrapper.dragging {
            cursor: grabbing;
            transition: none;
            filter: drop-shadow(6px 8px 0 rgba(0,0,0,0.35));
          }
          #rigo-wrapper:hover:not(.dragging) { transform: scale(1.08) rotate(-3deg); }
          #rigo-wrapper:active:not(.dragging) { transform: scale(0.95); }

          @keyframes popArtSkin {
            0%   { fill: #7ED957; }
            14%  { fill: #5AC850; }
            28%  { fill: #8FDB5F; }
            42%  { fill: #6BCF4A; }
            57%  { fill: #7FD856; }
            71%  { fill: #52BF48; }
            85%  { fill: #85D95B; }
            100% { fill: #7ED957; }
          }
          @keyframes popArtStroke {
            0%   { stroke: #7ED957; }
            14%  { stroke: #5AC850; }
            28%  { stroke: #8FDB5F; }
            42%  { stroke: #6BCF4A; }
            57%  { stroke: #7FD856; }
            71%  { stroke: #52BF48; }
            85%  { stroke: #85D95B; }
            100% { stroke: #7ED957; }
          }
          .rigo-skin { animation: popArtSkin 180s infinite linear; fill: #7ED957; }
          .rigo-skin-stroke { animation: popArtStroke 180s infinite linear; stroke: #7ED957; }

          @keyframes rigoBounce {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-6px); }
          }
          @keyframes rigoWave {
            0%, 100% { transform: rotate(-20deg); }
            50%      { transform: rotate(20deg); }
          }
          @keyframes rigoIdle {
            0%, 100% { transform: translateY(0) rotate(0); }
            50%      { transform: translateY(-3px) rotate(1deg); }
          }

          #svg-container {
            width: 100%;
            height: 100%;
            animation: rigoIdle 4s ease-in-out infinite;
            pointer-events: none;
          }

          #speech-bubble {
            position: absolute;
            bottom: 110%;
            right: 10%;
            background: #fff;
            border: 3px solid #1a1a1a;
            border-radius: 18px;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: bold;
            color: #1a1a1a;
            line-height: 1.3;
            width: max-content;
            max-width: 200px;
            text-align: center;
            box-shadow: 3px 4px 0 #1a1a1a;
            opacity: 0;
            transform: translateY(10px) scale(0.8);
            transition: opacity 0.25s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: none;
            white-space: normal;
          }
          #speech-bubble::after {
            content: '';
            position: absolute;
            bottom: -10px;
            right: 25px;
            width: 0;
            height: 0;
            border: 10px solid transparent;
            border-top-color: #fff;
            border-bottom: 0;
          }
          #speech-bubble::before {
            content: '';
            position: absolute;
            bottom: -14px;
            right: 22px;
            width: 0;
            height: 0;
            border: 13px solid transparent;
            border-top-color: #1a1a1a;
            border-bottom: 0;
          }
          #speech-bubble.show {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          @media (max-width: 480px) {
            :host { bottom: 10px; right: 10px; }
            #rigo-wrapper { width: 110px; height: 110px; }
            #speech-bubble { font-size: 12px; max-width: 160px; }
          }
        </style>

        <div id="rigo-wrapper" translate="no">
          <div id="speech-bubble"></div>
          <div id="svg-container">${this.getSVG(this.currentEmotion)}</div>
        </div>
      `;
    }

    // ======================= INTERACCIONES =======================
    setupInteractions() {
      const wrapper = this.shadowRoot.getElementById('rigo-wrapper');

      const onDown = (e) => {
        this.isDragging = true;
        this.hasMoved = false;
        wrapper.classList.add('dragging');
        const point = e.touches ? e.touches[0] : e;
        const rect = this.getBoundingClientRect();
        this.dragOffsetX = point.clientX - rect.left;
        this.dragOffsetY = point.clientY - rect.top;
        e.preventDefault();
      };

      const onMove = (e) => {
        if (!this.isDragging) return;
        this.hasMoved = true;
        const point = e.touches ? e.touches[0] : e;
        const x = point.clientX - this.dragOffsetX;
        const y = point.clientY - this.dragOffsetY;
        const maxX = window.innerWidth - this.offsetWidth;
        const maxY = window.innerHeight - this.offsetHeight;
        this.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        this.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        this.style.right = 'auto';
        this.style.bottom = 'auto';
        e.preventDefault();
      };

      const onUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        wrapper.classList.remove('dragging');
        if (this.hasMoved) this.savePosition();
        else this.handleTap();
      };

      wrapper.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      wrapper.addEventListener('touchstart', onDown, { passive: false });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }

    handleTap() {
      if (Math.random() < 0.008) {
        this.setEmotion('easterEgg');
        this.say("¡Modo POP ART desbloqueado!", 3500);
        setTimeout(() => this.setEmotion('neutral'), 3500);
        return;
      }
      this.setEmotion('sneaky');
      const hint = this.pickMessage(HINT_MESSAGES);
      this.say(hint, 4000);
      this.dispatchEvent(new CustomEvent('rigo-hint-requested', {
        bubbles: true, composed: true,
        detail: { hint, emotion: this.currentEmotion }
      }));
      setTimeout(() => this.setEmotion('neutral'), 4000);
    }

    savePosition() {
      try {
        localStorage.setItem('rigo_pos', JSON.stringify({
          left: this.style.left, top: this.style.top
        }));
      } catch (e) { /* silencioso */ }
    }

    restorePosition() {
      try {
        const saved = localStorage.getItem('rigo_pos');
        if (!saved) return;
        const pos = JSON.parse(saved);
        if (pos.left && pos.top) {
          this.style.left = pos.left;
          this.style.top = pos.top;
          this.style.right = 'auto';
          this.style.bottom = 'auto';
        }
      } catch (e) { /* silencioso */ }
    }

    setEmotion(emotion) {
      if (!EMOTIONS.includes(emotion)) emotion = 'neutral';
      this.currentEmotion = emotion;
      const container = this.shadowRoot.getElementById('svg-container');
      if (container) container.innerHTML = this.getSVG(emotion);
    }

    say(text, duration = 4000) {
      const bubble = this.shadowRoot.getElementById('speech-bubble');
      if (!bubble) return;
      bubble.textContent = text;
      bubble.classList.add('show');
      if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
      this.bubbleTimer = setTimeout(() => {
        bubble.classList.remove('show');
      }, duration);
    }

    startRandomMessages() {
      const schedule = () => {
        const delay = 45000 + Math.random() * 60000;
        this.randomTimer = setTimeout(() => {
          const bubble = this.shadowRoot.getElementById('speech-bubble');
          if (bubble && !bubble.classList.contains('show') && !this.isDragging) {
            const msg = this.pickMessage(RANDOM_MESSAGES);
            const prev = this.currentEmotion;
            this.setEmotion('happy');
            this.say(msg, 3500);
            setTimeout(() => this.setEmotion(prev), 3500);
          }
          schedule();
        }, delay);
      };
      schedule();
    }

    startBlinking() {
      this.blinkTimer = setInterval(() => {
        if (!['neutral', 'happy', 'welcome'].includes(this.currentEmotion)) return;
        const svg = this.shadowRoot.querySelector('#svg-container svg');
        if (!svg) return;
        const eyes = svg.querySelectorAll('circle[r="13"]');
        eyes.forEach(e => { e.style.transform = 'scaleY(0.1)'; e.style.transformOrigin = 'center'; });
        setTimeout(() => { eyes.forEach(e => e.style.transform = ''); }, 140);
      }, 4500 + Math.random() * 3000);
    }

    // ======================= API PÚBLICA =======================
    setGrade(grade) {
      this.grade = grade || null;
      this.setAttribute('grade', grade || '');
    }

    welcome() {
      this.setEmotion('welcome');
      this.say("¡Hola! Soy Rigo, tu compañero de estudio. Escribe tu NIE", 7000);
    }

    loginSuccess(name) {
      this.setEmotion('excited');
      const msg = name ? `¡Hola ${name}! ¡A estudiar!` : "¡Bienvenido! ¡A estudiar!";
      this.say(msg, 4000);
      setTimeout(() => this.setEmotion('neutral'), 4000);
    }

    inviteGame() {
      this.setEmotion('game');
      this.say("¿Una partida rápida? 🎮", 5000);
    }

    cheer() {
      this.setEmotion('excited');
      const msg = CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)];
      this.say(msg, 2500);
      setTimeout(() => this.setEmotion('happy'), 2500);
    }

    comfort() {
      this.setEmotion('sad');
      const msg = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];
      this.say(msg, 3000);
      setTimeout(() => this.setEmotion('neutral'), 3000);
    }
  }

  customElements.define('rigo-mascot', RigoMascot);

  window.addEventListener('DOMContentLoaded', () => {
    window.rigo = document.querySelector('rigo-mascot');
  });
})();
