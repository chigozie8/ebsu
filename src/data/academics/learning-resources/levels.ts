// Preclinical levels (Year 1-3)
export const preclinicalLevels = [
  {
    level: "100",
    title: "100 Level (Year 1)",
    desc: "Basic sciences foundation: Physics, Chemistry, Biology, Mathematics, and introductory medical courses",
    section: "preclinical"
  },
  {
    level: "200",
    title: "200 Level (Year 2)",
    desc: "Anatomy, Physiology, and Biochemistry - Introduction to the human body structure and function",
    section: "preclinical"
  },
  {
    level: "300",
    title: "300 Level (Year 3)",
    desc: "Advanced Anatomy, Physiology, and Biochemistry - Completing preclinical studies",
    section: "preclinical"
  },
];

// Clinical levels (Year 4-6)
export const clinicalLevels = [
  {
    level: "400",
    title: "400 Level (Year 4)",
    desc: "Pathology, Pharmacology, Microbiology - Understanding disease mechanisms and treatments",
    section: "clinical"
  },
  {
    level: "500",
    title: "500 Level (Year 5)",
    desc: "Clinical rotations: Medicine, Surgery, Paediatrics, Obstetrics & Gynaecology, Psychiatry",
    section: "clinical"
  },
  {
    level: "600",
    title: "600 Level (Year 6)",
    desc: "Final clinical rotations, specialized clerkships, and preparation for MBBS examinations",
    section: "clinical"
  },
];

// Combined for backward compatibility
export const learningResourcesLevels = [...preclinicalLevels, ...clinicalLevels];
  
