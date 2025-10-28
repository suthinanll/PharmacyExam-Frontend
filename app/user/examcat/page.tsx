"use client";
import Footer from "@/components/Footer";
import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// ==================== TYPE DEFINITIONS ====================
enum ContentArea {
  PHARMACOLOGY = "เภสัชวิทยา",
  CLINICAL_PHARMACY = "เภสัชกรรมคลินิก",
  PHARMACEUTICAL_CARE = "เภสัชกรรมบริบาล",
  PHARMACY_PRACTICE = "การปฏิบัติการเภสัชกรรม",
  PHARMACEUTICS = "เภสัชเคมีและเภสัชกรรมปรับปรุง",
  PHARMACOKINETICS = "เภสัชจลนศาสตร์",
}

interface IRTItem {
  id: string;
  contentArea: ContentArea;
  question: string;
  options: string[];
  correctAnswer: number;
  a: number;
  b: number;
  c: number;
}

interface IRTResponse {
  item: IRTItem;
  selectedAnswer: number;
  isCorrect: boolean;
  thetaBefore?: number;
  thetaAfter?: number;
  seAfter?: number;
}

interface ExamResult {
  finalTheta: number;
  finalSE: number;
  numItems: number;
  numCorrect: number;
  passed: boolean;
  responses: IRTResponse[];
  contentPerformance: Record<string, { correct: number; total: number }>;
  totalTime: number;
  stopReason: string;
}

interface CATOptions {
  minItems?: number;
  maxItems?: number;
  targetSE?: number;
  cutScore?: number;
  contentTargets?: Record<ContentArea, number>;
}

interface ChartDataPoint {
  item: number;
  theta: number;
  cutScore: number;
}

interface NormalDistDataPoint {
  x: string;
  y: number;
}

