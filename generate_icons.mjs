import fs from 'fs';
import { execSync } from 'child_process';

const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329"/>
      <stop offset="50%" stop-color="#0e1b38"/>
      <stop offset="100%" stop-color="#080e1e"/>
    </linearGradient>

    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>

    <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.4"/>
    </linearGradient>

    <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.6"/>
    </linearGradient>

    <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="url(#ringGrad)" stroke-width="8" stroke-opacity="0.9"/>

  <circle cx="256" cy="256" r="180" fill="none" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6" opacity="0.4"/>
  <circle cx="256" cy="256" r="215" fill="none" stroke="#334155" stroke-width="1.5" opacity="0.25"/>

  <ellipse cx="256" cy="385" rx="120" ry="25" fill="#0284c7" opacity="0.35" filter="url(#glow)"/>

  <!-- Liquid in Flask -->
  <path d="M 172 315
           C 210 322, 240 310, 270 315
           C 300 320, 325 312, 340 315
           L 384 390
           C 388 397, 384 402, 372 402
           L 140 402
           C 128 402, 124 397, 128 390
           Z"
        fill="url(#liquidGrad)" />

  <path d="M 172 315
           C 210 322, 240 310, 270 315
           C 300 320, 325 312, 340 315"
        fill="none" stroke="#bae6fd" stroke-width="6" stroke-linecap="round"/>

  <!-- Flask Glass Outline -->
  <path d="M 226 130
           L 286 130
           M 234 130
           L 234 210
           L 126 390
           C 120 400, 128 408, 140 408
           L 372 408
           C 384 408, 392 400, 386 390
           L 278 210
           L 278 130"
        fill="none" stroke="#f8fafc" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>

  <rect x="220" y="122" width="72" height="14" rx="7" fill="#f8fafc"/>

  <!-- Glass Inner Reflection Left -->
  <path d="M 242 225
           L 155 375
           C 150 384, 155 390, 165 390"
        fill="none" stroke="url(#glassGrad)" stroke-width="7" stroke-linecap="round"/>

  <line x1="285" y1="260" x2="305" y2="260" stroke="#bae6fd" stroke-width="5" stroke-linecap="round"/>
  <line x1="298" y1="300" x2="324" y2="300" stroke="#bae6fd" stroke-width="5" stroke-linecap="round"/>
  <line x1="312" y1="340" x2="344" y2="340" stroke="#bae6fd" stroke-width="5" stroke-linecap="round"/>

  <!-- Bubbles -->
  <circle cx="210" cy="365" r="16" fill="url(#bubbleGrad)"/>
  <circle cx="206" cy="360" r="4" fill="#ffffff"/>
  <circle cx="300" cy="355" r="12" fill="url(#bubbleGrad)"/>
  <circle cx="297" cy="351" r="3" fill="#ffffff"/>
  <circle cx="250" cy="375" r="9" fill="url(#bubbleGrad)"/>
  
  <circle cx="248" cy="275" r="14" fill="#38bdf8" stroke="#ffffff" stroke-width="3"/>
  <circle cx="244" cy="272" r="3.5" fill="#ffffff"/>

  <circle cx="270" cy="235" r="10" fill="#06b6d4" stroke="#ffffff" stroke-width="2.5"/>
  <circle cx="268" cy="233" r="2.5" fill="#ffffff"/>

  <circle cx="236" cy="180" r="8" fill="#34d399" stroke="#ffffff" stroke-width="2"/>

  <!-- Sparkles -->
  <g transform="translate(355, 125)">
    <path d="M 0,-24 L 6,-6 L 24,0 L 6,6 L 0,24 L -6,6 L -24,0 L -6,-6 Z" fill="url(#sparkleGrad)"/>
    <circle cx="0" cy="0" r="3" fill="#ffffff"/>
  </g>
  <g transform="translate(145, 175) scale(0.65)">
    <path d="M 0,-20 L 5,-5 L 20,0 L 5,5 L 0,20 L -5,5 L -20,0 L -5,-5 Z" fill="#38bdf8"/>
    <circle cx="0" cy="0" r="2.5" fill="#ffffff"/>
  </g>
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080e1f"/>
      <stop offset="50%" stop-color="#0e1a38"/>
      <stop offset="100%" stop-color="#050a14"/>
    </linearGradient>

    <linearGradient id="mLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <linearGradient id="mBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.6"/>
    </linearGradient>

    <linearGradient id="mSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" fill="url(#mBgGrad)"/>

  <g transform="translate(256, 256) scale(0.82) translate(-256, -256)">
    <path d="M 172 315
             C 210 322, 240 310, 270 315
             C 300 320, 325 312, 340 315
             L 384 390
             C 388 397, 384 402, 372 402
             L 140 402
             C 128 402, 124 397, 128 390
             Z"
          fill="url(#mLiquidGrad)" />

    <path d="M 172 315
             C 210 322, 240 310, 270 315
             C 300 320, 325 312, 340 315"
          fill="none" stroke="#bae6fd" stroke-width="6" stroke-linecap="round"/>

    <path d="M 226 130
             L 286 130
             M 234 130
             L 234 210
             L 126 390
             C 120 400, 128 408, 140 408
             L 372 408
             C 384 408, 392 400, 386 390
             L 278 210
             L 278 130"
          fill="none" stroke="#f8fafc" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>

    <rect x="220" y="122" width="72" height="14" rx="7" fill="#f8fafc"/>

    <line x1="285" y1="260" x2="305" y2="260" stroke="#bae6fd" stroke-width="5" stroke-linecap="round"/>
    <line x1="298" y1="300" x2="324" y2="300" stroke="#bae6fd" stroke-width="5" stroke-linecap="round"/>
    <line x1="312" y1="340" x2="344" y2="340" stroke="#bae6fd" stroke-width="5" stroke-linecap="round"/>

    <circle cx="210" cy="365" r="16" fill="url(#mBubbleGrad)"/>
    <circle cx="206" cy="360" r="4" fill="#ffffff"/>
    <circle cx="300" cy="355" r="12" fill="url(#mBubbleGrad)"/>
    <circle cx="297" cy="351" r="3" fill="#ffffff"/>
    
    <circle cx="248" cy="275" r="14" fill="#38bdf8" stroke="#ffffff" stroke-width="3"/>
    <circle cx="244" cy="272" r="3.5" fill="#ffffff"/>

    <circle cx="270" cy="235" r="10" fill="#06b6d4" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="236" cy="180" r="8" fill="#34d399" stroke="#ffffff" stroke-width="2.5"/>

    <g transform="translate(355, 125)">
      <path d="M 0,-24 L 6,-6 L 24,0 L 6,6 L 0,24 L -6,6 L -24,0 L -6,-6 Z" fill="url(#mSparkleGrad)"/>
      <circle cx="0" cy="0" r="3" fill="#ffffff"/>
    </g>
    <g transform="translate(145, 175) scale(0.65)">
      <path d="M 0,-20 L 5,-5 L 20,0 L 5,5 L 0,20 L -5,5 L -20,0 L -5,-5 Z" fill="#38bdf8"/>
      <circle cx="0" cy="0" r="2.5" fill="#ffffff"/>
    </g>
  </g>
</svg>`;

fs.writeFileSync('temp_standard.svg', standardSvg);
fs.writeFileSync('temp_maskable.svg', maskableSvg);

// Generate all target PNGs using convert
console.log('Generating PNGs...');
execSync('convert -background none -density 300 temp_standard.svg -resize 512x512 public/pwa-512x512.png');
execSync('convert -background none -density 300 temp_standard.svg -resize 192x192 public/pwa-192x192.png');
execSync('convert -background none -density 300 temp_standard.svg -resize 180x180 public/apple-touch-icon.png');
execSync('convert -background none -density 300 temp_standard.svg -resize 64x64 public/favicon.png');

execSync('convert -background none -density 300 temp_maskable.svg -resize 512x512 public/pwa-maskable-512x512.png');
execSync('convert -background none -density 300 temp_maskable.svg -resize 192x192 public/pwa-maskable-192x192.png');

fs.unlinkSync('temp_standard.svg');
fs.unlinkSync('temp_maskable.svg');
fs.unlinkSync('generate_icons.mjs');
if (fs.existsSync('generate_icons.js')) fs.unlinkSync('generate_icons.js');

console.log('All icons generated successfully!');
