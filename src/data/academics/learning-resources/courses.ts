import { Courses } from "../../../models/academics/learning-resources";

// MBBS Courses for Learning Resources - organized by level and semester
export const courses: Courses = {
  100: {
    First: {
      courseInfo: [
        {
          courseCode: "PHY 101",
          courseTitle: "General Physics I (Mechanics & Properties of Matter)",
          id: "PHY 101",
          tip: "Focus on understanding fundamental physics concepts. Practice problem-solving regularly and attend all lab sessions.",
        },
        {
          courseCode: "CHM 101",
          courseTitle: "General Chemistry I (Inorganic Chemistry)",
          id: "CHM 101",
          tip: "Build a strong foundation in atomic structure, periodic table, and chemical bonding. Essential for biochemistry later.",
        },
        {
          courseCode: "BIO 101",
          courseTitle: "General Biology I (Cell Biology)",
          id: "BIO 101",
          tip: "Master cell structure and function - this is crucial for understanding histology and pathology in clinical years.",
        },
        {
          courseCode: "MTH 101",
          courseTitle: "Elementary Mathematics I",
          id: "MTH 101",
          tip: "Mathematics is essential for biostatistics. Practice regularly and seek help early if struggling.",
        },
        {
          courseCode: "GST 101",
          courseTitle: "Use of English I",
          id: "GST 101",
          tip: "Good communication skills are essential for medical practice. Focus on academic writing and comprehension.",
        },
        {
          courseCode: "ANA 101",
          courseTitle: "Introduction to Anatomy",
          id: "ANA 101",
          tip: "Your first introduction to the human body. Start building anatomical vocabulary early.",
        },
      ],
    },
    Second: {
      courseInfo: [
        {
          courseCode: "PHY 102",
          courseTitle: "General Physics II (Electricity & Magnetism)",
          id: "PHY 102",
          tip: "Understanding electricity is important for understanding nerve impulses and cardiac physiology.",
        },
        {
          courseCode: "CHM 102",
          courseTitle: "General Chemistry II (Organic Chemistry)",
          id: "CHM 102",
          tip: "Organic chemistry is the foundation of biochemistry. Master functional groups and reaction mechanisms.",
        },
        {
          courseCode: "BIO 102",
          courseTitle: "General Biology II (Genetics)",
          id: "BIO 102",
          tip: "Genetics is increasingly important in medicine. Focus on Mendelian genetics and molecular genetics.",
        },
        {
          courseCode: "MTH 102",
          courseTitle: "Elementary Mathematics II",
          id: "MTH 102",
          tip: "Continue building mathematical skills for biostatistics and research methods.",
        },
        {
          courseCode: "BCH 101",
          courseTitle: "Introduction to Biochemistry",
          id: "BCH 101",
          tip: "Start understanding biological molecules - this is crucial for understanding metabolism and pharmacology.",
        },
        {
          courseCode: "GST 102",
          courseTitle: "Use of English II",
          id: "GST 102",
          tip: "Develop strong written and oral communication skills essential for patient interactions.",
        },
      ],
    },
  },
  200: {
    First: {
      courseInfo: [
        {
          courseCode: "ANA 201",
          courseTitle: "Gross Anatomy of Upper Limb",
          id: "ANA 201",
          tip: "Learn anatomy systematically. Use cadaveric dissection time wisely and correlate with clinical applications.",
        },
        {
          courseCode: "ANA 203",
          courseTitle: "Gross Anatomy of Thorax",
          id: "ANA 203",
          tip: "Master thoracic anatomy - crucial for understanding cardiopulmonary conditions and procedures.",
        },
        {
          courseCode: "ANA 205",
          courseTitle: "Histology I (Basic Tissues)",
          id: "ANA 205",
          tip: "Learn to identify tissues under microscopy. Regular practical sessions are essential.",
        },
        {
          courseCode: "PHY 201",
          courseTitle: "Human Physiology I (Cell Physiology)",
          id: "PHY 201",
          tip: "Understanding cell physiology is fundamental to all organ system physiology.",
        },
        {
          courseCode: "PHY 203",
          courseTitle: "Blood and Body Fluids Physiology",
          id: "PHY 203",
          tip: "Master hematology basics - important for understanding anemia, clotting disorders, and transfusion medicine.",
        },
        {
          courseCode: "BCH 201",
          courseTitle: "General Biochemistry I",
          id: "BCH 201",
          tip: "Build on chemistry knowledge to understand enzyme function and metabolic pathways.",
        },
        {
          courseCode: "BCH 203",
          courseTitle: "Chemistry of Carbohydrates",
          id: "BCH 203",
          tip: "Essential for understanding diabetes and energy metabolism.",
        },
      ],
    },
    Second: {
      courseInfo: [
        {
          courseCode: "ANA 202",
          courseTitle: "Gross Anatomy of Lower Limb",
          id: "ANA 202",
          tip: "Learn lower limb anatomy with clinical correlations - fractures, nerve injuries, and vascular conditions.",
        },
        {
          courseCode: "ANA 204",
          courseTitle: "Gross Anatomy of Abdomen & Pelvis",
          id: "ANA 204",
          tip: "Critical for understanding GI conditions, renal diseases, and reproductive anatomy.",
        },
        {
          courseCode: "ANA 206",
          courseTitle: "Histology II (Organ Systems)",
          id: "ANA 206",
          tip: "Connect tissue structure to organ function. Important for pathology understanding.",
        },
        {
          courseCode: "ANA 208",
          courseTitle: "Embryology I (General Embryology)",
          id: "ANA 208",
          tip: "Understanding development helps explain congenital anomalies and birth defects.",
        },
        {
          courseCode: "PHY 202",
          courseTitle: "Cardiovascular Physiology",
          id: "PHY 202",
          tip: "Master cardiac physiology - essential for understanding heart failure, arrhythmias, and hypertension.",
        },
        {
          courseCode: "PHY 204",
          courseTitle: "Respiratory Physiology",
          id: "PHY 204",
          tip: "Understand gas exchange and ventilation - crucial for managing respiratory conditions.",
        },
        {
          courseCode: "BCH 202",
          courseTitle: "General Biochemistry II",
          id: "BCH 202",
          tip: "Deepen understanding of molecular biology and its applications in medicine.",
        },
        {
          courseCode: "BCH 204",
          courseTitle: "Chemistry of Lipids and Proteins",
          id: "BCH 204",
          tip: "Essential for understanding atherosclerosis, lipid disorders, and nutritional biochemistry.",
        },
      ],
    },
  },
  300: {
    First: {
      courseInfo: [
        {
          courseCode: "ANA 301",
          courseTitle: "Neuroanatomy I",
          id: "ANA 301",
          tip: "Neuroanatomy is challenging but crucial. Learn systematically and use clinical cases to reinforce learning.",
        },
        {
          courseCode: "ANA 303",
          courseTitle: "Gross Anatomy of Head & Neck",
          id: "ANA 303",
          tip: "Complex region with many structures. Focus on layers, spaces, and clinical correlations.",
        },
        {
          courseCode: "ANA 305",
          courseTitle: "Embryology II (Systemic Embryology)",
          id: "ANA 305",
          tip: "Learn how each organ system develops - helps understand congenital malformations.",
        },
        {
          courseCode: "PHY 301",
          courseTitle: "Renal Physiology",
          id: "PHY 301",
          tip: "Master kidney function - essential for understanding fluid balance and kidney diseases.",
        },
        {
          courseCode: "PHY 303",
          courseTitle: "Gastrointestinal Physiology",
          id: "PHY 303",
          tip: "Understand digestion and absorption - important for GI conditions and nutritional medicine.",
        },
        {
          courseCode: "PHY 305",
          courseTitle: "Neurophysiology I",
          id: "PHY 305",
          tip: "Learn how the nervous system works - crucial for neurology and psychiatry.",
        },
        {
          courseCode: "BCH 301",
          courseTitle: "Enzymology",
          id: "BCH 301",
          tip: "Enzyme kinetics and mechanisms - foundation for understanding drug actions.",
        },
        {
          courseCode: "BCH 303",
          courseTitle: "Metabolism of Carbohydrates",
          id: "BCH 303",
          tip: "Master glycolysis, gluconeogenesis, and glycogen metabolism - essential for understanding diabetes.",
        },
      ],
    },
    Second: {
      courseInfo: [
        {
          courseCode: "ANA 302",
          courseTitle: "Neuroanatomy II",
          id: "ANA 302",
          tip: "Continue building neuroanatomy knowledge with clinical correlations.",
        },
        {
          courseCode: "ANA 304",
          courseTitle: "Histology III (Advanced)",
          id: "ANA 304",
          tip: "Advanced tissue study preparing you for pathology.",
        },
        {
          courseCode: "PHY 302",
          courseTitle: "Endocrine Physiology",
          id: "PHY 302",
          tip: "Hormones control many body functions - essential for understanding endocrine disorders.",
        },
        {
          courseCode: "PHY 304",
          courseTitle: "Reproductive Physiology",
          id: "PHY 304",
          tip: "Important for obstetrics, gynecology, and understanding infertility.",
        },
        {
          courseCode: "PHY 306",
          courseTitle: "Neurophysiology II",
          id: "PHY 306",
          tip: "Advanced nervous system function - prepare for clinical neurology.",
        },
        {
          courseCode: "BCH 302",
          courseTitle: "Metabolism of Lipids",
          id: "BCH 302",
          tip: "Understand fat metabolism - crucial for cardiovascular disease understanding.",
        },
        {
          courseCode: "BCH 304",
          courseTitle: "Metabolism of Proteins & Nucleic Acids",
          id: "BCH 304",
          tip: "Protein and DNA/RNA metabolism - important for understanding genetic disorders.",
        },
        {
          courseCode: "BCH 306",
          courseTitle: "Clinical Biochemistry",
          id: "BCH 306",
          tip: "Learn to interpret laboratory tests - directly applicable to clinical practice.",
        },
      ],
    },
  },
  400: {
    First: {
      courseInfo: [
        {
          courseCode: "PAT 401",
          courseTitle: "General Pathology I",
          id: "PAT 401",
          tip: "Foundation of understanding disease. Master cellular injury, inflammation, and healing.",
        },
        {
          courseCode: "PAT 403",
          courseTitle: "Systemic Pathology I",
          id: "PAT 403",
          tip: "Apply general pathology concepts to specific organ systems.",
        },
        {
          courseCode: "PHA 401",
          courseTitle: "General Pharmacology I",
          id: "PHA 401",
          tip: "Understand how drugs work - pharmacokinetics and pharmacodynamics are essential.",
        },
        {
          courseCode: "PHA 403",
          courseTitle: "Autonomic Pharmacology",
          id: "PHA 403",
          tip: "Learn drugs affecting the autonomic nervous system - widely used in clinical practice.",
        },
        {
          courseCode: "MIC 401",
          courseTitle: "General Microbiology",
          id: "MIC 401",
          tip: "Foundation for understanding infections. Master bacterial, viral, and fungal characteristics.",
        },
        {
          courseCode: "MIC 403",
          courseTitle: "Medical Bacteriology I",
          id: "MIC 403",
          tip: "Learn clinically important bacteria - their identification and treatment.",
        },
        {
          courseCode: "CHE 401",
          courseTitle: "Chemical Pathology I",
          id: "CHE 401",
          tip: "Learn to interpret biochemical tests in clinical context.",
        },
        {
          courseCode: "HAE 401",
          courseTitle: "Haematology I",
          id: "HAE 401",
          tip: "Master blood disorders - anemia, leukemia, and coagulation disorders.",
        },
      ],
    },
    Second: {
      courseInfo: [
        {
          courseCode: "PAT 402",
          courseTitle: "General Pathology II",
          id: "PAT 402",
          tip: "Continue building pathology knowledge with neoplasia and immunopathology.",
        },
        {
          courseCode: "PAT 404",
          courseTitle: "Systemic Pathology II",
          id: "PAT 404",
          tip: "Complete organ system pathology knowledge.",
        },
        {
          courseCode: "PHA 402",
          courseTitle: "General Pharmacology II",
          id: "PHA 402",
          tip: "Advanced pharmacology concepts and drug interactions.",
        },
        {
          courseCode: "PHA 404",
          courseTitle: "Cardiovascular Pharmacology",
          id: "PHA 404",
          tip: "Master cardiac drugs - essential for managing heart conditions.",
        },
        {
          courseCode: "MIC 402",
          courseTitle: "Medical Bacteriology II",
          id: "MIC 402",
          tip: "Continue learning about pathogenic bacteria and antibiotic therapy.",
        },
        {
          courseCode: "MIC 404",
          courseTitle: "Medical Virology",
          id: "MIC 404",
          tip: "Understand viral infections - increasingly important in modern medicine.",
        },
        {
          courseCode: "CHE 402",
          courseTitle: "Chemical Pathology II",
          id: "CHE 402",
          tip: "Advanced clinical chemistry and interpretation.",
        },
        {
          courseCode: "HAE 402",
          courseTitle: "Haematology II",
          id: "HAE 402",
          tip: "Advanced hematology including bone marrow disorders and transfusion medicine.",
        },
        {
          courseCode: "PAR 401",
          courseTitle: "Medical Parasitology",
          id: "PAR 401",
          tip: "Important in tropical medicine - learn common parasites and their treatment.",
        },
      ],
    },
  },
  500: {
    First: {
      courseInfo: [
        {
          courseCode: "MED 501",
          courseTitle: "Internal Medicine I (General Medicine)",
          id: "MED 501",
          tip: "First clinical rotation - learn systematic patient approach and clinical reasoning.",
        },
        {
          courseCode: "MED 503",
          courseTitle: "Cardiology",
          id: "MED 503",
          tip: "Master cardiovascular examination and common cardiac conditions.",
        },
        {
          courseCode: "MED 505",
          courseTitle: "Pulmonology",
          id: "MED 505",
          tip: "Learn respiratory diseases - very common in clinical practice.",
        },
        {
          courseCode: "SUR 501",
          courseTitle: "General Surgery I",
          id: "SUR 501",
          tip: "Learn surgical principles, pre-op and post-op care, and common surgical conditions.",
        },
        {
          courseCode: "SUR 503",
          courseTitle: "Surgical Techniques",
          id: "SUR 503",
          tip: "Hands-on surgical skills - suturing, wound care, and basic procedures.",
        },
        {
          courseCode: "PED 501",
          courseTitle: "Paediatrics I",
          id: "PED 501",
          tip: "Learn to approach the pediatric patient - different from adults.",
        },
        {
          courseCode: "O&G 501",
          courseTitle: "Obstetrics I",
          id: "O&G 501",
          tip: "Learn normal pregnancy, labor, and delivery management.",
        },
        {
          courseCode: "PSY 501",
          courseTitle: "Psychiatry I",
          id: "PSY 501",
          tip: "Mental health is important - learn psychiatric assessment and common disorders.",
        },
        {
          courseCode: "COM 501",
          courseTitle: "Community Medicine I (Epidemiology)",
          id: "COM 501",
          tip: "Learn public health principles and research methodology.",
        },
      ],
    },
    Second: {
      courseInfo: [
        {
          courseCode: "MED 502",
          courseTitle: "Internal Medicine II (Gastroenterology)",
          id: "MED 502",
          tip: "Master GI conditions - very common in clinical practice.",
        },
        {
          courseCode: "MED 504",
          courseTitle: "Nephrology",
          id: "MED 504",
          tip: "Learn kidney diseases and their management.",
        },
        {
          courseCode: "MED 506",
          courseTitle: "Neurology",
          id: "MED 506",
          tip: "Apply neuroanatomy knowledge - learn systematic neurological examination.",
        },
        {
          courseCode: "SUR 502",
          courseTitle: "General Surgery II",
          id: "SUR 502",
          tip: "Continue building surgical knowledge and skills.",
        },
        {
          courseCode: "SUR 504",
          courseTitle: "Orthopaedic Surgery",
          id: "SUR 504",
          tip: "Learn musculoskeletal conditions - fractures, arthritis, and sports medicine.",
        },
        {
          courseCode: "PED 502",
          courseTitle: "Paediatrics II (Neonatology)",
          id: "PED 502",
          tip: "Learn newborn care and common neonatal conditions.",
        },
        {
          courseCode: "O&G 502",
          courseTitle: "Gynaecology I",
          id: "O&G 502",
          tip: "Learn gynecological conditions and their management.",
        },
        {
          courseCode: "PSY 502",
          courseTitle: "Psychiatry II",
          id: "PSY 502",
          tip: "Advanced psychiatry including psychotherapy and psychopharmacology.",
        },
        {
          courseCode: "COM 502",
          courseTitle: "Community Medicine II (Public Health)",
          id: "COM 502",
          tip: "Learn health policy and community health programs.",
        },
      ],
    },
  },
  600: {
    First: {
      courseInfo: [
        {
          courseCode: "MED 601",
          courseTitle: "Internal Medicine III (Endocrinology)",
          id: "MED 601",
          tip: "Master endocrine disorders - diabetes management is especially important.",
        },
        {
          courseCode: "MED 603",
          courseTitle: "Haematology/Oncology",
          id: "MED 603",
          tip: "Learn blood cancers and solid tumors - important for modern medicine.",
        },
        {
          courseCode: "MED 605",
          courseTitle: "Infectious Diseases",
          id: "MED 605",
          tip: "Apply microbiology knowledge - learn to manage complex infections.",
        },
        {
          courseCode: "SUR 601",
          courseTitle: "Cardiothoracic Surgery",
          id: "SUR 601",
          tip: "Advanced surgical specialty - learn heart and lung surgery basics.",
        },
        {
          courseCode: "SUR 603",
          courseTitle: "Neurosurgery",
          id: "SUR 603",
          tip: "Learn neurosurgical conditions and their management.",
        },
        {
          courseCode: "SUR 605",
          courseTitle: "Urology",
          id: "SUR 605",
          tip: "Learn urological conditions - very common in practice.",
        },
        {
          courseCode: "PED 601",
          courseTitle: "Paediatrics III (Emergencies)",
          id: "PED 601",
          tip: "Learn pediatric emergencies - critical skills for saving young lives.",
        },
        {
          courseCode: "O&G 601",
          courseTitle: "Obstetrics II (High Risk Pregnancy)",
          id: "O&G 601",
          tip: "Learn to manage complicated pregnancies and obstetric emergencies.",
        },
        {
          courseCode: "OPH 601",
          courseTitle: "Ophthalmology",
          id: "OPH 601",
          tip: "Learn eye examination and common eye conditions.",
        },
        {
          courseCode: "ENT 601",
          courseTitle: "Otorhinolaryngology (ENT)",
          id: "ENT 601",
          tip: "Learn ear, nose, and throat conditions - very common in primary care.",
        },
      ],
    },
    Second: {
      courseInfo: [
        {
          courseCode: "MED 602",
          courseTitle: "Internal Medicine IV (Dermatology)",
          id: "MED 602",
          tip: "Learn skin conditions - common in all medical practice.",
        },
        {
          courseCode: "MED 604",
          courseTitle: "Geriatric Medicine",
          id: "MED 604",
          tip: "Learn care of elderly patients - increasingly important as population ages.",
        },
        {
          courseCode: "SUR 602",
          courseTitle: "Plastic & Reconstructive Surgery",
          id: "SUR 602",
          tip: "Learn wound healing and reconstructive principles.",
        },
        {
          courseCode: "SUR 604",
          courseTitle: "Paediatric Surgery",
          id: "SUR 604",
          tip: "Learn surgical conditions in children.",
        },
        {
          courseCode: "PED 602",
          courseTitle: "Paediatrics IV (Adolescent Health)",
          id: "PED 602",
          tip: "Learn care of adolescents - unique challenges and conditions.",
        },
        {
          courseCode: "O&G 602",
          courseTitle: "Gynaecology II (Gynaecologic Oncology)",
          id: "O&G 602",
          tip: "Learn gynecological cancers and their management.",
        },
        {
          courseCode: "ANA 601",
          courseTitle: "Anaesthesiology",
          id: "ANA 601",
          tip: "Learn anesthesia principles and perioperative care.",
        },
        {
          courseCode: "RAD 601",
          courseTitle: "Radiology & Imaging",
          id: "RAD 601",
          tip: "Learn to interpret medical images - essential diagnostic skill.",
        },
        {
          courseCode: "COM 601",
          courseTitle: "Community Medicine III (Health Management)",
          id: "COM 601",
          tip: "Learn healthcare administration and management.",
        },
        {
          courseCode: "FOR 601",
          courseTitle: "Forensic Medicine & Toxicology",
          id: "FOR 601",
          tip: "Learn medicolegal aspects of medicine and toxicology.",
        },
      ],
    },
  },
};