// ==================== CONSTANTS ====================
const ITEM_BANK = [
  // 🧠 PHARMACOLOGY
  {
    id: "PHAR001",
    contentArea: ContentArea.PHARMACOLOGY,
    question: "ยา Atenolol จัดอยู่ในกลุ่มใด?",
    options: [
      "Non-selective beta blocker",
      "Selective beta-1 blocker",
      "Selective beta-2 blocker",
      "Alpha and beta blocker",
    ],
    correctAnswer: 1, // Selective beta-1 blocker
    a: 1.2,
    b: -0.5,
    c: 0.25,
  },
  {
    id: "PHAR002",
    contentArea: ContentArea.PHARMACOLOGY,
    question: "ผู้ป่วยที่ได้รับ Warfarin ควรติดตามค่า Lab ใด?",
    options: ["aPTT", "PT/INR", "Bleeding time", "Platelet count"],
    correctAnswer: 1, // PT/INR
    a: 1.5,
    b: 0.0,
    c: 0.25,
  },
  {
    id: "PHAR003",
    contentArea: ContentArea.PHARMACOLOGY,
    question:
      "ยาในกลุ่ม Statin (เช่น Simvastatin) มีกลไกการออกฤทธิ์หลักอย่างไร?",
    options: [
      "HMG-CoA reductase inhibitor",
      "PCSK9 inhibitor",
      "Fibrate activator",
      "Bile acid sequestrant",
    ],
    correctAnswer: 0,
    a: 1.3,
    b: 0.2,
    c: 0.25,
  },
  {
    id: "PHAR004",
    contentArea: ContentArea.PHARMACOLOGY,
    question:
      "อาการข้างเคียงที่จำเพาะของยาในกลุ่ม ACE inhibitors (เช่น Enalapril) คืออะไร?",
    options: [
      "อาการไอแห้ง (Dry cough)",
      "ภาวะโพแทสเซียมในเลือดต่ำ (Hypokalemia)",
      "ภาวะน้ำตาลในเลือดสูง (Hyperglycemia)",
      "อัตราการเต้นหัวใจช้า (Bradycardia)",
    ],
    correctAnswer: 0,
    a: 1.6,
    b: -0.5,
    c: 0.25,
  },

  // === CLINICAL_PHARMACY (เภสัชกรรมคลินิก) ===
  {
    id: "CLIN001",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "ยาต้านพิษ (Antidote) สำหรับภาวะพิษจาก Paracetamol (Acetaminophen) คือข้อใด?",
    options: ["N-acetylcysteine (NAC)", "Naloxone", "Flumazenil", "Atropine"],
    correctAnswer: 0,
    a: 1.8,
    b: -0.8,
    c: 0.25,
  },
  {
    id: "CLIN002",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "การใช้ยา Metformin ควรระมัดระวังเป็นพิเศษในผู้ป่วยกลุ่มใด เนื่องจากเสี่ยงต่อ Lactic acidosis?",
    options: [
      "ผู้ป่วยโรคไต (Renal impairment)",
      "ผู้ป่วยโรคตับ (Hepatic impairment)",
      "ผู้ป่วยโรคหอบหืด (Asthma)",
      "ผู้ป่วยโรคซึมเศร้า (Depression)",
    ],
    correctAnswer: 0,
    a: 1.4,
    b: 0.7,
    c: 0.25,
  },
  {
    id: "CLIN003",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "ยาปฏิชีวนะใดเป็นตัวเลือกแรก (First-line) ในการรักษาการติดเชื้อ Clostridioides difficile (CDI) ที่รุนแรง (Severe)?",
    options: [
      "Metronidazole (PO)",
      "Vancomycin (PO)",
      "Ceftriaxone (IV)",
      "Azithromycin (PO)",
    ],
    correctAnswer: 1, // Vancomycin (PO)
    a: 1.3,
    b: 1.5,
    c: 0.25,
  },
  {
    id: "CLIN004",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "ข้อใด *ไม่ใช่* คำแนะนำที่ถูกต้องสำหรับการใช้ยาพ่นชนิด Metered-Dose Inhaler (MDI)?",
    options: [
      "เขย่าขวดยาก่อนใช้",
      "หายใจออกให้สุดก่อนพ่นยา",
      "กลั้นหายใจอย่างน้อย 10 วินาทีหลังพ่นยา",
      "หายใจเข้าอย่างรวดเร็วและแรง (Quick and deep)",
    ],
    correctAnswer: 3, // MDI ต้องหายใจเข้าช้าๆ ลึกๆ (Slow and deep)
    a: 1.7,
    b: 0.5,
    c: 0.25,
  },

  // === PHARMACEUTICAL_CARE (เภสัชกรรมบริบาล) ===
  {
    id: "CARE001",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      'ในการบันทึกข้อมูลผู้ป่วยแบบ SOAP note "ผู้ป่วยบ่นว่าปวดหัวและคลื่นไส้" ควรถูกบันทึกในส่วนใด?',
    options: [
      "S (Subjective data)",
      "O (Objective data)",
      "A (Assessment)",
      "P (Plan)",
    ],
    correctAnswer: 0,
    a: 2.0,
    b: -1.0,
    c: 0.25,
  },
  {
    id: "CARE002",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      "ผู้ป่วยได้รับยา Simvastatin 40 mg ร่วมกับยา Itraconazole ซึ่งเป็น Strong CYP3A4 inhibitor จัดเป็น DRP ประเภทใด?",
    options: [
      "Drug-drug interaction (DDI)",
      "Adverse drug reaction (ADR)",
      "Improper drug selection",
      "Subtherapeutic dosage",
    ],
    correctAnswer: 0,
    a: 1.5,
    b: 0.8,
    c: 0.25,
  },
  {
    id: "CARE003",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      "กระบวนการเปรียบเทียบรายการยาที่ผู้ป่วยได้รับในปัจจุบันกับรายการยาที่แพทย์สั่งใหม่ ณ จุดเปลี่ยนผ่านของการรักษา (เช่น รับเข้า-จำหน่าย) เรียกว่าอะไร?",
    options: [
      "Medication Reconciliation",
      "Medication Therapy Management (MTM)",
      "Adverse Drug Event (ADE) monitoring",
      "Pharmaceutical Care Plan",
    ],
    correctAnswer: 0,
    a: 1.9,
    b: 0.2,
    c: 0.25,
  },
  {
    id: "CARE004",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      'การที่ผู้ป่วย *ไม่* รับประทานยาตามที่สั่งเนื่องจากความเชื่อว่ายา "สะสมในตับ" จัดเป็นปัญหาด้านความร่วมมือในการใช้ยา (Adherence) ด้านใด?',
    options: [
      "ด้านความเชื่อ (Beliefs)",
      "ด้านความจำ (Memory)",
      "ด้านค่าใช้จ่าย (Cost)",
      "ด้านความซับซ้อนของยา (Regimen complexity)",
    ],
    correctAnswer: 0,
    a: 1.3,
    b: 0.6,
    c: 0.25,
  },

  // === PHARMACY_PRACTICE (การปฏิบัติการเภสัชกรรม) ===
  {
    id: "PRAC001",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question:
      "ตามกฎหมาย ยาเสพติดให้โทษประเภท 2 (เช่น Morphine injection) ต้องเก็บรักษาอย่างไร?",
    options: [
      "เก็บในตู้เซฟที่ล็อคกุญแจอย่างแน่นหนา",
      "เก็บในตู้เย็นอุณหภูมิ 2-8 C",
      "เก็บรวมกับยาอื่นได้แต่ต้องมีป้ายชัดเจน",
      "เก็บในห้องที่ควบคุมอุณหภูมิและความชื้น",
    ],
    correctAnswer: 0,
    a: 1.7,
    b: 0.0,
    c: 0.25,
  },
  {
    id: "PRAC002",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question:
      "ข้อใด *ไม่ใช่* องค์ประกอบที่จำเป็นต้องมีในใบสั่งยา (Prescription) ตามกฎหมาย?",
    options: [
      "ชื่อ-นามสกุลผู้ป่วย",
      "ลายมือชื่อผู้สั่งยา",
      "สถานที่ประกอบวิชาชีพของผู้สั่งยา",
      "หมายเลขบัตรประชาชนของผู้ป่วย",
    ],
    correctAnswer: 3,
    a: 1.2,
    b: 1.2,
    c: 0.25,
  },
  {
    id: "PRAC003",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question:
      "เมื่อจ่ายยาปฏิชีวนะ (Antibiotic) สิ่งสำคัญที่สุดที่ต้องเน้นย้ำกับผู้ป่วยคืออะไร?",
    options: [
      "รับประทานยาให้ครบตามกำหนด (Complete the course)",
      "รับประทานยาหลังอาหารทันทีเสมอ",
      "หากลืมยาให้รับประทานเป็น 2 เท่าในมื้อถัดไป",
      "ยานี้อาจทำให้ง่วงนอน",
    ],
    correctAnswer: 0,
    a: 1.9,
    b: -1.2,
    c: 0.25,
  },
  {
    id: "PRAC004",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question:
      "การเตรียมยาปราศจากเชื้อ (Aseptic preparation) เช่น ยาเคมีบำบัดทางหลอดเลือดดำ ควรทำในสภาพแวดล้อมใด?",
    options: [
      "Laminar Air Flow (LAF) hood หรือ Biological Safety Cabinet (BSC)",
      "Fume hood (ตู้ดูดควัน)",
      "ห้องจ่ายยาปกติที่มีอากาศถ่ายเท",
      "ห้องเย็น (Cold room)",
    ],
    correctAnswer: 0,
    a: 1.6,
    b: -0.3,
    c: 0.25,
  },

  // === PHARMACEUTICS (เภสัชเคมีและเภสัชกรรมปรับปรุง) ===
  {
    id: "CEUT001",
    contentArea: ContentArea.PHARMACEUTICS,
    question:
      'ยาเม็ดชนิด "Enteric-coated" (เคลือบให้แตกตัวที่ลำไส้) ถูกออกแบบมาเพื่อวัตถุประสงค์ใด?',
    options: [
      "ป้องกันยาถูกทำลายโดยกรดในกระเพาะอาหาร หรือ ป้องกันการระคายเคืองกระเพาะอาหาร",
      "ให้ออกฤทธิ์ได้ทันที (Immediate release)",
      "ให้แตกตัวในช่องปาก (Orally disintegrating)",
      "เพิ่มรสชาติของยา",
    ],
    correctAnswer: 0,
    a: 1.7,
    b: -0.7,
    c: 0.25,
  },
  {
    id: "CEUT002",
    contentArea: ContentArea.PHARMACEUTICS,
    question:
      "โดยทั่วไป การบริหารยาในรูปแบบใด (Dosage form) ที่มีค่าชีวประสิทธิผล (Bioavailability) เท่ากับ 1 (หรือ 100%)?",
    options: [
      "ยาฉีดเข้าหลอดเลือดดำ (IV injection)",
      "ยารับประทาน (Oral tablet)",
      "ยาเหน็บ (Suppository)",
      "ยาทาผิวหนัง (Topical patch)",
    ],
    correctAnswer: 0,
    a: 2.1,
    b: -1.0,
    c: 0.25,
  },
  {
    id: "CEUT003",
    contentArea: ContentArea.PHARMACEUTICS,
    question:
      "สารช่วย (Excipient) ที่เติมในยาเม็ดเพื่อช่วยให้เม็ดยาแตกตัวเมื่อสัมผัสน้ำ เรียกว่าอะไร?",
    options: [
      "Disintegrant (สารช่วยแตกตัว)",
      "Binder (สารยึดเกาะ)",
      "Lubricant (สารหล่อลื่น)",
      "Glidant (สารช่วยไหล)",
    ],
    correctAnswer: 0,
    a: 1.3,
    b: 1.3,
    c: 0.25,
  },
  {
    id: "CEUT004",
    contentArea: ContentArea.PHARMACEUTICS,
    question:
      "ข้อใดคือความแตกต่างหลักระหว่างยาขี้ผึ้ง (Ointment) และยาครีม (Cream)?",
    options: [
      "Ointment มีส่วนประกอบหลักเป็นไขมัน/น้ำมัน (Oil-based)",
      "Cream มีส่วนประกอบหลักเป็นไขมัน/น้ำมัน (Oil-based)",
      "Ointment ล้างออกด้วยน้ำได้ง่ายกว่า",
      "Cream ให้ความชุ่มชื้นได้ดีกว่า Ointment ในผิวแห้งมาก",
    ],
    correctAnswer: 0,
    a: 1.4,
    b: 0.4,
    c: 0.25,
  },

  // === PHARMACOKINETICS (เภสัชจลนศาสตร์) ===
  {
    id: "PK001",
    contentArea: ContentArea.PHARMACOKINETICS,
    question: '"ค่าครึ่งชีวิต" (Half-life, t1/2) ของยา หมายถึงอะไร?',
    options: [
      "เวลาที่ระดับยาในเลือดลดลงเหลือครึ่งหนึ่ง",
      "เวลาที่ยาเริ่มออกฤทธิ์",
      "เวลาที่ยาถูกขับออกจากร่างกายทั้งหมด",
      "เวลาที่ยามีระดับสูงสุดในเลือด (Tmax)",
    ],
    correctAnswer: 0,
    a: 2.2,
    b: -1.5,
    c: 0.25,
  },
  {
    id: "PK002",
    contentArea: ContentArea.PHARMACOKINETICS,
    question:
      "โดยทั่วไป ต้องใช้เวลานานเท่าใด (เมื่อให้ยาในขนาดคงที่และช่วงเวลาคงที่) จนกว่าระดับยาในเลือดจะเข้าสู่สภาวะคงที่ (Steady state)?",
    options: [
      "ประมาณ 4-5 เท่าของค่าครึ่งชีวิต (t1/2)",
      "ทันทีที่ให้ยาครั้งแรก",
      "24 ชั่วโมงพอดี",
      "1 เท่าของค่าครึ่งชีวิต (t1/2)",
    ],
    correctAnswer: 0,
    a: 1.8,
    b: 0.5,
    c: 0.25,
  },
  {
    id: "PK003",
    contentArea: ContentArea.PHARMACOKINETICS,
    question:
      "หากยามีค่า Volume of Distribution (Vd) สูงมาก (เช่น > 1 L/kg) หมายความว่าอย่างไร?",
    options: [
      "ยากระจายตัวไปอยู่ในเนื้อเยื่อ (Tissues) มากกว่าในเลือด",
      "ยาส่วนใหญ่อยู่ในพลาสมา (Plasma)",
      "ยาถูกขับออกทางไตได้อย่างรวดเร็ว",
      "ยาจับกับโปรตีนในเลือดได้น้อย",
    ],
    correctAnswer: 0,
    a: 1.5,
    b: 1.6,
    c: 0.25,
  },
  {
    id: "PK004",
    contentArea: ContentArea.PHARMACOKINETICS,
    question: "First-pass metabolism มักเกิดขึ้นที่อวัยวะใดเป็นหลัก?",
    options: [
      "ตับ (Liver)",
      "ไต (Kidney)",
      "ปอด (Lungs)",
      "กระเพาะอาหาร (Stomach)",
    ],
    correctAnswer: 0,
    a: 1.7,
    b: -0.9,
    c: 0.25,
  },
  {
    id: "PHAR005",
    contentArea: ContentArea.PHARMACOLOGY,
    question:
      "ยา CCB (Calcium channel blocker) ใดที่ออกฤทธิ์เด่นที่หัวใจ (ลดอัตราการเต้น/การบีบตัว) มากกว่าหลอดเลือด?",
    options: ["Amlodipine", "Nifedipine", "Verapamil", "Felodipine"],
    correctAnswer: 2, // Verapamil (non-dihydropyridine)
    a: 1.4,
    b: 0.8,
    c: 0.25,
  },
  {
    id: "PHAR006",
    contentArea: ContentArea.PHARMACOLOGY,
    question:
      "กลไกการออกฤทธิ์ของยา Dapagliflozin (กลุ่ม SGLT2 inhibitor) คืออะไร?",
    options: [
      "กระตุ้นการหลั่งอินซูลินจากตับอ่อน",
      "เพิ่มความไวของอินซูลินที่เนื้อเยื่อ",
      "ยับยั้งการดูดกลับกลูโคสที่ไต",
      "ลดการสร้างกลูโคสที่ตับ",
    ],
    correctAnswer: 2,
    a: 1.6,
    b: 0.3,
    c: 0.25,
  },
  {
    id: "PHAR007",
    contentArea: ContentArea.PHARMACOLOGY,
    question:
      "ยาแก้ปวดกลุ่ม Opioid (เช่น Morphine) ออกฤทธิ์หลักโดยจับกับตัวรับ (Receptor) ใด?",
    options: [
      "Mu (μ) receptor",
      "GABA receptor",
      "NMDA receptor",
      "Serotonin (5-HT) receptor",
    ],
    correctAnswer: 0,
    a: 1.9,
    b: -0.2,
    c: 0.25,
  },
  {
    id: "PHAR008",
    contentArea: ContentArea.PHARMACOLOGY,
    question: "ยาใดจัดเป็นยาต้านเกล็ดเลือด (Antiplatelet agent)?",
    options: ["Warfarin", "Rivaroxaban", "Clopidogrel", "Heparin"],
    correctAnswer: 2,
    a: 1.5,
    b: 0.1,
    c: 0.25,
  },

  // === CLINICAL_PHARMACY (เภสัชกรรมคลินิก) (ต่อ) ===
  {
    id: "CLIN005",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "ยาปฏิชีวนะใดที่ใช้รักษาการติดเชื้อ MRSA (Staphylococcus aureus ที่ดื้อต่อ Methicillin) ชนิดรุนแรง (IV)?",
    options: ["Amoxicillin", "Ceftriaxone", "Vancomycin", "Ciprofloxacin"],
    correctAnswer: 2,
    a: 1.7,
    b: 0.2,
    c: 0.25,
  },
  {
    id: "CLIN006",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "ตามแนวทาง JNC8 ผู้ป่วยความดันโลหิตสูงชาวผิวดำ (โดยไม่มีโรคร่วมอื่น) ควรเริ่มยาเดี่ยวกลุ่มใด?",
    options: [
      "ACE inhibitor",
      "ARB",
      "Thiazide diuretic หรือ CCB",
      "Beta blocker",
    ],
    correctAnswer: 2,
    a: 1.3,
    b: 1.0,
    c: 0.25,
  },
  {
    id: "CLIN007",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "ยากลุ่มใดที่ใช้รักษาอาการบวมน้ำ (Symptom control) แต่ *ไม่* ช่วยลดอัตราการเสียชีวิต (Mortality) ในผู้ป่วย HFrEF (ภาวะหัวใจล้มเหลว)?",
    options: [
      "ACE inhibitor",
      "Beta blocker",
      "Spironolactone",
      "Loop diuretic (เช่น Furosemide)",
    ],
    correctAnswer: 3,
    a: 1.8,
    b: 1.2,
    c: 0.25,
  },
  {
    id: "CLIN008",
    contentArea: ContentArea.CLINICAL_PHARMACY,
    question:
      "ยาต้านพิษ (Antidote) ที่จำเพาะสำหรับภาวะพิษจากยา Benzodiazepine (เช่น Diazepam) คืออะไร?",
    options: ["Naloxone", "Flumazenil", "N-acetylcysteine", "Pralidoxime"],
    correctAnswer: 1,
    a: 1.6,
    b: 0.5,
    c: 0.25,
  },

  // === PHARMACEUTICAL_CARE (เภสัชกรรมบริบาล) (ต่อ) ===
  {
    id: "CARE005",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      "ผู้ป่วยมีค่า eGFR 25 mL/min/1.73m² ได้รับ Metformin 1000 mg BID จัดเป็น DRP (Drug-Related Problem) ประเภทใด?",
    options: [
      "Adverse drug reaction",
      "Dosage too high (ขนาดยาสูงเกินไป/ข้อห้ามใช้)",
      "Drug interaction",
      "Unnecessary drug therapy",
    ],
    correctAnswer: 1,
    a: 1.7,
    b: 0.4,
    c: 0.25,
  },
  {
    id: "CARE006",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      'เทคนิคการประเมินความเข้าใจผู้ป่วย โดยการถามว่า "คุณหมอบอกว่ายานี้ใช้สำหรับอะไรครับ" เรียกว่าอะไร?',
    options: [
      "Teach-Back Method",
      "Motivational Interviewing",
      "SOAP Note",
      "Transtheoretical Model",
    ],
    correctAnswer: 0,
    a: 1.5,
    b: 0.1,
    c: 0.25,
  },
  {
    id: "CARE007",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      "ผู้ป่วยได้รับยา PPI เพื่อป้องกันแผลในกระเพาะอาหารจากความเครียด (Stress ulcer) แต่ไม่ได้อยู่ ICU และไม่มีปัจจัยเสี่ยงอื่น จัดเป็น DRP ประเภทใด?",
    options: [
      "Unnecessary drug therapy (การใช้ยาโดยไม่มีข้อบ่งใช้)",
      "Subtherapeutic dosage",
      "Adverse drug reaction",
      "Non-adherence",
    ],
    correctAnswer: 0,
    a: 1.4,
    b: 0.6,
    c: 0.25,
  },
  {
    id: "CARE008",
    contentArea: ContentArea.PHARMACEUTICAL_CARE,
    question:
      "ในการบันทึก SOAP note ค่าความดันโลหิต (BP 150/90 mmHg) ควรบันทึกในส่วนใด?",
    options: ["S (Subjective)", "O (Objective)", "A (Assessment)", "P (Plan)"],
    correctAnswer: 1,
    a: 2.1,
    b: -1.2,
    c: 0.25,
  },

  // === PHARMACY_PRACTICE (การปฏิบัติการเภสัชกรรม) (ต่อ) ===
  {
    id: "PRAC005",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question:
      "ยาฉีดอินซูลิน (Insulin) ที่ *ยังไม่เปิดใช้* ควรเก็บรักษาอย่างไร?",
    options: [
      "ในตู้เย็น (2-8 °C)",
      "ในช่องแช่แข็ง (ต่ำกว่า 0 °C)",
      "ที่อุณหภูมิห้อง (25 °C)",
      "ในตู้ทึบแสง",
    ],
    correctAnswer: 0,
    a: 1.8,
    b: -1.0,
    c: 0.25,
  },
  {
    id: "PRAC006",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question: "ยาปฏิชีวนะ (เช่น Amoxicillin) ตามกฎหมายไทยจัดเป็นยาประเภทใด?",
    options: [
      "ยาสามัญประจำบ้าน",
      "ยาอันตราย",
      "ยาควบคุมพิเศษ",
      "ยาเสพติดให้โทษประเภท 2",
    ],
    correctAnswer: 1,
    a: 1.5,
    b: 0.3,
    c: 0.25,
  },
  {
    id: "PRAC007",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question:
      "คำแนะนำที่สำคัญ *ที่สุด* สำหรับผู้ป่วยที่เริ่มใช้ยา Warfarin คืออะไร?",
    options: [
      "ห้ามรับประทานผักใบเขียวทุกชนิดเด็ดขาด",
      "ความเสี่ยงเลือดออกง่าย และต้องตรวจ INR สม่ำเสมอ",
      "ต้องรับประทานยาพร้อมน้ำ 1 แก้วเต็ม",
      "ยานี้อาจทำให้ง่วงนอนมาก",
    ],
    correctAnswer: 1,
    a: 1.9,
    b: 0.0,
    c: 0.25,
  },
  {
    id: "PRAC008",
    contentArea: ContentArea.PHARMACY_PRACTICE,
    question:
      "ข้อใดจัดเป็นยาที่มีความเสี่ยงสูง (High-Alert Medication) ที่ต้องระมัดระวังเป็นพิเศษในการจ่ายและบริหารยา?",
    options: ["Paracetamol", "Insulin", "Vitamin C", "Salinenose spray"],
    correctAnswer: 1,
    a: 1.6,
    b: -0.8,
    c: 0.25,
  },

  // === PHARMACEUTICS (เภสัชเคมีและเภสัชกรรมปรับปรุง) (ต่อ) ===
  {
    id: "CEUT005",
    contentArea: ContentArea.PHARMACEUTICS,
    question: 'ลักษณะสำคัญของยาในรูปแบบ "ยาน้ำแขวนตะกอน" (Suspension) คืออะไร?',
    options: [
      "ตัวยาละลายเป็นเนื้อเดียวกับตัวทำละลาย",
      "ประกอบด้วยของเหลว 2 ชนิดที่ไม่เข้ากัน (เช่น น้ำกับน้ำมัน)",
      "มีอนุภาคของแข็งของตัวยากระจายตัวในของเหลว",
      "เป็นรูปแบบยาที่อัดความดัน",
    ],
    correctAnswer: 2,
    a: 1.5,
    b: 0.5,
    c: 0.25,
  },
  {
    id: "CEUT006",
    contentArea: ContentArea.PHARMACEUTICS,
    question:
      "ยาใดที่สลายตัวได้ง่ายด้วยปฏิกิริยา Hydrolysis (โดยเฉพาะเมื่อผสมน้ำ)?",
    options: ["Aspirin", "Paracetamol", "Loratadine", "Atorvastatin"],
    correctAnswer: 0, // (Amoxicillin ก็ใช่ แต่ Aspirin เป็นตัวอย่างคลาสสิกของ Ester hydrolysis)
    a: 1.3,
    b: 1.4,
    c: 0.25,
  },
  {
    id: "CEUT007",
    contentArea: ContentArea.PHARMACEUTICS,
    question: 'ข้อดีหลักของการบริหารยาโดยการ "อมใต้ลิ้น" (Sublingual) คืออะไร?',
    options: [
      "หลีกเลี่ยง First-pass metabolism ที่ตับ",
      "กลบรสชาติขมของยาได้ดี",
      "เหมาะสำหรับยาที่ต้องการขนาดสูงๆ",
      "ออกฤทธิ์ได้นานต่อเนื่อง 24 ชั่วโมง",
    ],
    correctAnswer: 0,
    a: 1.8,
    b: 0.7,
    c: 0.25,
  },
  {
    id: "CEUT008",
    contentArea: ContentArea.PHARMACEUTICS,
    question:
      'สารช่วย (Excipient) ใดที่นิยมใช้เป็น "สารเพิ่มปริมาณ" (Diluent/Filler) ในการตอกยาเม็ด?',
    options: [
      "Lactose / Microcrystalline Cellulose",
      "Magnesium Stearate",
      "Silicon Dioxide",
      "Titanium Dioxide",
    ],
    correctAnswer: 0,
    a: 1.2,
    b: 1.0,
    c: 0.25,
  },
  {
    id: "PK005",
    contentArea: ContentArea.PHARMACOKINETICS,
    question: "หากยาจับกับโปรตีนในเลือดได้สูงมาก (เช่น 99%) ข้อใดถูกต้อง?",
    options: [
      "มีเพียง 1% ที่เป็น ยารูปแบบอิสระ (Free drug) ที่ออกฤทธิ์ได้",
      "ยาจะมีค่า Vd (Volume of Distribution) สูงมาก",
      "ยาจะถูกกำจัดออกจากร่างกายได้เร็วมาก",
      "ยาจะไม่สามารถผ่านเข้าสู่สมองได้เลย",
    ],
    correctAnswer: 0,
    a: 1.9,
    b: 1.1,
    c: 0.25,
  },
  {
    id: "PK006",
    contentArea: ContentArea.PHARMACOKINETICS,
    question:
      "ยาใดที่มีจลนศาสตร์การกำจัดยาแบบ Zero-order (กำจัดยาในปริมาณคงที่ต่อเวลา) ที่ขนาดยารักษา?",
    options: ["Phenytoin", "Digoxin", "Metformin", "Amoxicillin"],
    correctAnswer: 0, // (Alcohol ก็ใช่ แต่ Phenytoin เป็นยาที่พบบ่อยในคลินิก)
    a: 1.7,
    b: 1.8,
    c: 0.25,
  },
  {
    id: "PK007",
    contentArea: ContentArea.PHARMACOKINETICS,
    question: 'ค่า "Clearance" (CL) ในทางเภสัชจลนศาสตร์ หมายถึงอะไร?',
    options: [
      "ปริมาตรของพลาสมาที่ถูกกำจัดยาออกไปจนหมดในหนึ่งหน่วยเวลา",
      "เวลาที่ใช้ในการกำจัดยาออกจากร่างกายจนหมด",
      "อัตราเร็วในการดูดซึมยาเข้าสู่ร่างกาย",
      "เปอร์เซ็นต์ของยาที่จับกับโปรตีนในเลือด",
    ],
    correctAnswer: 0,
    a: 2.0,
    b: 0.9,
    c: 0.25,
  },
  {
    id: "PK008",
    contentArea: ContentArea.PHARMACOKINETICS,
    question:
      'การให้ "Loading Dose" (ขนาดยาเริ่มต้น) มีวัตถุประสงค์หลักเพื่ออะไร?',
    options: [
      "เพื่อให้ระดับยาในเลือดถึงสภาวะคงที่ (Steady state) ได้เร็วขึ้น",
      "เพื่อทดสอบอาการแพ้ยาของผู้ป่วย",
      "เพื่อลดอาการข้างเคียงของยา",
      "เพื่อให้เอนไซม์ที่ตับอิ่มตัว",
    ],
    correctAnswer: 0,
    a: 1.6,
    b: 0.2,
    c: 0.25,
  },
];

