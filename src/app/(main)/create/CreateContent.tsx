"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HiArrowLeft, HiPlus, HiTrash, HiPhotograph, HiX, HiPlay, HiLightningBolt, HiLocationMarker, HiSearch } from "react-icons/hi";
import toast from "react-hot-toast";
import { compressImage } from "@/lib/compress-image";
import { successNotification } from "@/lib/haptics";

type PostType = "WORKOUT" | "MEAL" | "WELLNESS" | "GENERAL" | "CHECKIN";

interface GymResult {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}


interface ExerciseSet {
  reps: string;
  weight: string;
  unit: string;
  rpe: string;
}

interface Exercise {
  name: string;
  sets: ExerciseSet[];
}

const emptySet = (): ExerciseSet => ({ reps: "", weight: "", unit: "lbs", rpe: "" });
const emptyExercise = (): Exercise => ({ name: "", sets: [emptySet()] });

// ── Muscle Groups ────────────────────────────────────────────
interface MuscleGroup {
  id: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const MUSCLES: MuscleGroup[] = [
  {
    id: "chest",
    label: "Chest",
    icon: (active) => {
      const base   = active ? "#c2c2d4" : "rgba(255,255,255,0.22)";
      const mid    = active ? "#a0a0b8" : "rgba(255,255,255,0.14)";
      const shadow = active ? "rgba(40,40,60,0.38)" : "rgba(0,0,0,0.20)";
      const hilit  = active ? "#dcdce8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.50)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* torso base */}
          <path d="M6 8 Q6 5 10 5 L22 5 Q26 5 26 8 L25 24 Q22 27 16 27 Q10 27 7 24 Z" fill={mid}/>
          {/* left pec — main mass */}
          <path d="M6 9 Q5 6 10 5.5 Q14.5 5 15.5 9 L15.5 18 Q12 21.5 8 19.5 Q4.5 17 5.5 13 Z" fill={base}/>
          {/* right pec — main mass */}
          <path d="M26 9 Q27 6 22 5.5 Q17.5 5 16.5 9 L16.5 18 Q20 21.5 24 19.5 Q27.5 17 26.5 13 Z" fill={base}/>
          {/* left pec lower shadow */}
          <path d="M7 17 Q10 21 15.5 18.5 L15.5 18 Q12 21.5 8 19.5 Z" fill={shadow}/>
          {/* right pec lower shadow */}
          <path d="M25 17 Q22 21 16.5 18.5 L16.5 18 Q20 21.5 24 19.5 Z" fill={shadow}/>
          {/* clavicle arc left */}
          <path d="M8 6.5 Q12 5 15.5 6.5" stroke={shadow} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
          {/* clavicle arc right */}
          <path d="M16.5 6.5 Q20 5 24 6.5" stroke={shadow} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
          {/* sternum groove */}
          <line x1="16" y1="9" x2="16" y2="20" stroke={shadow} strokeWidth="1.0"/>
          {/* left pec highlight sweep */}
          <ellipse cx="10" cy="11" rx="3.5" ry="2" fill={hilit} transform="rotate(-20,10,11)"/>
          {/* right pec highlight sweep */}
          <ellipse cx="22" cy="11" rx="3.5" ry="2" fill={hilit} transform="rotate(20,22,11)"/>
          {/* left specular */}
          <ellipse cx="9.5" cy="9.5" rx="1.4" ry="0.8" fill={spec} transform="rotate(-25,9.5,9.5)"/>
          {/* right specular */}
          <ellipse cx="22.5" cy="9.5" rx="1.4" ry="0.8" fill={spec} transform="rotate(25,22.5,9.5)"/>
        </svg>
      );
    },
  },
  {
    id: "back",
    label: "Back",
    icon: (active) => {
      const base   = active ? "#c2c2d4" : "rgba(255,255,255,0.22)";
      const mid    = active ? "#a0a0b8" : "rgba(255,255,255,0.14)";
      const shadow = active ? "rgba(40,40,60,0.38)" : "rgba(0,0,0,0.20)";
      const hilit  = active ? "#dcdce8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.50)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* torso silhouette */}
          <path d="M16 28 L5 21 L4 12 L9 7 L16 9.5 L23 7 L28 12 L27 21 Z" fill={mid}/>
          {/* left lat wing */}
          <path d="M16 9.5 L9 7 L4 12 L4.5 19 L10 23 L16 24 Z" fill={base}/>
          {/* right lat wing */}
          <path d="M16 9.5 L23 7 L28 12 L27.5 19 L22 23 L16 24 Z" fill={base}/>
          {/* left lat lower shadow */}
          <path d="M5.5 17 L10 23 L16 24 L16 22 L11 20 L6 15 Z" fill={shadow}/>
          {/* right lat lower shadow */}
          <path d="M26.5 17 L22 23 L16 24 L16 22 L21 20 L26 15 Z" fill={shadow}/>
          {/* trap mass at top */}
          <path d="M9 7 Q16 5.5 23 7 Q20 10 16 10.5 Q12 10 9 7 Z" fill={base}/>
          {/* rhomboid shadow between scapulae */}
          <path d="M13 10 Q16 12 19 10 Q16 14 13 10 Z" fill={shadow}/>
          {/* spine */}
          <line x1="16" y1="10" x2="16" y2="26" stroke={shadow} strokeWidth="1.1"/>
          {/* lat highlight left */}
          <ellipse cx="8.5" cy="15" rx="2.5" ry="4" fill={hilit} transform="rotate(15,8.5,15)"/>
          {/* lat highlight right */}
          <ellipse cx="23.5" cy="15" rx="2.5" ry="4" fill={hilit} transform="rotate(-15,23.5,15)"/>
          {/* specular left */}
          <ellipse cx="7.5" cy="13" rx="1.2" ry="0.7" fill={spec} transform="rotate(10,7.5,13)"/>
          {/* specular right */}
          <ellipse cx="24.5" cy="13" rx="1.2" ry="0.7" fill={spec} transform="rotate(-10,24.5,13)"/>
        </svg>
      );
    },
  },
  {
    id: "legs",
    label: "Legs",
    icon: (active) => {
      const base   = active ? "#c2c2d4" : "rgba(255,255,255,0.22)";
      const mid    = active ? "#a8a8bc" : "rgba(255,255,255,0.16)";
      const shadow = active ? "rgba(40,40,60,0.38)" : "rgba(0,0,0,0.20)";
      const hilit  = active ? "#dcdce8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.50)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* left quad */}
          <path d="M5 4 Q4 4 3.5 6 L3 17 Q3 21 5.5 23 L8 25 Q10 26 11 24.5 L11.5 22 Q12.5 19 12 15 L11.5 6 Q11 4 9 4 Z" fill={base}/>
          {/* right quad */}
          <path d="M27 4 Q28 4 28.5 6 L29 17 Q29 21 26.5 23 L24 25 Q22 26 21 24.5 L20.5 22 Q19.5 19 20 15 L20.5 6 Q21 4 23 4 Z" fill={base}/>
          {/* left quad inner shadow */}
          <path d="M11 4 Q12 4 12 6 L12 15 Q12.5 19 11.5 22 L11 24.5 Q10.5 24 10 23 L10 6 Q10.5 4 11 4 Z" fill={mid}/>
          {/* right quad inner shadow */}
          <path d="M21 4 Q20 4 20 6 L20 15 Q19.5 19 20.5 22 L21 24.5 Q21.5 24 22 23 L22 6 Q21.5 4 21 4 Z" fill={mid}/>
          {/* left vastus medialis teardrop */}
          <ellipse cx="9.5" cy="21" rx="2.2" ry="1.5" fill={hilit}/>
          {/* right vastus medialis teardrop */}
          <ellipse cx="22.5" cy="21" rx="2.2" ry="1.5" fill={hilit}/>
          {/* left knee */}
          <path d="M4 21.5 Q7.5 24.5 11.5 21.5" stroke={shadow} strokeWidth="0.9" fill="none" strokeLinecap="round"/>
          {/* right knee */}
          <path d="M20.5 21.5 Q24.5 24.5 28 21.5" stroke={shadow} strokeWidth="0.9" fill="none" strokeLinecap="round"/>
          {/* left calf */}
          <path d="M5 23 L8 25 L9 29 Q8 30 7 29 L5 27 Q4 25 5 23 Z" fill={base}/>
          {/* right calf */}
          <path d="M27 23 L24 25 L23 29 Q24 30 25 29 L27 27 Q28 25 27 23 Z" fill={base}/>
          {/* left quad highlight */}
          <ellipse cx="6.5" cy="11" rx="1.5" ry="4" fill={hilit} transform="rotate(-6,6.5,11)"/>
          {/* right quad highlight */}
          <ellipse cx="25.5" cy="11" rx="1.5" ry="4" fill={hilit} transform="rotate(6,25.5,11)"/>
          {/* specular left */}
          <ellipse cx="6" cy="8.5" rx="1.0" ry="0.6" fill={spec}/>
          {/* specular right */}
          <ellipse cx="26" cy="8.5" rx="1.0" ry="0.6" fill={spec}/>
        </svg>
      );
    },
  },
  {
    id: "shoulders",
    label: "Shoulders",
    icon: (active) => {
      const base   = active ? "#c2c2d4" : "rgba(255,255,255,0.22)";
      const mid    = active ? "#a0a0b8" : "rgba(255,255,255,0.14)";
      const shadow = active ? "rgba(40,40,60,0.38)" : "rgba(0,0,0,0.20)";
      const hilit  = active ? "#dcdce8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.50)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* left delt — main sphere */}
          <circle cx="6" cy="17" r="5.5" fill={base}/>
          {/* right delt — main sphere */}
          <circle cx="26" cy="17" r="5.5" fill={base}/>
          {/* left delt shadow (lower half) */}
          <path d="M1 17 Q1 22 6 22.5 Q11 22 11 17 Z" fill={shadow}/>
          {/* right delt shadow (lower half) */}
          <path d="M31 17 Q31 22 26 22.5 Q21 22 21 17 Z" fill={shadow}/>
          {/* trap body */}
          <path d="M11 17 Q11 12 16 11 Q21 12 21 17 L21 24 Q16 26.5 11 24 Z" fill={mid}/>
          {/* trap top / upper trap */}
          <path d="M9 9 Q16 7 23 9 Q20 13 16 13.5 Q12 13 9 9 Z" fill={base}/>
          {/* neck */}
          <path d="M13 7 Q13 4 16 4 Q19 4 19 7 L19 10 Q16 11 13 10 Z" fill={mid}/>
          {/* delt–trap seam left */}
          <path d="M11 17 Q8.5 15.5 6 17" stroke={shadow} strokeWidth="0.8" fill="none"/>
          {/* delt–trap seam right */}
          <path d="M21 17 Q23.5 15.5 26 17" stroke={shadow} strokeWidth="0.8" fill="none"/>
          {/* left delt highlight */}
          <ellipse cx="4.5" cy="14.5" rx="2.2" ry="1.5" fill={hilit} transform="rotate(-25,4.5,14.5)"/>
          {/* right delt highlight */}
          <ellipse cx="27.5" cy="14.5" rx="2.2" ry="1.5" fill={hilit} transform="rotate(25,27.5,14.5)"/>
          {/* specular left */}
          <ellipse cx="4" cy="13.5" rx="1.0" ry="0.6" fill={spec} transform="rotate(-20,4,13.5)"/>
          {/* specular right */}
          <ellipse cx="28" cy="13.5" rx="1.0" ry="0.6" fill={spec} transform="rotate(20,28,13.5)"/>
        </svg>
      );
    },
  },
  {
    id: "arms",
    label: "Arms",
    icon: (active) => {
      const base   = active ? "#c2c2d4" : "rgba(255,255,255,0.22)";
      const mid    = active ? "#a0a0b8" : "rgba(255,255,255,0.14)";
      const shadow = active ? "rgba(40,40,60,0.38)" : "rgba(0,0,0,0.20)";
      const hilit  = active ? "#dcdce8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.50)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* upper arm body */}
          <path d="M9 5 Q7 7 7 11 Q7 17 11 19.5 L16 21 Q18.5 21 20 19 Q21.5 16 20 13 Q18 9 15 7 Q12 5 9 5 Z" fill={base}/>
          {/* bicep peak bulge */}
          <path d="M9 7 Q7.5 10 8 14 Q9 17.5 12.5 18.5 Q15.5 19 17.5 17 Q10 16 9.5 11 Q9 8 10 7 Z" fill={hilit}/>
          {/* tricep back shadow */}
          <path d="M18 8 Q20 11 20 14 Q20 18 17 20 L16 21 Q18.5 21 20 19 Q21.5 16 20 13 Q18.5 9.5 18 8 Z" fill={shadow}/>
          {/* forearm */}
          <path d="M11 19.5 L16 21 L18 27 Q17 29.5 15 29 L12 28 Q9.5 26.5 10 23 Z" fill={base}/>
          {/* forearm inner taper shadow */}
          <path d="M15 21 L16 21 L18 27 Q17 29.5 15.5 29 L15 28 Q14 26 14.5 23 Z" fill={mid}/>
          {/* elbow crease */}
          <path d="M8.5 18.5 Q13 22.5 18.5 18.5" stroke={shadow} strokeWidth="1.0" fill="none" strokeLinecap="round"/>
          {/* bicep main highlight */}
          <ellipse cx="12" cy="12" rx="3" ry="5" fill={hilit} transform="rotate(-12,12,12)" opacity="0.6"/>
          {/* bicep specular glint */}
          <ellipse cx="11" cy="9.5" rx="1.5" ry="0.9" fill={spec} transform="rotate(-18,11,9.5)"/>
          {/* secondary specular */}
          <ellipse cx="13" cy="7.5" rx="0.9" ry="0.5" fill={spec} transform="rotate(-10,13,7.5)"/>
        </svg>
      );
    },
  },
  {
    id: "core",
    label: "Core",
    icon: (active) => {
      const base   = active ? "#c2c2d4" : "rgba(255,255,255,0.22)";
      const shadow = active ? "rgba(40,40,60,0.45)" : "rgba(0,0,0,0.28)";
      const hilit  = active ? "#dcdce8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.50)";
      const groove = active ? "rgba(30,30,50,0.50)" : "rgba(0,0,0,0.32)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* torso outline */}
          <path d="M10 3 Q8 4 7.5 6 L7 26 Q8.5 29 16 29 Q23.5 29 25 26 L24.5 6 Q24 4 22 3 Z" fill="rgba(255,255,255,0.06)"/>
          {/* ab block row 1 left */}
          <rect x="8"  y="5"  width="6.5" height="5.5" rx="1.8" fill={base}/>
          {/* ab block row 1 right */}
          <rect x="17.5" y="5"  width="6.5" height="5.5" rx="1.8" fill={base}/>
          {/* ab block row 2 left */}
          <rect x="8"  y="12" width="6.5" height="5.5" rx="1.8" fill={base}/>
          {/* ab block row 2 right */}
          <rect x="17.5" y="12" width="6.5" height="5.5" rx="1.8" fill={base}/>
          {/* ab block row 3 left */}
          <rect x="8"  y="19" width="6.5" height="5.5" rx="1.8" fill={base}/>
          {/* ab block row 3 right */}
          <rect x="17.5" y="19" width="6.5" height="5.5" rx="1.8" fill={base}/>
          {/* inner shadow bottom of each block row 1 */}
          <rect x="8"   y="8.5" width="6.5" height="2" rx="0" fill={shadow}/>
          <rect x="17.5" y="8.5" width="6.5" height="2" rx="0" fill={shadow}/>
          {/* inner shadow row 2 */}
          <rect x="8"   y="15.5" width="6.5" height="2" rx="0" fill={shadow}/>
          <rect x="17.5" y="15.5" width="6.5" height="2" rx="0" fill={shadow}/>
          {/* inner shadow row 3 */}
          <rect x="8"   y="22.5" width="6.5" height="2" rx="0" fill={shadow}/>
          <rect x="17.5" y="22.5" width="6.5" height="2" rx="0" fill={shadow}/>
          {/* highlight top row 1 */}
          <rect x="9"   y="5.8" width="3.5" height="1.8" rx="0.9" fill={hilit}/>
          <rect x="18.5" y="5.8" width="3.5" height="1.8" rx="0.9" fill={hilit}/>
          {/* specular row 1 */}
          <ellipse cx="10.2" cy="6.2" rx="1.0" ry="0.5" fill={spec}/>
          <ellipse cx="19.7" cy="6.2" rx="1.0" ry="0.5" fill={spec}/>
          {/* linea alba center groove */}
          <line x1="16" y1="5" x2="16" y2="25" stroke={groove} strokeWidth="1.0"/>
          {/* oblique curves */}
          <path d="M8 6 Q6 16 7.5 25" stroke={groove} strokeWidth="0.7" fill="none" strokeLinecap="round"/>
          <path d="M24 6 Q26 16 24.5 25" stroke={groove} strokeWidth="0.7" fill="none" strokeLinecap="round"/>
        </svg>
      );
    },
  },
  {
    id: "glutes",
    label: "Glutes",
    icon: (active) => {
      const base   = active ? "#c2c2d4" : "rgba(255,255,255,0.22)";
      const shadow = active ? "rgba(40,40,60,0.38)" : "rgba(0,0,0,0.20)";
      const hilit  = active ? "#dcdce8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.50)";
      const crease = active ? "rgba(30,30,50,0.55)" : "rgba(0,0,0,0.28)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* hip band at top */}
          <path d="M5 9 Q16 7 27 9 L27 13 Q16 11 5 13 Z" fill={base}/>
          {/* left glute mound */}
          <path d="M3.5 13 Q3 9 8 8 Q13.5 7 15.5 12.5 L15.5 24 Q12 28.5 8 26.5 Q3 23.5 3.5 18.5 Z" fill={base}/>
          {/* right glute mound */}
          <path d="M28.5 13 Q29 9 24 8 Q18.5 7 16.5 12.5 L16.5 24 Q20 28.5 24 26.5 Q29 23.5 28.5 18.5 Z" fill={base}/>
          {/* left glute lower shadow */}
          <path d="M4 20 Q5 25 9 26.5 Q13 27.5 15.5 24 L15.5 22 Q12 26 8.5 24 Q5 22 4.5 19 Z" fill={shadow}/>
          {/* right glute lower shadow */}
          <path d="M28 20 Q27 25 23 26.5 Q19 27.5 16.5 24 L16.5 22 Q20 26 23.5 24 Q27 22 27.5 19 Z" fill={shadow}/>
          {/* gluteal crease */}
          <path d="M16 12 Q15.5 18 16 25" stroke={crease} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          {/* under-curve shadow left */}
          <path d="M5 23 Q9 28.5 15.5 25" stroke={shadow} strokeWidth="1.0" fill="none" strokeLinecap="round"/>
          {/* under-curve shadow right */}
          <path d="M27 23 Q23 28.5 16.5 25" stroke={shadow} strokeWidth="1.0" fill="none" strokeLinecap="round"/>
          {/* left highlight arc */}
          <ellipse cx="8.5" cy="15" rx="3.5" ry="4" fill={hilit}/>
          {/* right highlight arc */}
          <ellipse cx="23.5" cy="15" rx="3.5" ry="4" fill={hilit}/>
          {/* specular left */}
          <ellipse cx="7.5" cy="12.5" rx="1.5" ry="1.0" fill={spec}/>
          {/* specular right */}
          <ellipse cx="24.5" cy="12.5" rx="1.5" ry="1.0" fill={spec}/>
        </svg>
      );
    },
  },
  {
    id: "cardio",
    label: "Cardio",
    icon: (active) => {
      const base   = active ? "#c8a0a0" : "rgba(255,255,255,0.22)";
      const shadow = active ? "rgba(80,20,20,0.38)" : "rgba(0,0,0,0.20)";
      const hilit  = active ? "#e8c8c8" : "rgba(255,255,255,0.38)";
      const spec   = active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.50)";
      const flame1 = active ? "#f59e8a" : "rgba(255,255,255,0.22)";
      const flame2 = active ? "#fcd97a" : "rgba(255,255,255,0.12)";
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7">
          {/* heart base shape */}
          <path d="M16 27.5 Q5 19.5 5 12.5 Q5 6 11 5 Q14 5 16 8.5 Q18 5 21 5 Q27 6 27 12.5 Q27 19.5 16 27.5 Z" fill={base}/>
          {/* right lobe shadow */}
          <path d="M20 6 Q27 7 27 13 Q27 20 16 27.5 Q22 22 23.5 16 Q25 10 20 6 Z" fill={shadow}/>
          {/* left lobe lower crease shadow */}
          <path d="M5 16 Q6 21 10 24 Q13 26 16 27.5 Q10 23 8 18 Q6 14 5 12.5 Z" fill={shadow}/>
          {/* left lobe highlight */}
          <ellipse cx="11" cy="11" rx="4" ry="3" fill={hilit} transform="rotate(-20,11,11)"/>
          {/* specular left lobe */}
          <ellipse cx="10" cy="9" rx="2" ry="1.2" fill={spec} transform="rotate(-25,10,9)"/>
          {/* secondary specular */}
          <ellipse cx="13" cy="7.5" rx="1" ry="0.6" fill={spec} transform="rotate(-10,13,7.5)"/>
          {/* flame outer */}
          <path d="M16 23.5 Q12.5 19 13.5 15.5 Q14.5 13 16 14.5 Q17.5 13 18.5 15.5 Q19.5 19 16 23.5 Z" fill={flame1}/>
          {/* flame inner core */}
          <path d="M16 21 Q14.5 18.5 15.2 16.5 Q15.8 15.2 16 16 Q16.2 15.2 16.8 16.5 Q17.5 18.5 16 21 Z" fill={flame2}/>
        </svg>
      );
    },
  },
];

