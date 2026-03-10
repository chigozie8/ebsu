// MBBS Courses organized by Preclinical (Year 1-3) and Clinical (Year 4-6) sections

export interface MBBSCourse {
  courseCode: string;
  courseTitle: string;
}

export interface SemesterCourses {
  First: MBBSCourse[];
  Second: MBBSCourse[];
}

export interface LevelCourses {
  [level: string]: SemesterCourses;
}

// Preclinical Courses (100L - 300L / Year 1-3)
export const preclinicalCourses: LevelCourses = {
  "100": {
    First: [
      { courseCode: "PHY 101", courseTitle: "General Physics I (Mechanics & Properties of Matter)" },
      { courseCode: "CHM 101", courseTitle: "General Chemistry I (Inorganic Chemistry)" },
      { courseCode: "BIO 101", courseTitle: "General Biology I (Cell Biology)" },
      { courseCode: "MTH 101", courseTitle: "Elementary Mathematics I" },
      { courseCode: "GST 101", courseTitle: "Use of English I" },
      { courseCode: "GST 103", courseTitle: "Philosophy and Logic" },
      { courseCode: "GST 105", courseTitle: "Nigerian History and Culture" },
      { courseCode: "ANA 101", courseTitle: "Introduction to Anatomy" },
      { courseCode: "PHY 103", courseTitle: "Medical Physics I" },
    ],
    Second: [
      { courseCode: "PHY 102", courseTitle: "General Physics II (Electricity & Magnetism)" },
      { courseCode: "CHM 102", courseTitle: "General Chemistry II (Organic Chemistry)" },
      { courseCode: "BIO 102", courseTitle: "General Biology II (Genetics)" },
      { courseCode: "MTH 102", courseTitle: "Elementary Mathematics II" },
      { courseCode: "GST 102", courseTitle: "Use of English II" },
      { courseCode: "GST 108", courseTitle: "Social Science" },
      { courseCode: "BCH 101", courseTitle: "Introduction to Biochemistry" },
      { courseCode: "PHY 104", courseTitle: "Medical Physics II" },
    ],
  },
  "200": {
    First: [
      { courseCode: "ANA 201", courseTitle: "Gross Anatomy of Upper Limb" },
      { courseCode: "ANA 203", courseTitle: "Gross Anatomy of Thorax" },
      { courseCode: "ANA 205", courseTitle: "Histology I (Basic Tissues)" },
      { courseCode: "PHY 201", courseTitle: "Human Physiology I (Cell Physiology)" },
      { courseCode: "PHY 203", courseTitle: "Blood and Body Fluids Physiology" },
      { courseCode: "BCH 201", courseTitle: "General Biochemistry I" },
      { courseCode: "BCH 203", courseTitle: "Chemistry of Carbohydrates" },
      { courseCode: "GST 201", courseTitle: "Citizenship Education" },
    ],
    Second: [
      { courseCode: "ANA 202", courseTitle: "Gross Anatomy of Lower Limb" },
      { courseCode: "ANA 204", courseTitle: "Gross Anatomy of Abdomen & Pelvis" },
      { courseCode: "ANA 206", courseTitle: "Histology II (Organ Systems)" },
      { courseCode: "ANA 208", courseTitle: "Embryology I (General Embryology)" },
      { courseCode: "PHY 202", courseTitle: "Cardiovascular Physiology" },
      { courseCode: "PHY 204", courseTitle: "Respiratory Physiology" },
      { courseCode: "BCH 202", courseTitle: "General Biochemistry II" },
      { courseCode: "BCH 204", courseTitle: "Chemistry of Lipids and Proteins" },
    ],
  },
  "300": {
    First: [
      { courseCode: "ANA 301", courseTitle: "Neuroanatomy I" },
      { courseCode: "ANA 303", courseTitle: "Gross Anatomy of Head & Neck" },
      { courseCode: "ANA 305", courseTitle: "Embryology II (Systemic Embryology)" },
      { courseCode: "PHY 301", courseTitle: "Renal Physiology" },
      { courseCode: "PHY 303", courseTitle: "Gastrointestinal Physiology" },
      { courseCode: "PHY 305", courseTitle: "Neurophysiology I" },
      { courseCode: "BCH 301", courseTitle: "Enzymology" },
      { courseCode: "BCH 303", courseTitle: "Metabolism of Carbohydrates" },
    ],
    Second: [
      { courseCode: "ANA 302", courseTitle: "Neuroanatomy II" },
      { courseCode: "ANA 304", courseTitle: "Histology III (Advanced)" },
      { courseCode: "PHY 302", courseTitle: "Endocrine Physiology" },
      { courseCode: "PHY 304", courseTitle: "Reproductive Physiology" },
      { courseCode: "PHY 306", courseTitle: "Neurophysiology II" },
      { courseCode: "BCH 302", courseTitle: "Metabolism of Lipids" },
      { courseCode: "BCH 304", courseTitle: "Metabolism of Proteins & Nucleic Acids" },
      { courseCode: "BCH 306", courseTitle: "Clinical Biochemistry" },
    ],
  },
};