// ==================== IRT ENGINE ====================
class IRTEngine {
  static probability(theta: number, item: IRTItem): number {
    const exponent = -item.a * (theta - item.b);
    const prob = item.c + (1 - item.c) / (1 + Math.exp(exponent));
    return Math.max(0.0001, Math.min(0.9999, prob));
  }

  static information(theta: number, item: IRTItem): number {
    const P = this.probability(theta, item);
    if (P <= 0.0001 || P >= 0.9999) return 0.0;

    const numerator = Math.pow(item.a, 2) * Math.pow(P - item.c, 2) * (1 - P);
    const denominator = Math.pow(1 - item.c, 2) * P;

    return denominator === 0 ? 0.0 : numerator / denominator;
  }

  static normalPDF(x: number, mean: number, sd: number): number {
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
    return Math.exp(exponent) / (sd * Math.sqrt(2 * Math.PI));
  }

  static estimateThetaEAP(
    responses: IRTResponse[],
    priorMean: number = 0,
    priorSD: number = 1
  ): { theta: number; se: number } {
    if (responses.length === 0) return { theta: 0.0, se: 999.0 };

    const numQuadrature = 49;
    const thetaMin = -4.0;
    const thetaMax = 4.0;

    const thetaPoints = Array.from(
      { length: numQuadrature },
      (_, i) => thetaMin + ((thetaMax - thetaMin) * i) / (numQuadrature - 1)
    );

    const prior = thetaPoints.map((theta) => this.normalPDF(theta, priorMean, priorSD));

    const likelihoods = thetaPoints.map((theta) => {
      let logL = 0;
      for (const response of responses) {
        const P = this.probability(theta, response.item);
        logL += response.isCorrect ? Math.log(P) : Math.log(1 - P);
      }
      return Math.exp(logL);
    });

    const posterior = likelihoods.map((L, i) => L * prior[i]);
    const total = posterior.reduce((sum, p) => sum + p, 0);

    if (total === 0) return { theta: priorMean, se: 999.0 };

    const normalizedPosterior = posterior.map((p) => p / total);

    const thetaEAP = thetaPoints.reduce(
      (sum, theta, i) => sum + theta * normalizedPosterior[i],
      0
    );

    const variance = thetaPoints.reduce(
      (sum, theta, i) => sum + Math.pow(theta - thetaEAP, 2) * normalizedPosterior[i],
      0
    );

    return { theta: thetaEAP, se: Math.sqrt(variance) };
  }

