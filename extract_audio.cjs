const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const startStr = '  // Sound generator helper using Web Audio API';
const endStr = '  // Core data states loaded from Express server';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

const audioCode = code.substring(startIndex, endIndex);

const utilsCode = `
export const playAlertSound = (type: "success" | "notification" | "click", soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "notification") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {}
};
`;

fs.writeFileSync('src/utils/audio.ts', utilsCode, 'utf-8');

const replacement = `  const playAlertSound = (type: "success" | "notification" | "click") => {\n    playAlertSoundUtil(type, notificationPrefs.soundEnabled);\n  };\n\n`;
code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

code = `import { playAlertSound as playAlertSoundUtil } from "./utils/audio";\n` + code;

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Extracted audio");