const MUSCLE_NAMES: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  glutes: "Glutes",
  cardio: "Cardio",
};

// ── Energy Slider ────────────────────────────────────────────
const ENERGY_STEPS = [
  { value: 1, emoji: "💀" },
  { value: 3, emoji: "😮" },
  { value: 5, emoji: "😐" },
  { value: 7, emoji: "😤" },
  { value: 9, emoji: "🔥" },
  { value: 10, emoji: "🔥" },
];

function sliderTrackColor(value: number): string {
  const pct = ((value - 1) / 9) * 100;
  // purple(1) → amber(5) → red(10)
  if (value <= 5) {
    return `linear-gradient(to right, #7875ff 0%, #f59e0b ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
  }
  return `linear-gradient(to right, #7875ff 0%, #f59e0b 44%, #ef4444 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
}

function EnergySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const currentEmoji = ENERGY_STEPS.reduce((acc, s) => (value >= s.value ? s.emoji : acc), "💀");
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
          Energy Level
        </label>
        <span className="text-xl">{currentEmoji}</span>
      </div>
      <div className="relative pt-1 pb-1">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="energy-slider w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{ background: sliderTrackColor(value) }}
        />
        <div className="flex justify-between mt-2 px-0.5">
          {ENERGY_STEPS.slice(0, 5).map((s) => (
            <span key={s.value} className="text-sm">{s.emoji}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mood Slider (for Wellness) ────────────────────────────────
const moodLabels: Record<number, string> = {
  1: "Awful", 2: "Bad", 3: "Meh", 4: "Low", 5: "Okay",
  6: "Decent", 7: "Good", 8: "Great", 9: "Amazing", 10: "On Top",
};

function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = ((value - 1) / 9) * 100;
  const hue = (value - 1) * (120 / 9);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>Mood After</label>
        <span
          className="text-sm font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `hsl(${hue}, 70%, 20%)`, color: `hsl(${hue}, 80%, 65%)` }}
        >
          {value} — {moodLabels[value]}
        </span>
      </div>
      <div className="relative pt-1 pb-2">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="energy-slider w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(${hue},80%,45%) 0%, hsl(${hue},80%,45%) ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 px-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="text-[10px] w-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Media Upload Block (shared across types) ─────────────────
function MediaBlock({
  mediaPreview, uploading, onRemove, onFileClick, fileInputRef, onFileChange,
}: {
  mediaPreview: string | null;
  uploading: boolean;
  onRemove: () => void;
  onFileClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Photo / Video</label>
      {mediaPreview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <button onClick={onRemove} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
            <HiX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onFileClick}
          className="w-full rounded-xl py-8 flex flex-col items-center gap-2 transition-colors"
          style={{
            border: "2px dashed rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <HiPhotograph className="w-8 h-8" />
          <span className="text-sm">Add photo or video</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heic,image/heif,video/mp4,video/quicktime"
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        onChange={onFileChange}
      />
    </div>
  );
}

export default function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFromSession = searchParams.get("fromSession") === "1";

  const initialType = ((): PostType => {
    const param = searchParams.get("type")?.toUpperCase();
    if (param && ["WORKOUT", "MEAL", "WELLNESS", "GENERAL", "CHECKIN"].includes(param)) {
      return param as PostType;
    }
    return "WORKOUT";
  })();

  const [type, setType] = useState<PostType>(initialType);
  const [showWorkoutAdvanced, setShowWorkoutAdvanced] = useState(!isFromSession);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");
  const [postDate, setPostDate] = useState("");
  const [showBackdate, setShowBackdate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successPost, setSuccessPost] = useState<{ id: string; type: PostType } | null>(null);

  // Media upload
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Workout fields
  const [workoutName, setWorkoutName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [isClass, setIsClass] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [perceivedExertion, setPerceivedExertion] = useState("");
  const [energy, setEnergy] = useState(7);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [postTiming, setPostTiming] = useState<"BEFORE" | "DURING" | "AFTER">("AFTER");

  const handleBack = useCallback(() => {
    if (isFromSession) {
      router.replace("/feed");
      return;
    }
    router.back();
  }, [isFromSession, router]);

  // ── Active session banner state ───────────────────────────────────────────
  const [sessionElapsed, setSessionElapsed] = useState<number | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: pre-fill from workout session OR show live timer in banner
  useEffect(() => {
    const fromSession = searchParams.get("fromSession");
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("activeWorkout");
    } catch {
      return;
    }
    if (!raw) return;

    let session: Record<string, unknown>;
    try {
      session = JSON.parse(raw);
    } catch {
      return;
    }

    if (fromSession === "1") {
      // ── Pre-fill the create form from session data ──
      const elapsed =
        typeof session._finalElapsedMs === "number"
          ? (session._finalElapsedMs as number)
          : Math.max(
              0,
              Date.now() -
                (session.startTime as number) -
                (session.totalPausedMs as number)
            );

      if (session.workoutName) {
        setWorkoutName(session.workoutName as string);
        setEditingName(true);
      }
      if (session.notes) setCaption(session.notes as string);

      const mins = Math.max(1, Math.round(elapsed / 60000));
      setDurationMinutes(String(mins));

      const checkedExercises = (
        session.exercises as Array<{ name: string; checked: boolean }>
      ).filter((ex) => ex.checked && ex.name.trim());

      if (checkedExercises.length > 0) {
        setExercises(
          checkedExercises.map((ex) => ({
            name: ex.name.trim(),
            sets: [emptySet()],
          }))
        );
      }

      try {
        localStorage.removeItem("activeWorkout");
      } catch {
        // ignore
      }

      toast.success("Workout session loaded!", {
        icon: "✓",
        style: {
          background: "#1a1b2e",
          color: "#ffffff",
          border: "1px solid rgba(120,117,255,0.4)",
        },
      });
      return;
    }

    // ── Show live elapsed in the "Resume" banner ──
    const startTime = session.startTime as number;
    const totalPausedMs = session.totalPausedMs as number;
    const pausedAt = session.pausedAt as number | null;

    const computeElapsed = () =>
      Math.max(0, (pausedAt ?? Date.now()) - startTime - totalPausedMs);

    setSessionElapsed(computeElapsed());

    if (!pausedAt) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionElapsed(computeElapsed());
      }, 1000);
    }

    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Meal fields
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("snack");
  const [ingredients, setIngredients] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  // Wellness fields
  const [activityType, setActivityType] = useState("");
  const [wellnessDuration, setWellnessDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [wellnessMood, setWellnessMood] = useState(7);

  // ── Check-in fields ───────────────────────────────────────
  const [checkInGymId, setCheckInGymId] = useState<string | null>(null);
  const [checkInGymName, setCheckInGymName] = useState("");
  const [gymSearchQuery, setGymSearchQuery] = useState("");
  const [gymSearchResults, setGymSearchResults] = useState<GymResult[]>([]);
  const [gymSearchLoading, setGymSearchLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showAddGym, setShowAddGym] = useState(false);
  const [newGymName, setNewGymName] = useState("");
  const [newGymAddress, setNewGymAddress] = useState("");
  const [newGymLat, setNewGymLat] = useState<number | null>(null);
  const [newGymLng, setNewGymLng] = useState<number | null>(null);
  const [addingGym, setAddingGym] = useState(false);

  const searchGyms = useCallback(async (query: string, lat?: number, lng?: number) => {
    setGymSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (lat != null && lng != null) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }
      const res = await fetch(`/api/gyms?${params.toString()}`);
      if (res.ok) {
        const data: GymResult[] = await res.json();
        setGymSearchResults(data);
      }
    } catch {
      // silent
    } finally {
      setGymSearchLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewGymLat(latitude);
        setNewGymLng(longitude);
        setLocationLoading(false);
        searchGyms("", latitude, longitude);
        toast.success("Location found — showing nearby gyms");
      },
      () => {
        setLocationLoading(false);
        toast.error("Could not get your location");
      },
      { timeout: 10000 }
    );
  }, [searchGyms]);

  const handleAddGym = useCallback(async () => {
    if (!newGymName.trim()) return;
    setAddingGym(true);
    try {
      const res = await fetch("/api/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGymName.trim(),
          address: newGymAddress.trim() || undefined,
          latitude: newGymLat ?? undefined,
          longitude: newGymLng ?? undefined,
        }),
      });
      if (res.ok) {
        const gym: GymResult = await res.json();
        setCheckInGymId(gym.id);
        setCheckInGymName(gym.name);
        setShowAddGym(false);
        setNewGymName("");
        setNewGymAddress("");
        toast.success(`"${gym.name}" added!`);
      } else {
        toast.error("Failed to add gym");
      }
    } catch {
      toast.error("Failed to add gym");
    } finally {
      setAddingGym(false);
    }
  }, [newGymName, newGymAddress, newGymLat, newGymLng]);

  // ── Muscle toggle with auto-name ──────────────────────────
  const toggleMuscle = (id: string) => {
    setSelectedMuscles((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      if (!editingName) {
        if (next.length === 0) {
          setWorkoutName("");
        } else if (next.length === 1) {
          setWorkoutName(`${MUSCLE_NAMES[next[0]]} Day`);
        } else {
          const [first, ...rest] = next;
          setWorkoutName(`${MUSCLE_NAMES[first]} + ${rest.length} more`);
        }
      }
      return next;
    });
  };

  // ── Media upload ──────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    try {
      const fileToUpload = await compressImage(file);
      const formData = new FormData();
      formData.append("file", fileToUpload);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        setMediaPreview(null);
        return;
      }
      const { url } = await res.json();
      setMediaUrl(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setError(errorMessage);
      setMediaPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Exercise helpers ──────────────────────────────────────
  const addExercise = () => setExercises((prev) => [...prev, emptyExercise()]);
  const removeExercise = (idx: number) => setExercises((prev) => prev.filter((_, i) => i !== idx));
  const updateExerciseName = (idx: number, name: string) =>
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, name } : ex)));
  const addSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex))
    );
  const removeSet = (exIdx: number, setIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) } : ex
      )
    );
  const updateSet = (exIdx: number, setIdx: number, field: keyof ExerciseSet, value: string) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s)) }
          : ex
      )
    );

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        caption: caption || undefined,
        visibility,
        mediaUrl: mediaUrl || undefined,
        postDate: postDate || undefined,
      };

      if (type === "WORKOUT") {
        if (!workoutName.trim()) {
          setError("Workout name is required");
          setSubmitting(false);
          return;
        }
        body.workout = {
          workoutName: workoutName.trim(),
          isClass,
          muscleGroups: selectedMuscles,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          perceivedExertion: perceivedExertion ? parseInt(perceivedExertion) : undefined,
          moodAfter: energy,
          postTiming,
          exercises: exercises
            .filter((ex) => ex.name.trim())
            .map((ex) => ({
              name: ex.name.trim(),
              sets: ex.sets
                .filter((s) => s.reps || s.weight)
                .map((s) => ({
                  reps: s.reps ? parseInt(s.reps) : undefined,
                  weight: s.weight ? parseFloat(s.weight) : undefined,
                  unit: s.unit,
                  rpe: s.rpe ? parseInt(s.rpe) : undefined,
                })),
            })),
        };
      }

      if (type === "MEAL") {
        if (!mealName.trim()) {
          setError("Meal name is required");
          setSubmitting(false);
          return;
        }
        body.meal = {
          mealName: mealName.trim(),
          mealType,
          ingredients: ingredients.split(",").map((i) => i.trim()).filter(Boolean),
          calories: calories ? parseInt(calories) : undefined,
          protein: protein ? parseFloat(protein) : undefined,
          carbs: carbs ? parseFloat(carbs) : undefined,
          fat: fat ? parseFloat(fat) : undefined,
          saveToCatalog,
        };
      }

      if (type === "WELLNESS") {
        if (!activityType.trim()) {
          setError("Activity type is required");
          setSubmitting(false);
          return;
        }
        body.wellness = {
          activityType: activityType.trim(),
          durationMinutes: wellnessDuration ? parseInt(wellnessDuration) : undefined,
          intensity: intensity ? parseInt(intensity) : undefined,
          moodAfter: wellnessMood,
        };
      }

      if (type === "CHECKIN") {
        if (!checkInGymId) {
          setError("Please select a gym for your check-in");
          setSubmitting(false);
          return;
        }
        body.gymId = checkInGymId;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create post");
        return;
      }

      const created = await res.json();
      successNotification();
      setSuccessPost({ id: created.id, type: created.type as PostType });
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const mediaProps = {
    mediaPreview,
    uploading,
    onRemove: removeMedia,
    onFileClick: () => fileInputRef.current?.click(),
    fileInputRef,
    onFileChange: handleFileChange,
  };

  const TYPE_LABELS: Record<PostType, string> = {
    WORKOUT: "Workout",
    MEAL: "Meal",
    WELLNESS: "Wellness",
    GENERAL: "General",
    CHECKIN: "Check-in",
  };

  const TYPE_EMOJI: Record<PostType, string> = {
    WORKOUT: "💪",
    MEAL: "🥗",
    WELLNESS: "🧘",
    GENERAL: "📝",
    CHECKIN: "📍",
  };

  const sourceMode: "LIVE_COMPLETED" | "LIVE_ACTIVE" | "MANUAL" = isFromSession
    ? "LIVE_COMPLETED"
    : sessionElapsed !== null
    ? "LIVE_ACTIVE"
    : "MANUAL";

  const sourceModeLabel: Record<typeof sourceMode, string> = {
    LIVE_COMPLETED: "Live workout complete",
    LIVE_ACTIVE: "Live workout in progress",
    MANUAL: "Manual post",
  };

  // ── Success overlay ────────────────────────────────────────
  if (successPost) {
    const shareUrl = `https://royalwellness.app/p/${successPost.id}`;
    const copyLink = () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success("Link copied!");
      });
    };
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <style>{`
          @keyframes rf-pop { 0%{transform:scale(0.5);opacity:0} 65%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
          @keyframes rf-fade-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
          .rf-pop { animation: rf-pop 0.45s cubic-bezier(.34,1.56,.64,1) forwards; }
          .rf-fade-up-1 { animation: rf-fade-up 0.4s ease 0.35s forwards; opacity:0; }
          .rf-fade-up-2 { animation: rf-fade-up 0.4s ease 0.5s forwards; opacity:0; }
          .rf-fade-up-3 { animation: rf-fade-up 0.4s ease 0.65s forwards; opacity:0; }
        `}</style>

        {/* Animated badge */}
        <div className="rf-pop mb-6">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-2xl"
            style={{ background: "linear-gradient(135deg, #7875ff 0%, #a78bfa 100%)" }}
          >
            {TYPE_EMOJI[successPost.type]}
          </div>
        </div>

        <h1
          className="rf-fade-up-1 text-3xl font-bold mb-1"
          style={{ color: "#ffffff" }}
        >
          Posted! 🎉
        </h1>
        <p
          className="rf-fade-up-2 text-base mb-10"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Your {TYPE_LABELS[successPost.type].toLowerCase()} is live
        </p>

        <div className="rf-fade-up-3 flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={copyLink}
            className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7875ff 0%, #a78bfa 100%)", color: "#fff" }}
          >
            🔗 Share Post
          </button>
          <button
            onClick={() => router.push("/feed")}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
          >
            View Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8" style={{ color: "#ffffff" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">New Post</h1>
      </div>

      {sourceMode !== "MANUAL" && (
        <div className="mb-4">
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(120,117,255,0.12)",
              color: "#c4bfff",
              border: "1px solid rgba(168,166,255,0.35)",
            }}
          >
            {sourceModeLabel[sourceMode]}
          </span>
        </div>
      )}

      {isFromSession && type === "WORKOUT" && (
        <div
          className="mb-4 p-4 rounded-2xl"
          style={{ background: "rgba(120,117,255,0.08)", border: "1px solid rgba(168,166,255,0.25)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#d4d3ff" }}>Review workout before posting</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            {workoutName || "Workout"} • {durationMinutes || "--"} min • {exercises.length} exercises logged
          </p>
          <button
            type="button"
            onClick={() => setShowWorkoutAdvanced((prev) => !prev)}
            className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
          >
            {showWorkoutAdvanced ? "Hide details" : "Edit details"}
          </button>
        </div>
      )}

      {/* Quick Check-in button */}
      {!isFromSession && (
      <button
        onClick={() => {
          setType("CHECKIN");
          if (gymSearchResults.length === 0) searchGyms("");
        }}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-3 transition-all active:scale-[0.98]"
        style={
          type === "CHECKIN"
            ? {
                background: "rgba(56,189,248,0.10)",
                border: "1px solid rgba(103,232,249,0.4)",
              }
            : {
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }
        }
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                type === "CHECKIN"
                  ? "rgba(56,189,248,0.15)"
                  : "rgba(255,255,255,0.06)",
            }}
          >
            <HiLocationMarker
              className="w-5 h-5"
              style={{ color: type === "CHECKIN" ? "#67e8f9" : "rgba(255,255,255,0.4)" }}
            />
          </div>
          <div className="text-left">
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: type === "CHECKIN" ? "#67e8f9" : "rgba(255,255,255,0.8)" }}
            >
              Quick Check-in
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Tap to post you went to the gym
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
          style={
            type === "CHECKIN"
              ? { background: "rgba(56,189,248,0.15)", color: "#67e8f9" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
          }
        >
          {type === "CHECKIN" ? "Selected ✓" : "Tap →"}
        </span>
      </button>
      )}

      {/* Post type selector (detailed posts) */}
      <div
        className="flex gap-2 mb-5 p-1 rounded-xl transition-opacity"
        style={{
          background: "rgba(255,255,255,0.04)",
          opacity: type === "CHECKIN" ? 0.45 : 1,
        }}
      >
        {(["WORKOUT", "MEAL", "WELLNESS", "GENERAL"] as PostType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={
              type === t
                ? { background: "linear-gradient(135deg, #6360e8, #9b98ff)", color: "#ffffff" }
                : { background: "transparent", color: "rgba(255,255,255,0.4)" }
            }
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* ─── CHECKIN ─────────────────────────────────────── */}
        {type === "CHECKIN" && (
          <>
            {/* Selected gym display */}
            {checkInGymId ? (
              <div
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(103,232,249,0.3)" }}
              >
                <div className="flex items-center gap-3">
                  <HiLocationMarker className="w-5 h-5 flex-shrink-0" style={{ color: "#67e8f9" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#67e8f9" }}>{checkInGymName}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Gym selected</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setCheckInGymId(null); setCheckInGymName(""); }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Location + Search row */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={locationLoading}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex-shrink-0"
                    style={{ background: "rgba(56,189,248,0.10)", border: "1px solid rgba(103,232,249,0.25)", color: "#67e8f9" }}
                  >
                    <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
                    {locationLoading ? "Locating..." : "Near me"}
                  </button>
                  <div className="relative flex-1">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type="text"
                      value={gymSearchQuery}
                      onChange={(e) => {
                        setGymSearchQuery(e.target.value);
                        searchGyms(e.target.value);
                      }}
                      placeholder="Search gyms..."
                      className="input-dark w-full pl-9"
                    />
                  </div>
                </div>

                {/* Gym results */}
                {gymSearchLoading ? (
                  <p className="text-xs text-center py-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Searching...
                  </p>
                ) : gymSearchResults.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {gymSearchResults.map((gym) => (
                      <button
                        key={gym.id}
                        type="button"
                        onClick={() => { setCheckInGymId(gym.id); setCheckInGymName(gym.name); }}
                        className="w-full text-left px-3.5 py-3 rounded-xl transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)" }}
                      >
                        <p className="text-sm font-medium leading-tight">{gym.name}</p>
                        {gym.address && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{gym.address}</p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : gymSearchQuery.trim() ? (
                  <p className="text-xs text-center py-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                    No gyms found for &ldquo;{gymSearchQuery}&rdquo;
                  </p>
                ) : null}

                {/* Add new gym toggle */}
                <button
                  type="button"
                  onClick={() => setShowAddGym((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  <HiPlus className="w-3.5 h-3.5" />
                  {showAddGym ? "Cancel" : "Add a new gym"}
                </button>

                {/* Add gym form */}
                {showAddGym && (
                  <div
                    className="space-y-2.5 p-3.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <input
                      type="text"
                      value={newGymName}
                      onChange={(e) => setNewGymName(e.target.value)}
                      placeholder="Gym name (e.g. Tribeca Equinox)"
                      className="input-dark w-full"
                    />
                    <input
                      type="text"
                      value={newGymAddress}
                      onChange={(e) => setNewGymAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className="input-dark w-full"
                    />
                    {newGymLat == null ? (
                      <button
                        type="button"
                        onClick={requestLocation}
                        disabled={locationLoading}
                        className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-60"
                        style={{ color: "#67e8f9" }}
                      >
                        <HiLocationMarker className="w-3.5 h-3.5" />
                        {locationLoading ? "Getting location..." : "Tag location (optional)"}
                      </button>
                    ) : (
                      <p className="text-xs flex items-center gap-1" style={{ color: "#67e8f9" }}>
                        <HiLocationMarker className="w-3.5 h-3.5" />
                        Location tagged
                        <button
                          type="button"
                          onClick={() => { setNewGymLat(null); setNewGymLng(null); }}
                          className="ml-1"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          <HiX className="w-3 h-3" />
                        </button>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleAddGym}
                      disabled={addingGym || !newGymName.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all btn-gradient disabled:opacity-50"
                      style={{ color: "#fff" }}
                    >
                      {addingGym ? "Adding..." : "Add Gym"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Optional caption */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                Note <span style={{ color: "rgba(255,255,255,0.35)" }}>(optional)</span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder={checkInGymName ? `e.g. Great session at ${checkInGymName}!` : "Add a note..."}
                className="textarea-dark w-full resize-none"
              />
            </div>
          </>
        )}

        {/* ─── WORKOUT ─────────────────────────────────────── */}
        {type === "WORKOUT" && (
          <>
            {/* ── Start / Resume Workout Banner ── */}
            {!isFromSession && (
              <button
                type="button"
                onClick={() => (window.location.href = "/workout")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98] mb-1"
                style={{
                  background:
                    sessionElapsed !== null
                      ? "rgba(34,197,94,0.07)"
                      : "rgba(120,117,255,0.08)",
                  border:
                    sessionElapsed !== null
                      ? "1px solid rgba(34,197,94,0.25)"
                      : "1px solid rgba(120,117,255,0.25)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        sessionElapsed !== null
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(120,117,255,0.10)",
                    }}
                  >
                    {sessionElapsed !== null ? (
                      <HiPlay className="w-5 h-5" style={{ color: "#4ade80" }} />
                    ) : (
                      <HiLightningBolt className="w-5 h-5" style={{ color: "#a8a6ff" }} />
                    )}
                  </div>
                  <div className="text-left">
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{
                        color: sessionElapsed !== null ? "#4ade80" : "#a8a6ff",
                      }}
                    >
                      {sessionElapsed !== null ? "Workout In Progress" : "Start a Live Workout"}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {sessionElapsed !== null
                        ? (() => {
                            const totalSecs = Math.floor(sessionElapsed / 1000);
                            const h = Math.floor(totalSecs / 3600);
                            const m = Math.floor((totalSecs % 3600) / 60);
                            const s = totalSecs % 60;
                            return h > 0
                              ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} — tap to resume`
                              : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} — tap to resume`;
                          })()
                        : "Timer + checklist — log it when you're done"}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{
                    background:
                      sessionElapsed !== null
                        ? "rgba(34,197,94,0.15)"
                        : "linear-gradient(135deg, #6360e8, #9b98ff)",
                    color: sessionElapsed !== null ? "#4ade80" : "#ffffff",
                  }}
                >
                  {sessionElapsed !== null ? "Resume →" : "Start →"}
                </div>
              </button>
            )}

            {(showWorkoutAdvanced || !isFromSession) && (
              <>
            {/* 1. Muscle group selector */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
                Target Muscles
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MUSCLES.map((m) => {
                  const active = selectedMuscles.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMuscle(m.id)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all text-xs font-medium"
                      style={
                        active
                          ? {
                              background: "rgba(120,117,255,0.10)",
                              border: "1px solid rgba(168,166,255,0.5)",
                              color: "#a8a6ff",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              color: "rgba(255,255,255,0.4)",
                            }
                      }
                    >
                      {m.icon(active)}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Workout Name */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                Workout Name *
              </label>
              <input
                value={workoutName}
                onChange={(e) => {
                  setWorkoutName(e.target.value);
                  setEditingName(true);
                }}
                onBlur={() => { if (!workoutName.trim()) setEditingName(false); }}
                placeholder="e.g. Upper Body, Leg Day"
                className="input-dark w-full"
              />
            </div>

            {/* 3. Media */}
            <MediaBlock {...mediaProps} />

            {/* 4. Energy slider */}
            <EnergySlider value={energy} onChange={setEnergy} />

            {/* 5. Caption */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="How did the workout go?"
                className="textarea-dark w-full resize-none"
              />
            </div>

            {/* Group class toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isClass}
                onChange={(e) => setIsClass(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span style={{ color: "rgba(255,255,255,0.8)" }}>Group class</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Duration (min)</label>
                <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="60" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Exertion (1-10)</label>
                <input type="number" min="1" max="10" value={perceivedExertion} onChange={(e) => setPerceivedExertion(e.target.value)} placeholder="7" className="input-dark w-full" />
              </div>
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>Exercises</label>
                <button type="button" onClick={addExercise} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#a8a6ff" }}>
                  <HiPlus className="w-4 h-4" />
                  Add exercise
                </button>
              </div>

              {exercises.length === 0 && (
                <p className="text-xs text-center py-3 rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
                  No exercises added yet
                </p>
              )}

              <div className="space-y-3">
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={ex.name}
                        onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                        placeholder="Exercise name (e.g. Bench Press)"
                        className="input-dark flex-1"
                      />
                      <button type="button" onClick={() => removeExercise(exIdx)} className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex gap-1.5 items-center">
                          <span className="text-xs w-8 flex-shrink-0 text-center font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                            S{setIdx + 1}
                          </span>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                            placeholder="Reps"
                            className="input-dark w-16 text-xs px-2 py-1"
                          />
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                            placeholder="Wt"
                            className="input-dark w-20 text-xs px-2 py-1"
                          />
                          <select
                            value={set.unit}
                            onChange={(e) => updateSet(exIdx, setIdx, "unit", e.target.value)}
                            className="select-dark w-14 text-xs px-1 py-1"
                          >
                            <option value="lbs">lbs</option>
                            <option value="kg">kg</option>
                          </select>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={set.rpe}
                            onChange={(e) => updateSet(exIdx, setIdx, "rpe", e.target.value)}
                            placeholder="RPE"
                            className="input-dark w-14 text-xs px-2 py-1"
                          />
                          {ex.sets.length > 1 && (
                            <button type="button" onClick={() => removeSet(exIdx, setIdx)} style={{ color: "rgba(255,255,255,0.25)" }}>
                              <HiX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={() => addSet(exIdx)} className="mt-2 flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <HiPlus className="w-3.5 h-3.5" />
                      Add set
                    </button>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}

            {isFromSession && !showWorkoutAdvanced && (
              <div className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", border: "1px dashed rgba(255,255,255,0.12)" }}>
                Posting now uses your live session summary. Tap &ldquo;Edit details&rdquo; above to add muscles, media, and exercise sets.
              </div>
            )}
          </>
        )}

        {/* ─── MEAL ────────────────────────────────────────── */}
        {type === "MEAL" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Meal Name *</label>
              <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Protein Smoothie, Chicken Rice Bowl" className="input-dark w-full" />
            </div>

            <MediaBlock {...mediaProps} />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Tell us about this meal..." className="textarea-dark w-full resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Meal Type</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="select-dark w-full">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Ingredients (comma-separated)</label>
              <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="chicken, rice, broccoli" className="input-dark w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Calories</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="500" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Protein (g)</label>
                <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="30" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Carbs (g)</label>
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="50" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Fat (g)</label>
                <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="15" className="input-dark w-full" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={saveToCatalog} onChange={(e) => setSaveToCatalog(e.target.checked)} className="accent-primary w-4 h-4" />
              <span style={{ color: "rgba(255,255,255,0.8)" }}>Save to my meal catalog</span>
            </label>
          </>
        )}

        {/* ─── WELLNESS ────────────────────────────────────── */}
        {type === "WELLNESS" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Activity Type *</label>
              <input value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="e.g. Yoga, Meditation, Sauna" className="input-dark w-full" />
            </div>

            <MediaBlock {...mediaProps} />

            <MoodSlider value={wellnessMood} onChange={setWellnessMood} />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="How did it go?" className="textarea-dark w-full resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Duration (min)</label>
                <input type="number" value={wellnessDuration} onChange={(e) => setWellnessDuration(e.target.value)} placeholder="30" className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Intensity (1-10)</label>
                <input type="number" min="1" max="10" value={intensity} onChange={(e) => setIntensity(e.target.value)} placeholder="5" className="input-dark w-full" />
              </div>
            </div>

          </>
        )}

        {/* ─── GENERAL ─────────────────────────────────────── */}
        {type === "GENERAL" && (
          <>
            <MediaBlock {...mediaProps} />
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="What's on your mind?" className="textarea-dark w-full resize-none" />
            </div>
          </>
        )}

        {/* Visibility */}
        {(!isFromSession || type !== "WORKOUT" || showWorkoutAdvanced) && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Visibility</label>
          <div className="flex gap-2">
            {(["PUBLIC", "FOLLOWERS", "PRIVATE"] as const).map((v) => {
              const labels = { PUBLIC: "🌍 Public", FOLLOWERS: "👥 Followers", PRIVATE: "🔒 Private" };
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={
                    visibility === v
                      ? { background: "rgba(120,117,255,0.10)", border: "1px solid rgba(168,166,255,0.5)", color: "#a8a6ff" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {labels[v]}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Backdate */}
        {(!isFromSession || type !== "WORKOUT" || showWorkoutAdvanced) && (
        <div>
          <button
            type="button"
            onClick={() => { setShowBackdate((v) => !v); if (showBackdate) setPostDate(""); }}
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {showBackdate ? "▲ Hide backdate" : "▼ Backdate this post"}
          </button>
          {showBackdate && (
            <div className="mt-2">
              <input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="input-dark w-full"
              />
              {postDate && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Will appear as posted on {new Date(postDate + "T12:00:00").toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading || (type === "CHECKIN" && !checkInGymId)}
          className="w-full py-3 rounded-xl font-semibold transition-all btn-gradient shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: "#ffffff" }}
        >
          {uploading
            ? "Uploading media..."
            : submitting
            ? "Posting..."
            : type === "CHECKIN"
            ? checkInGymId
              ? `Post: I was at ${checkInGymName}`
              : "Select a gym to check in"
            : "Post"}
        </button>
      </div>
    </div>
  );
}