  static simulateResponse(item: IRTItem, trueAbility: number): IRTResponse {
    const prob = this.probability(trueAbility, item);
    const isCorrect = Math.random() < prob;

    if (isCorrect) {
      return { item, selectedAnswer: item.correctAnswer, isCorrect: true };
    }

    const wrongAnswers = item.options
      .map((_, index) => index)
      .filter((index) => index !== item.correctAnswer);

    return {
      item,
      selectedAnswer: wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)],
      isCorrect: false,
    };
  }
}

// ==================== CAT ENGINE ====================
class CATEngine {
  itemBank: IRTItem[];
  minItems: number;
  maxItems: number;
  targetSE: number;
  cutScore: number;
  contentTargets: Record<ContentArea, number>;
  usedItems: Set<string>;
  contentCount: Record<string, number>;

  constructor(itemBank: IRTItem[], options: CATOptions = {}) {
    this.itemBank = itemBank;
    this.minItems = options.minItems || 20;
    this.maxItems = options.maxItems || 50;
    this.targetSE = options.targetSE || 0.35;
    this.cutScore = options.cutScore || 0.0;
    this.contentTargets = options.contentTargets || {
      [ContentArea.PHARMACOLOGY]: 10,
      [ContentArea.CLINICAL_PHARMACY]: 8,
      [ContentArea.PHARMACEUTICAL_CARE]: 5,
      [ContentArea.PHARMACY_PRACTICE]: 5,
      [ContentArea.PHARMACEUTICS]: 4,
      [ContentArea.PHARMACOKINETICS]: 5,
    };
    this.usedItems = new Set();
    this.contentCount = {};
    Object.keys(this.contentTargets).forEach((area) => {
      this.contentCount[area] = 0;
    });
  }

