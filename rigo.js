/**
 * RIGO THE CHAMELEON - Mascota oficial del ecosistema de inglés
 * Estilo: Kawaii (tierno, redondito, ojos enormes, mejillas rosadas)
 * Uso:  <script src="rigo.js"></script>
 *       <rigo-mascot></rigo-mascot>
 *
 * API pública:
 *   rigo.welcome()        -> saludo inicial antes del NIE
 *   rigo.loginSuccess(n)  -> celebración al ingresar
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
    "You can do it!",
    "¡Tú puedes!",
    "English is fun!",
    "Keep going, friend!",
    "¡No te rindas!",
    "I believe in you!",
    "Practice makes perfect",
    "¡Sigue así!",
    "Learning is cool",
    "You're doing great!",
    "Respira y continúa",
    "One step at a time"
  ];

  const HINT_MESSAGES = [
    "Psst... piensa en el pasado",
    "Tranqui, revisa la pregunta otra vez",
    "Una pista: lee despacio",
    "Confía en tu primera idea",
    "¿Ya intentaste? ¡Tú puedes!",
    "Shhh no le digas al teacher Eliseo",
    "Que Dios te ayude porque yo no"
    "La respuesta está en tu corazón",
    "Deja de tocarme o llamo a mi abogado",
    "Ya ni le muevas, no se inglés",
    "Esto es culpa de Darwin",
    "¿Todavía no has terminado?",
    "Diocuarde, yo ya hubiera terminado",
    "¿Ya viste el nuevo capítulo de la Rosa de Guadalupe?"
  ];

  const CHEER_MESSAGES = [
    "¡Excelente!", "¡Así se hace!", "¡Genial!", "¡Perfecto!", "¡Increíble!"
  ];

  const COMFORT_MESSAGES = [
    "Casi casi, inténtalo otra vez",
    "No pasa nada, seguimos",
    "Todos aprendemos de los errores",
    "Respira e intenta de nuevo"
  ];

  class RigoMascot extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.currentEmotion = 'neutral';
      this.bubbleTimer = null;
      this.randomTimer = null;
      this.blinkTimer = null;

      // Arrastre
      this.isDragging = false;
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
      this.hasMoved = false;
    }

    connectedCallback() {
      this.render();
      this.restorePosition();
      this.setupInteractions();
      this.startRandomMessages();
      this.startBlinking();
    }

    disconnectedCallback() {
      clearInterval(this.randomTimer);
      clearInterval(this.blinkTimer);
      clearTimeout(this.bubbleTimer);
    }

    // ======================= SVG KAWAII =======================
    getSVG(emotion) {
      if (emotion === 'easterEgg') {
        // Easter egg: Rigo estilo Warhol (4 cuadros de colores)
        return `
          <svg viewBox="0 0 140 140" width="100%" height="100%">
            <g stroke="#000" stroke-width="3">
              <rect x="5" y="5" width="65" height="65" fill="#FF6B9D"/>
              <rect x="70" y="5" width="65" height="65" fill="#FFE66D"/>
              <rect x="5" y="70" width="65" height="65" fill="#4ECDC4"/>
              <rect x="70" y="70" width="65" height="65" fill="#A8E6CF"/>
            </g>
            <g font-family="Impact, sans-serif" font-size="14" fill="#000" text-anchor="middle" font-weight="bold">
              <text x="37" y="42">RIGO</text>
              <text x="102" y="42">POP</text>
              <text x="37" y="107">ART</text>
              <text x="102" y="107">!</text>
            </g>
          </svg>
        `;
      }

      // Partes de la cara por emoción
      let leftEye, rightEye, mouth, extra = '';
      let bodyBounce = '';

      switch (emotion) {
        case 'happy':
          leftEye = `<path d="M 48 58 Q 54 50 60 58" fill="none" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>`;
          rightEye = `<path d="M 80 58 Q 86 50 92 58" fill="none" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"/>`;
          mouth = `<path d="M 60 78 Q 70 88 80 78" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          break;

        case 'excited':
          leftEye = this.sparkleEye(54, 58);
          rightEye = this.sparkleEye(86, 58);
          mouth = `<ellipse cx="70" cy="82" rx="8" ry="6" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="2.5"/>
                   <path d="M 64 80 Q 70 76 76 80" fill="none" stroke="#fff" stroke-width="1.5"/>`;
          bodyBounce = 'animation: rigoBounce 0.6s ease-in-out infinite;';
          break;

        case 'welcome':
          leftEye = this.roundEye(54, 58);
          rightEye = this.roundEye(86, 58);
          mouth = `<path d="M 60 78 Q 70 86 80 78" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          // Manita saludando
          extra = `<g style="transform-origin: 112px 70px; animation: rigoWave 1s ease-in-out infinite;">
            <ellipse cx="118" cy="62" rx="9" ry="11" class="rigo-skin" stroke="#1a1a1a" stroke-width="3"/>
            <circle cx="115" cy="58" r="2" fill="#1a1a1a"/>
          </g>`;
          break;

        case 'confused':
          leftEye = `<circle cx="54" cy="58" r="7" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
                     <circle cx="52" cy="56" r="3" fill="#1a1a1a"/>`;
          rightEye = `<circle cx="86" cy="56" r="5" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
                      <circle cx="87" cy="57" r="2" fill="#1a1a1a"/>`;
          mouth = `<path d="M 62 82 Q 68 78 72 82 Q 76 86 80 82" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          extra = `<text x="105" y="40" font-family="Impact, sans-serif" font-size="22" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="1">?</text>`;
          break;

        case 'thinking':
          leftEye = `<path d="M 48 58 L 60 58" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          rightEye = this.roundEye(86, 58);
          mouth = `<path d="M 62 82 L 78 80" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          extra = `<circle cx="100" cy="30" r="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
                   <circle cx="115" cy="20" r="5" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
                   <text x="100" y="34" font-size="10" text-anchor="middle" font-weight="bold">💭</text>`;
          break;

        case 'sneaky':
          leftEye = `<path d="M 48 58 Q 54 54 60 58" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          rightEye = `<path d="M 80 58 Q 86 54 92 58" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
          mouth = `<path d="M 60 80 Q 70 84 82 78" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          break;

        case 'sad':
          leftEye = `<circle cx="54" cy="60" r="6" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
                     <circle cx="54" cy="62" r="3" fill="#1a1a1a"/>
                     <path d="M 50 72 Q 52 78 54 72" fill="#4FC3F7" stroke="#1a1a1a" stroke-width="1.5"/>`;
          rightEye = `<circle cx="86" cy="60" r="6" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
                      <circle cx="86" cy="62" r="3" fill="#1a1a1a"/>`;
          mouth = `<path d="M 62 84 Q 70 78 78 84" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          break;

        case 'game':
          leftEye = `<rect x="45" y="52" width="22" height="14" rx="3" fill="#1a1a1a"/>
                     <rect x="48" y="55" width="5" height="4" fill="#fff" opacity="0.6"/>`;
          rightEye = `<rect x="73" y="52" width="22" height="14" rx="3" fill="#1a1a1a"/>
                      <rect x="76" y="55" width="5" height="4" fill="#fff" opacity="0.6"/>`;
          mouth = `<path d="M 60 80 Q 70 86 80 80" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          extra = `<rect x="65" y="50" width="12" height="3" fill="#1a1a1a"/>`;
          break;

        case 'love':
          leftEye = `<path d="M 54 52 C 50 48, 44 52, 48 58 L 54 64 L 60 58 C 64 52, 58 48, 54 52 Z" fill="#FF3366" stroke="#1a1a1a" stroke-width="2"/>`;
          rightEye = `<path d="M 86 52 C 82 48, 76 52, 80 58 L 86 64 L 92 58 C 96 52, 90 48, 86 52 Z" fill="#FF3366" stroke="#1a1a1a" stroke-width="2"/>`;
          mouth = `<path d="M 62 78 Q 70 86 78 78" fill="#FF6B9D" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
          break;

        case 'neutral':
        default:
          leftEye = this.roundEye(54, 58);
          rightEye = this.roundEye(86, 58);
          mouth = `<path d="M 64 80 Q 70 84 76 80" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>`;
      }

      return `
        <svg viewBox="0 0 140 140" width="100%" height="100%" style="${bodyBounce}">
          <defs>
            <radialGradient id="cheekGrad" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#FF6B9D" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#FF6B9D" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Cola enrollada (detrás del cuerpo) -->
          <path d="M 25 90 Q 10 95 12 110 Q 14 125 28 122 Q 40 119 38 108"
                fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
          <path d="M 25 90 Q 10 95 12 110 Q 14 125 28 122 Q 40 119 38 108"
                fill="none" class="rigo-skin-stroke" stroke-width="8" stroke-linecap="round" opacity="0.95"/>

          <!-- Patitas -->
          <ellipse cx="48" cy="118" rx="10" ry="7" class="rigo-skin" stroke="#1a1a1a" stroke-width="2.5"/>
          <ellipse cx="92" cy="118" rx="10" ry="7" class="rigo-skin" stroke="#1a1a1a" stroke-width="2.5"/>

          <!-- Cuerpo redondito (pera invertida / gota tierna) -->
          <path d="M 70 22
                   C 42 22, 28 48, 30 72
                   C 32 100, 48 118, 70 118
                   C 92 118, 108 100, 110 72
                   C 112 48, 98 22, 70 22 Z"
                class="rigo-skin" stroke="#1a1a1a" stroke-width="3.5"/>

          <!-- Brillo superior (highlight kawaii) -->
          <ellipse cx="58" cy="38" rx="12" ry="6" fill="#fff" opacity="0.35"/>

          <!-- Cresta suave -->
          <path d="M 60 22 Q 65 15 70 22 Q 75 15 80 22"
                fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Mejillas rosadas kawaii -->
          <ellipse cx="42" cy="78" rx="8" ry="6" fill="url(#cheekGrad)"/>
          <ellipse cx="98" cy="78" rx="8" ry="6" fill="url(#cheekGrad)"/>

          <!-- Ojos -->
          ${leftEye}
          ${rightEye}

          <!-- Boquita -->
          ${mouth}

          <!-- Elementos extra según emoción -->
          ${extra}
        </svg>
      `;
    }

    roundEye(cx, cy) {
      return `
        <circle cx="${cx}" cy="${cy}" r="9" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cy + 1}" r="6" fill="#1a1a1a"/>
        <circle cx="${cx - 2}" cy="${cy - 2}" r="2.5" fill="#fff"/>
        <circle cx="${cx + 3}" cy="${cy + 3}" r="1" fill="#fff"/>
      `;
    }

    sparkleEye(cx, cy) {
      return `
        <circle cx="${cx}" cy="${cy}" r="10" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cy}" r="7" fill="#1a1a1a"/>
        <path d="M ${cx - 3} ${cy - 4} L ${cx - 1} ${cy - 1} L ${cx + 2} ${cy - 3} L ${cx} ${cy + 1} L ${cx + 3} ${cy + 3} L ${cx - 1} ${cy + 2} L ${cx - 4} ${cy + 4} L ${cx - 2} ${cy} Z" fill="#fff"/>
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

          #rigo-wrapper:hover:not(.dragging) {
            transform: scale(1.08) rotate(-3deg);
          }

          #rigo-wrapper:active:not(.dragging) {
            transform: scale(0.95);
          }

          /* Animación ultra lenta de cambio de color de piel (60s por color) */
          @keyframes popArtSkin {
            0%   { fill: #7ED957; }
            14%  { fill: #FFDE59; }
            28%  { fill: #FF914D; }
            42%  { fill: #FF6B9D; }
            57%  { fill: #B794F6; }
            71%  { fill: #63C5DA; }
            85%  { fill: #5AC8A8; }
            100% { fill: #7ED957; }
          }
          @keyframes popArtStroke {
            0%   { stroke: #7ED957; }
            14%  { stroke: #FFDE59; }
            28%  { stroke: #FF914D; }
            42%  { stroke: #FF6B9D; }
            57%  { stroke: #B794F6; }
            71%  { stroke: #63C5DA; }
            85%  { stroke: #5AC8A8; }
            100% { stroke: #7ED957; }
          }
          .rigo-skin {
            animation: popArtSkin 420s infinite linear;
            fill: #7ED957;
          }
          .rigo-skin-stroke {
            animation: popArtStroke 420s infinite linear;
            stroke: #7ED957;
          }

          @keyframes rigoBounce {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-6px); }
          }
          @keyframes rigoWave {
            0%, 100% { transform: rotate(-15deg); }
            50%      { transform: rotate(15deg); }
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

          /* Globo de texto kawaii */
          #speech-bubble {
            position: absolute;
            bottom: 115%;
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
            max-width: 180px;
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
            :host {
              bottom: 10px;
              right: 10px;
            }
            #rigo-wrapper {
              width: 110px;
              height: 110px;
            }
            #speech-bubble {
              font-size: 12px;
              max-width: 150px;
            }
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

      // --- Arrastre unificado (mouse + touch) ---
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

        // Mantener dentro del viewport
        const maxX = window.innerWidth - this.offsetWidth;
        const maxY = window.innerHeight - this.offsetHeight;
        const clampedX = Math.max(0, Math.min(x, maxX));
        const clampedY = Math.max(0, Math.min(y, maxY));

        this.style.left = clampedX + 'px';
        this.style.top = clampedY + 'px';
        this.style.right = 'auto';
        this.style.bottom = 'auto';

        e.preventDefault();
      };

      const onUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        wrapper.classList.remove('dragging');

        if (this.hasMoved) {
          this.savePosition();
        } else {
          this.handleTap();
        }
      };

      wrapper.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);

      wrapper.addEventListener('touchstart', onDown, { passive: false });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }

    handleTap() {
      // 0.8% easter egg Warhol
      if (Math.random() < 0.008) {
        this.setEmotion('easterEgg');
        this.say("¡Modo POP ART desbloqueado!", 3500);
        setTimeout(() => this.setEmotion('neutral'), 3500);
        return;
      }

      this.setEmotion('sneaky');
      const hint = HINT_MESSAGES[Math.floor(Math.random() * HINT_MESSAGES.length)];
      this.say(hint, 3500);
      this.dispatchEvent(new CustomEvent('rigo-hint-requested', {
        bubbles: true,
        composed: true,
        detail: { emotion: this.currentEmotion }
      }));
      setTimeout(() => this.setEmotion('neutral'), 3500);
    }

    // ======================= POSICIÓN PERSISTENTE =======================
    savePosition() {
      try {
        localStorage.setItem('rigo_pos', JSON.stringify({
          left: this.style.left,
          top: this.style.top
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

    // ======================= EMOCIONES =======================
    setEmotion(emotion) {
      if (!EMOTIONS.includes(emotion)) emotion = 'neutral';
      this.currentEmotion = emotion;
      const container = this.shadowRoot.getElementById('svg-container');
      if (container) container.innerHTML = this.getSVG(emotion);
    }

    // ======================= MENSAJES =======================
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
        const delay = 45000 + Math.random() * 60000; // 45s - 105s
        this.randomTimer = setTimeout(() => {
          const bubble = this.shadowRoot.getElementById('speech-bubble');
          if (bubble && !bubble.classList.contains('show') && !this.isDragging) {
            const msg = RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
            const prevEmotion = this.currentEmotion;
            this.setEmotion('happy');
            this.say(msg, 3500);
            setTimeout(() => this.setEmotion(prevEmotion), 3500);
          }
          schedule();
        }, delay);
      };
      schedule();
    }

    startBlinking() {
      this.blinkTimer = setInterval(() => {
        if (this.currentEmotion !== 'neutral' && this.currentEmotion !== 'happy') return;
        const svg = this.shadowRoot.querySelector('#svg-container svg');
        if (!svg) return;
        svg.style.transition = 'transform 0.1s';
        const eyes = svg.querySelectorAll('circle[r="9"], circle[r="6"]');
        eyes.forEach(e => e.style.transform = 'scaleY(0.1)');
        setTimeout(() => {
          eyes.forEach(e => e.style.transform = '');
        }, 140);
      }, 4500 + Math.random() * 3000);
    }

    // ======================= API PÚBLICA =======================
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

  // Referencia global fácil
  window.addEventListener('DOMContentLoaded', () => {
    window.rigo = document.querySelector('rigo-mascot');
  });
})();