// Clinical Courses (400L - 600L / Year 4-6) - No semesters, year-long rotations
export interface ClinicalLevelCourses {
  [level: string]: MBBSCourse[];
}

export const clinicalCourses: ClinicalLevelCourses = {
  "400": [
    // Pathology
    { courseCode: "PAT 401", courseTitle: "General Pathology" },
    { courseCode: "PAT 402", courseTitle: "Systemic Pathology I" },
    { courseCode: "PAT 403", courseTitle: "Systemic Pathology II" },
    { courseCode: "PAT 404", courseTitle: "Clinical Pathology" },
    { courseCode: "PAT 405", courseTitle: "Histopathology" },
    // Pharmacology
    { courseCode: "PHA 401", courseTitle: "General Pharmacology" },
    { courseCode: "PHA 402", courseTitle: "Autonomic Pharmacology" },
    { courseCode: "PHA 403", courseTitle: "Cardiovascular Pharmacology" },
    { courseCode: "PHA 404", courseTitle: "CNS Pharmacology" },
    { courseCode: "PHA 405", courseTitle: "Chemotherapy & Antibiotics" },
    { courseCode: "PHA 406", courseTitle: "Endocrine Pharmacology" },
    // Microbiology
    { courseCode: "MIC 401", courseTitle: "General Microbiology" },
    { courseCode: "MIC 402", courseTitle: "Medical Bacteriology" },
    { courseCode: "MIC 403", courseTitle: "Medical Virology" },
    { courseCode: "MIC 404", courseTitle: "Medical Mycology" },
    { courseCode: "MIC 405", courseTitle: "Medical Parasitology" },
    { courseCode: "MIC 406", courseTitle: "Immunology" },
    // Chemical Pathology & Haematology
    { courseCode: "CHE 401", courseTitle: "Chemical Pathology I" },
    { courseCode: "CHE 402", courseTitle: "Chemical Pathology II" },
    { courseCode: "HAE 401", courseTitle: "Haematology I" },
    { courseCode: "HAE 402", courseTitle: "Haematology II" },
    { courseCode: "HAE 403", courseTitle: "Blood Transfusion Science" },
  ],
  "500": [
    // Internal Medicine
    { courseCode: "MED 501", courseTitle: "Internal Medicine I - General Medicine" },
    { courseCode: "MED 502", courseTitle: "Internal Medicine II - Cardiology" },
    { courseCode: "MED 503", courseTitle: "Internal Medicine III - Pulmonology" },
    { courseCode: "MED 504", courseTitle: "Internal Medicine IV - Gastroenterology" },
    { courseCode: "MED 505", courseTitle: "Internal Medicine V - Nephrology" },
    { courseCode: "MED 506", courseTitle: "Internal Medicine VI - Neurology" },
    { courseCode: "MED 507", courseTitle: "Internal Medicine VII - Endocrinology" },
    { courseCode: "MED 508", courseTitle: "Internal Medicine VIII - Rheumatology" },
    // Surgery
    { courseCode: "SUR 501", courseTitle: "General Surgery I" },
    { courseCode: "SUR 502", courseTitle: "General Surgery II" },
    { courseCode: "SUR 503", courseTitle: "Surgical Techniques" },
    { courseCode: "SUR 504", courseTitle: "Orthopaedic Surgery" },
    { courseCode: "SUR 505", courseTitle: "Trauma & Emergency Surgery" },
    // Paediatrics
    { courseCode: "PED 501", courseTitle: "General Paediatrics" },
    { courseCode: "PED 502", courseTitle: "Neonatology" },
    { courseCode: "PED 503", courseTitle: "Paediatric Emergencies" },
    { courseCode: "PED 504", courseTitle: "Paediatric Nutrition" },
    // Obstetrics & Gynaecology
    { courseCode: "O&G 501", courseTitle: "Obstetrics I - Normal Pregnancy" },
    { courseCode: "O&G 502", courseTitle: "Obstetrics II - High Risk Pregnancy" },
    { courseCode: "O&G 503", courseTitle: "Gynaecology I" },
    { courseCode: "O&G 504", courseTitle: "Gynaecology II" },
    // Psychiatry
    { courseCode: "PSY 501", courseTitle: "General Psychiatry" },
    { courseCode: "PSY 502", courseTitle: "Clinical Psychiatry" },
    { courseCode: "PSY 503", courseTitle: "Child & Adolescent Psychiatry" },
    // Community Medicine
    { courseCode: "COM 501", courseTitle: "Epidemiology" },
    { courseCode: "COM 502", courseTitle: "Public Health" },
    { courseCode: "COM 503", courseTitle: "Biostatistics" },
  ],
  "600": [
    // Advanced Internal Medicine
    { courseCode: "MED 601", courseTitle: "Internal Medicine - Haematology/Oncology" },
    { courseCode: "MED 602", courseTitle: "Internal Medicine - Infectious Diseases" },
    { courseCode: "MED 603", courseTitle: "Internal Medicine - Dermatology" },
    { courseCode: "MED 604", courseTitle: "Internal Medicine - Geriatric Medicine" },
    { courseCode: "MED 605", courseTitle: "Internal Medicine - Clinical Toxicology" },
    { courseCode: "MED 606", courseTitle: "Internal Medicine - Intensive Care" },
    // Surgical Specialties
    { courseCode: "SUR 601", courseTitle: "Cardiothoracic Surgery" },
    { courseCode: "SUR 602", courseTitle: "Neurosurgery" },
    { courseCode: "SUR 603", courseTitle: "Urology" },
    { courseCode: "SUR 604", courseTitle: "Plastic & Reconstructive Surgery" },
    { courseCode: "SUR 605", courseTitle: "Paediatric Surgery" },
    { courseCode: "SUR 606", courseTitle: "Vascular Surgery" },
    { courseCode: "SUR 607", courseTitle: "Surgical Oncology" },
    // Other Specialties
    { courseCode: "OPH 601", courseTitle: "Ophthalmology" },
    { courseCode: "ENT 601", courseTitle: "Otorhinolaryngology (ENT)" },
    { courseCode: "ANA 601", courseTitle: "Anaesthesiology" },
    { courseCode: "RAD 601", courseTitle: "Radiology & Medical Imaging" },
    { courseCode: "RAD 602", courseTitle: "Nuclear Medicine" },
    { courseCode: "FOR 601", courseTitle: "Forensic Medicine & Toxicology" },
    { courseCode: "FOR 602", courseTitle: "Medical Ethics & Jurisprudence" },
    // Final Year Courses
    { courseCode: "PED 601", courseTitle: "Advanced Paediatrics" },
    { courseCode: "O&G 601", courseTitle: "Advanced Obstetrics" },
    { courseCode: "O&G 602", courseTitle: "Gynaecologic Oncology" },
    { courseCode: "COM 601", courseTitle: "Health Systems Management" },
    { courseCode: "COM 602", courseTitle: "Primary Health Care" },
    { courseCode: "COM 603", courseTitle: "Research Methodology" },
    // Clinical Clerkships
    { courseCode: "CLK 601", courseTitle: "Medicine Clerkship" },
    { courseCode: "CLK 602", courseTitle: "Surgery Clerkship" },
    { courseCode: "CLK 603", courseTitle: "Paediatrics Clerkship" },
    { courseCode: "CLK 604", courseTitle: "O&G Clerkship" },
  ],
};

// Combined structure for easy access
export const mbbsCourses = {
  preclinical: preclinicalCourses,
  clinical: clinicalCourses,
};

// Helper function to get all courses for a specific level and semester
// For clinical years (400-600), semester is ignored as they have year-long rotations
export function getCoursesForLevelAndSemester(level: string, semester?: "First" | "Second"): MBBSCourse[] {
  const numLevel = parseInt(level);
  
  if (numLevel <= 300) {
    // Preclinical: has semesters
    return preclinicalCourses[level]?.[semester || "First"] || [];
  } else {
    // Clinical: no semesters, return all courses for the year
    return clinicalCourses[level] || [];
  }
}

// Helper function to get all courses for a clinical level (no semester needed)
export function getClinicalCourses(level: string): MBBSCourse[] {
  return clinicalCourses[level] || [];
}

// Helper to determine if a level is preclinical or clinical
export function isPreclinical(level: string): boolean {
  const numLevel = parseInt(level);
  return numLevel <= 300;
}

// Get section name based on level
export function getSectionName(level: string): string {
  return isPreclinical(level) ? "Preclinical" : "Clinical";
}

// Check if level has semesters (only preclinical has semesters)
export function hasSemesters(level: string): boolean {
  return isPreclinical(level);
}