  selectFirstItem(): IRTItem {
    const candidates = this.itemBank.filter((item) => Math.abs(item.b) < 0.5);
    return candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : this.itemBank[0];
  }

  selectNextItem(currentTheta: number): IRTItem | null {
    const priorityContents: string[] = [];
    for (const [content, target] of Object.entries(this.contentTargets)) {
      if ((this.contentCount[content] || 0) < target) {
        priorityContents.push(content);
      }
    }

    let eligibleItems =
      priorityContents.length > 0
        ? this.itemBank.filter(
            (item) =>
              !this.usedItems.has(item.id) && priorityContents.includes(item.contentArea)
          )
        : this.itemBank.filter((item) => !this.usedItems.has(item.id));

    if (eligibleItems.length === 0) return null;

    let bestItem: IRTItem | null = null;
    let maxInfo = -1;
    for (const item of eligibleItems) {
      const info = IRTEngine.information(currentTheta, item) * (0.95 + Math.random() * 0.1);
      if (info > maxInfo) {
        maxInfo = info;
        bestItem = item;
      }
    }
    return bestItem;
  }

  checkStoppingRule(
    currentTheta: number,
    currentSE: number,
    numItems: number
  ): { shouldStop: boolean; reason: string } {
    if (numItems >= this.maxItems) {
      return {
        shouldStop: true,
        reason: `ครบจำนวนข้อสูงสุด (${this.maxItems} ข้อ)`,
      };
    }
    if (numItems < this.minItems) return { shouldStop: false, reason: "" };
    if (currentSE <= this.targetSE) {
      return {
        shouldStop: true,
        reason: `SE ต่ำกว่าเป้าหมาย (${currentSE.toFixed(3)})`,
      };
    }
    const zScore = 1.96;
    const margin = zScore * currentSE;
    const ciLower = currentTheta - margin;
    const ciUpper = currentTheta + margin;
    if (ciLower > this.cutScore) return { shouldStop: true, reason: "มั่นใจว่าสอบผ่าน" };
    if (ciUpper < this.cutScore) return { shouldStop: true, reason: "มั่นใจว่าสอบไม่ผ่าน" };
    return { shouldStop: false, reason: "" };
  }

  recordItemUsage(item: IRTItem): void {
    this.usedItems.add(item.id);
    this.contentCount[item.contentArea] = (this.contentCount[item.contentArea] || 0) + 1;
  }
}

// ==================== MAIN APP ====================
export default function PharmacyCATSystem() {
  const [screen, setScreen] = useState<"home" | "exam" | "result">("home");
  const [examMode, setExamMode] = useState<"real" | "demo-easy" | "demo-medium" | "demo-hard">("real");
  const [catEngine, setCatEngine] = useState<CATEngine | null>(null);
  const [currentTheta, setCurrentTheta] = useState<number>(0.0);
  const [currentSE, setCurrentSE] = useState<number>(999.0);
  const [responses, setResponses] = useState<IRTResponse[]>([]);
  const [currentItem, setCurrentItem] = useState<IRTItem | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [examStartTime, setExamStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  // Timer
  useEffect(() => {
    if (screen === "exam" && examStartTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - examStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [screen, examStartTime]);

  const startExam = () => {
    const engine = new CATEngine(ITEM_BANK, {
      minItems: 20,
      maxItems: 50,
      targetSE: 0.35,
      cutScore: 0.0,
    });

    setCatEngine(engine);
    setExamStartTime(Date.now());
    setScreen("exam");
    loadNextQuestion(engine, 0.0, []);
  };

  const loadNextQuestion = (
    engine: CATEngine,
    theta: number,
    currentResponses: IRTResponse[]
  ) => {
    setLoading(true);
    setTimeout(() => {
      const item =
        currentResponses.length === 0 ? engine.selectFirstItem() : engine.selectNextItem(theta);

      if (!item) {
        finishExam("ไม่มีข้อสอบเหลือในคลัง", currentResponses, theta, currentSE);
        return;
      }

      engine.recordItemUsage(item);
      setCurrentItem(item);
      setSelectedAnswer(null);
      setLoading(false);

      // Auto answer for demo mode
      if (examMode !== "real") {
        const trueAbility =
          examMode === "demo-easy" ? -1.0 : examMode === "demo-medium" ? 0.0 : 1.5;
        setTimeout(() => {
          const response = IRTEngine.simulateResponse(item, trueAbility);
          setSelectedAnswer(response.selectedAnswer);
          setTimeout(() => submitAnswer(response.selectedAnswer, item, engine, theta, currentResponses), 500);
        }, 1000);
      }
    }, 500);
  };

  const submitAnswer = (
    answer: number | null,
    item: IRTItem,
    engine: CATEngine,
    theta: number,
    currentResponses: IRTResponse[]
  ) => {
    if (answer === null) {
      alert("กรุณาเลือกคำตอบ");
      return;
    }

    const isCorrect = answer === item.correctAnswer;
    const response: IRTResponse = {
      item,
      selectedAnswer: answer,
      isCorrect,
      thetaBefore: theta,
    };

    const newResponses = [...currentResponses, response];
    const estimation = IRTEngine.estimateThetaEAP(newResponses);

    response.thetaAfter = estimation.theta;
    response.seAfter = estimation.se;

    setResponses(newResponses);
    setCurrentTheta(estimation.theta);
    setCurrentSE(estimation.se);

    const stoppingRule = engine.checkStoppingRule(estimation.theta, estimation.se, newResponses.length);

    if (stoppingRule.shouldStop) {
      finishExam(stoppingRule.reason, newResponses, estimation.theta, estimation.se);
    } else {
      loadNextQuestion(engine, estimation.theta, newResponses);
    }
  };

  const finishExam = (
    reason: string,
    finalResponses: IRTResponse[],
    finalTheta: number,
    finalSE: number
  ) => {
    const totalTime = examStartTime ? (Date.now() - examStartTime) / 1000 : 0;
    const numCorrect = finalResponses.filter((r) => r.isCorrect).length;
    const passed = finalTheta >= 0.0;

    const contentPerformance: Record<string, { correct: number; total: number }> = {};
    for (const content of Object.values(ContentArea)) {
      const contentResponses = finalResponses.filter((r) => r.item.contentArea === content);
      if (contentResponses.length > 0) {
        const correct = contentResponses.filter((r) => r.isCorrect).length;
        contentPerformance[content] = {
          correct,
          total: contentResponses.length,
        };
      }
    }

    const result: ExamResult = {
      finalTheta,
      finalSE,
      numItems: finalResponses.length,
      numCorrect,
      passed,
      responses: finalResponses,
      contentPerformance,
      totalTime,
      stopReason: reason,
    };

    setExamResult(result);
    setScreen("result");
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==================== SCREENS ====================
  if (screen === "home") {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Navbar_user />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 mt-8">
            <div className="text-center mb-8">
              {/* <div className="text-6xl mb-4">🏥</div> */}
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                ระบบสอบใบประกอบวิชาชีพเภสัชกรรม
              </h1>
              <p className="text-gray-600">Computer Adaptive Testing (CAT)</p>
            </div>

            <div className="mb-6">
              <h3 className="text-center text-lg font-semibold text-green-800 mb-4">
                เลือกโหมดการสอบ:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "real" as const, icon: "👨‍🎓", label: "สอบจริง", desc: "ตอบคำถามด้วยตัวเอง" },
                  { value: "demo-easy" as const, icon: "😊", label: "Demo: ง่าย", desc: "จำลอง θ = -1.0" },
                  { value: "demo-medium" as const, icon: "😐", label: "Demo: ปานกลาง", desc: "จำลอง θ = 0.0" },
                  { value: "demo-hard" as const, icon: "😎", label: "Demo: ยาก", desc: "จำลอง θ = 1.5" },
                ].map((mode) => (
                  <label key={mode.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value={mode.value}
                      checked={examMode === mode.value}
                      onChange={(e) => setExamMode(e.target.value as typeof examMode)}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        examMode === mode.value
                          ? "border-green-500 bg-green-50"
                          : "border-green-200 bg-white hover:border-green-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{mode.icon}</div>
                      <h4 className="font-semibold text-sm text-green-800">{mode.label}</h4>
                      <p className="text-xs text-gray-600">{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={startExam}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl text-lg font-semibold hover:shadow-lg transition-all"
            >
              🚀 เริ่มการสอบ
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (screen === "exam") {
    const thetaPercent = ((currentTheta + 4) / 8) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold mb-1">🏥 การสอบใบประกอบวิชาชีพเภสัชกรรม</h1>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-xs opacity-80">ข้อที่</div>
                  <div className="text-xl font-bold">{responses.length}</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-xs opacity-80">θ</div>
                  <div className="text-xl font-bold">{currentTheta.toFixed(2)}</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-xs opacity-80">เวลา</div>
                  <div className="text-xl font-bold">{formatTime(elapsedTime)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 mt-2 bg-gray-50">
            <div className="relative h-12 flex items-center">
              <div className="flex-1 h-8 rounded-l-xl bg-gradient-to-r from-red-200 to-red-100 border-2 border-red-300 flex items-center justify-center text-red-800 font-semibold text-sm">
                ❌ ไม่ผ่าน
              </div>
              <div className="flex-1 h-8 rounded-r-xl bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-300 flex items-center justify-center text-green-800 font-semibold text-sm">
                ✅ ผ่าน
              </div>
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-orange-500 -translate-x-1/2">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
                  ⚡ เส้นผ่าน
                </div>
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ left: `${Math.max(0, Math.min(100, thetaPercent))}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-green-500 px-3 py-1 rounded-full text-xs font-semibold text-green-800 whitespace-nowrap">
                  θ = {currentTheta.toFixed(2)}
                </div>
                <div className="text-3xl filter drop-shadow-lg -translate-x-1/2">
                  {currentTheta >= 0 ? "✅" : "⚠️"}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">กำลังคำนวณข้อสอบถัดไป...</p>
              </div>
            </div>
          ) : (
            currentItem && (
              <div className="p-6">
                <div className="bg-green-50 rounded-2xl p-6">
                  <div className="flex gap-3 mb-4">
                    <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentItem.contentArea}
                    </span>
                    <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentItem.b < -1
                        ? "😊 ง่าย"
                        : currentItem.b < 0
                        ? "😐 ปานกลาง"
                        : currentItem.b < 1
                        ? "😅 ค่อนข้างยาก"
                        : "😰 ยาก"}
                    </span>
                  </div>

                  <p className="text-lg font-medium text-gray-800 mb-6">{currentItem.question}</p>

                  <div className="space-y-3">
                    {currentItem.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (examMode === "real") {
                            setSelectedAnswer(index);
                          }
                        }}
                        disabled={examMode !== "real"}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                          selectedAnswer === index
                            ? "border-green-500 bg-green-50"
                            : "border-green-200 bg-white hover:border-green-300 hover:bg-green-50"
                        } ${examMode !== "real" ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            selectedAnswer === index
                              ? "bg-green-500 text-white"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option}</span>
                      </button>
                    ))}
                  </div>

                  {examMode === "real" && (
                    <button
                      onClick={() =>
                        catEngine && submitAnswer(selectedAnswer, currentItem, catEngine, currentTheta, responses)
                      }
                      disabled={selectedAnswer === null}
                      className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                    >
                      ส่งคำตอบ →
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (screen === "result" && examResult) {
    const chartData: ChartDataPoint[] = examResult.responses.map((r, i) => ({
      item: i + 1,
      theta: r.thetaAfter || 0,
      cutScore: 0,
    }));

    const normalDistData: NormalDistDataPoint[] = [];
    for (let x = -4; x <= 4; x += 0.1) {
      normalDistData.push({
        x: x.toFixed(1),
        y: IRTEngine.normalPDF(x, examResult.finalTheta, examResult.finalSE),
      });
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div
            className={`p-12 text-center text-white ${
              examResult.passed
                ? "bg-gradient-to-r from-green-600 to-green-700"
                : "bg-gradient-to-r from-red-600 to-red-700"
            }`}
          >
            <div className="text-7xl mb-4">{examResult.passed ? "🎉" : "📚"}</div>
            <h1 className="text-4xl font-bold mb-2">
              {examResult.passed ? "ยินดีด้วย! คุณสอบผ่าน" : "ไม่ผ่านการสอบ"}
            </h1>
            <p className="text-lg opacity-90">
              {examResult.passed
                ? "คุณได้รับการรับรองความสามารถในระดับที่ผ่านเกณฑ์"
                : "แนะนำให้ทบทวนและสอบใหม่อีกครั้ง"}
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-sm text-gray-600 mb-1">เวลาที่ใช้</div>
                <div className="text-base font-semibold text-gray-800">
                  {formatTime(examResult.totalTime)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-sm text-gray-600 mb-1">จำนวนข้อ</div>
                <div className="text-base font-semibold text-gray-800">{examResult.numItems}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-sm text-gray-600 mb-1">ตอบถูก</div>
                <div className="text-base font-semibold text-green-700">{examResult.numCorrect}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <div className="text-sm text-gray-600 mb-1">ตอบผิด</div>
                <div className="text-base font-semibold text-red-700">
                  {examResult.numItems - examResult.numCorrect}
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-8 mb-8">
              <h3 className="text-xl font-bold text-green-800 mb-4 text-center">
                📈 ประมาณการความสามารถ (θ)
              </h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-green-700">
                  θ = {examResult.finalTheta.toFixed(3)} ± {examResult.finalSE.toFixed(3)}
                </span>
              </div>

              <div className="relative h-16 mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-200 via-yellow-100 to-green-200 border-2 border-gray-300"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-orange-500 -translate-x-1/2">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    เส้นผ่าน
                  </div>
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all"
                  style={{ left: `${((examResult.finalTheta + 3) / 6) * 100}%` }}
                >
                  <div className="text-4xl filter drop-shadow-lg -translate-x-1/2">
                    {examResult.passed ? "✅" : "⚠️"}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>-4</span>
                <span>-3</span>
                <span>-2</span>
                <span>-1</span>
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>

              <div className="text-center bg-white rounded-xl p-4">
                <p className="text-gray-700">
                  {examResult.finalTheta < -1
                    ? "📉 ความสามารถต่ำกว่าค่าเฉลี่ย"
                    : examResult.finalTheta < 0
                    ? "📊 ความสามารถใกล้เคียงค่าเฉลี่ย (ต่ำกว่าเล็กน้อย)"
                    : examResult.finalTheta < 1
                    ? "📈 ความสามารถสูงกว่าค่าเฉลี่ย"
                    : "🌟 ความสามารถสูงมาก"}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📚 ผลการสอบแยกตามหมวดวิชา</h3>
              <div className="space-y-3">
                {Object.entries(examResult.contentPerformance).map(([content, data]) => {
                  const percent = ((data.correct / data.total) * 100).toFixed(0);
                  return (
                    <div key={content} className="flex items-center gap-4">
                      <div className="w-48 text-sm font-medium text-gray-700">{content}</div>
                      <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-end pr-3 text-sm font-semibold text-gray-700">
                          {data.correct}/{data.total} ({percent}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 กราฟการเปลี่ยนแปลงของ θ</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="item" label={{ value: "ข้อที่", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={[-4, 4]} label={{ value: "θ", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="theta"
                    stroke="#43a047"
                    strokeWidth={2}
                    name="θ (Ability)"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cutScore"
                    stroke="#ff9800"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Cut Score"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🔔 กราฟ Normal Distribution ของ θ</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={normalDistData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    label={{ value: "θ (Ability)", position: "insideBottom", offset: -5 }}
                    ticks={["-4.0", "-3.0", "-2.0", "-1.0", "0.0", "1.0", "2.0", "3.0", "4.0"]}
                  />
                  <YAxis label={{ value: "Probability Density", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="#43a047"
                    fill="rgba(67, 160, 71, 0.2)"
                    name="Posterior Distribution"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>การกระจายของความน่าจะเป็นของความสามารถ (θ) ของผู้สอบ</p>
                <p>จุดสูงสุดแสดงถึงค่าประมาณที่น่าจะเป็นมากที่สุด</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 รายละเอียดการตอบ (20 ข้อแรก)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">ข้อที่</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">หมวด</th>
                      <th className="p-3 text-center text-sm font-semibold text-gray-700">ความยาก (b)</th>
                      <th className="p-3 text-center text-sm font-semibold text-gray-700">ผล</th>
                      <th className="p-3 text-center text-sm font-semibold text-gray-700">θ หลัง</th>
                      <th className="p-3 text-center text-sm font-semibold text-gray-700">SE</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {examResult.responses.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="p-3 text-sm">{i + 1}</td>
                        <td className="p-3 text-sm">{r.item.contentArea}</td>
                        <td className="p-3 text-sm text-center">{r.item.b.toFixed(2)}</td>
                        <td className="p-3 text-center text-lg">{r.isCorrect ? "✅" : "❌"}</td>
                        <td className="p-3 text-sm text-center font-semibold">
                          {r.thetaAfter?.toFixed(3) || "N/A"}
                        </td>
                        <td className="p-3 text-sm text-center">{r.seAfter?.toFixed(3) || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-4">
              {/* <button
                onClick={() => window.print()}
                className="flex-1 bg-white border-2 border-green-500 text-green-700 py-4 rounded-xl font-semibold hover:bg-green-50 transition-all"
              >
                🖨️ พิมพ์ใบรับรอง
              </button> */}
              <button
                onClick={() => {
                  setScreen("home");
                  setExamMode("real");
                  setResponses([]);
                  setCurrentTheta(0.0);
                  setCurrentSE(999.0);
                  setExamResult(null);
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                🏠 กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}