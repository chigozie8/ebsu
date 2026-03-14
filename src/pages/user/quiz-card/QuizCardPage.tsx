/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
  label: string; // "A" | "B" | "C" | "D"
  text: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: Option[];
  correctAnswer: string; // label e.g. "B"
  explanation: string;
  subject: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

type QuizMode = "setup" | "quiz" | "review" | "results";

// ─── Sample Medical Questions Bank ───────────────────────────────────────────

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 1,
    question: "Which of the following is the primary site of erythropoietin production in adults?",
    options: [
      { label: "A", text: "Liver" },
      { label: "B", text: "Spleen" },
      { label: "C", text: "Kidney (peritubular cells)" },
      { label: "D", text: "Bone marrow" },
    ],
    correctAnswer: "C",
    explanation: "In adults, erythropoietin (EPO) is primarily produced by peritubular fibroblast-like cells in the renal cortex in response to hypoxia. The liver is the primary source in fetal life.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 2,
    question: "The blood-brain barrier is formed primarily by tight junctions between which cells?",
    options: [
      { label: "A", text: "Astrocytes" },
      { label: "B", text: "Brain capillary endothelial cells" },
      { label: "C", text: "Pericytes" },
      { label: "D", text: "Microglia" },
    ],
    correctAnswer: "B",
    explanation: "The blood-brain barrier is primarily formed by tight junctions (zona occludens) between brain capillary endothelial cells. Astrocytes and pericytes support and regulate the BBB but do not form the actual barrier.",
    subject: "Anatomy",
    difficulty: "Medium",
  },
  {
    id: 3,
    question: "Which enzyme is deficient in Phenylketonuria (PKU)?",
    options: [
      { label: "A", text: "Tyrosinase" },
      { label: "B", text: "Homogentisate oxidase" },
      { label: "C", text: "Phenylalanine hydroxylase" },
      { label: "D", text: "Fumarylacetoacetate hydrolase" },
    ],
    correctAnswer: "C",
    explanation: "PKU is caused by deficiency of phenylalanine hydroxylase (PAH), which converts phenylalanine to tyrosine. The accumulation of phenylalanine leads to intellectual disability if untreated.",
    subject: "Biochemistry",
    difficulty: "Easy",
  },
  {
    id: 4,
    question: "A patient presents with a deep laceration on the medial aspect of the elbow. Which structure is most at risk?",
    options: [
      { label: "A", text: "Radial nerve" },
      { label: "B", text: "Ulnar nerve" },
      { label: "C", text: "Median nerve" },
      { label: "D", text: "Musculocutaneous nerve" },
    ],
    correctAnswer: "B",
    explanation: "The ulnar nerve passes behind the medial epicondyle of the humerus through the cubital tunnel, making it highly vulnerable to injury from lacerations on the medial aspect of the elbow.",
    subject: "Anatomy",
    difficulty: "Easy",
  },
  {
    id: 5,
    question: "Which phase of the cardiac cycle has the longest duration under normal resting conditions?",
    options: [
      { label: "A", text: "Isovolumetric contraction" },
      { label: "B", text: "Ventricular ejection" },
      { label: "C", text: "Diastole (ventricular relaxation & filling)" },
      { label: "D", text: "Isovolumetric relaxation" },
    ],
    correctAnswer: "C",
    explanation: "At rest (HR ~75 bpm), the cardiac cycle lasts ~0.8 s. Diastole occupies ~0.5 s (~63%) while systole occupies ~0.3 s. Diastole is the longest phase and is the first to shorten during tachycardia.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 6,
    question: "Warfarin inhibits which of the following?",
    options: [
      { label: "A", text: "Thrombin directly" },
      { label: "B", text: "Vitamin K epoxide reductase" },
      { label: "C", text: "Factor Xa directly" },
      { label: "D", text: "Platelet aggregation via COX-1" },
    ],
    correctAnswer: "B",
    explanation: "Warfarin inhibits Vitamin K epoxide reductase (VKORC1), preventing the recycling of Vitamin K. This leads to functional deficiency of Vitamin K-dependent clotting factors (II, VII, IX, X) and anticoagulants (Protein C, S).",
    subject: "Pharmacology",
    difficulty: "Hard",
  },
  {
    id: 7,
    question: "The Cori cycle involves transfer of which substrate from muscle to liver?",
    options: [
      { label: "A", text: "Glucose" },
      { label: "B", text: "Pyruvate" },
      { label: "C", text: "Lactate" },
      { label: "D", text: "Alanine" },
    ],
    correctAnswer: "C",
    explanation: "In the Cori cycle, lactate produced by anaerobic glycolysis in muscle is transported to the liver where it is converted back to glucose via gluconeogenesis. The glucose is then recycled back to muscle.",
    subject: "Biochemistry",
    difficulty: "Medium",
  },
  {
    id: 8,
    question: "Which cranial nerve carries parasympathetic fibers to the parotid gland?",
    options: [
      { label: "A", text: "CN VII (Facial nerve)" },
      { label: "B", text: "CN IX (Glossopharyngeal nerve)" },
      { label: "C", text: "CN X (Vagus nerve)" },
      { label: "D", text: "CN V3 (Mandibular division of trigeminal)" },
    ],
    correctAnswer: "B",
    explanation: "The glossopharyngeal nerve (CN IX) carries preganglionic parasympathetic fibers that synapse in the otic ganglion. Postganglionic fibers then travel via the auriculotemporal nerve (CN V3) to innervate the parotid gland.",
    subject: "Anatomy",
    difficulty: "Hard",
  },
  {
    id: 9,
    question: "Which of the following is a classic finding in nephrotic syndrome but NOT nephritic syndrome?",
    options: [
      { label: "A", text: "Haematuria" },
      { label: "B", text: "Hypertension" },
      { label: "C", text: "Massive proteinuria (>3.5 g/day)" },
      { label: "D", text: "Oliguria" },
    ],
    correctAnswer: "C",
    explanation: "Massive proteinuria (>3.5 g/day) is the hallmark of nephrotic syndrome causing hypoalbuminaemia, oedema, and hyperlipidaemia. Haematuria, hypertension, and oliguria are more characteristic of nephritic syndrome.",
    subject: "Pathology",
    difficulty: "Medium",
  },
  {
    id: 10,
    question: "The sinoatrial (SA) node is predominantly supplied by which artery?",
    options: [
      { label: "A", text: "Left anterior descending (LAD)" },
      { label: "B", text: "Left circumflex artery" },
      { label: "C", text: "Right coronary artery (RCA)" },
      { label: "D", text: "Posterior descending artery" },
    ],
    correctAnswer: "C",
    explanation: "The SA node is supplied by the SA nodal artery, which arises from the right coronary artery (RCA) in about 60% of people and from the left circumflex artery in about 40%. RCA occlusion can cause sinus bradycardia.",
    subject: "Anatomy",
    difficulty: "Hard",
  },
  {
    id: 11,
    question: "Which of the following is the mechanism of action of metformin?",
    options: [
      { label: "A", text: "Stimulates insulin secretion from beta cells" },
      { label: "B", text: "Activates AMPK, reducing hepatic gluconeogenesis" },
      { label: "C", text: "Inhibits alpha-glucosidase in the intestine" },
      { label: "D", text: "Increases insulin sensitivity via PPAR-gamma" },
    ],
    correctAnswer: "B",
    explanation: "Metformin activates AMP-activated protein kinase (AMPK) which primarily reduces hepatic gluconeogenesis. It also improves peripheral insulin sensitivity. It does NOT stimulate insulin secretion and therefore does not cause hypoglycaemia.",
    subject: "Pharmacology",
    difficulty: "Medium",
  },
  {
    id: 12,
    question: "Which cell is the primary antigen-presenting cell in the adaptive immune response?",
    options: [
      { label: "A", text: "B lymphocyte" },
      { label: "B", text: "Neutrophil" },
      { label: "C", text: "Dendritic cell" },
      { label: "D", text: "Natural killer cell" },
    ],
    correctAnswer: "C",
    explanation: "Dendritic cells are the most potent professional antigen-presenting cells (APCs). They capture antigens in peripheral tissues, migrate to lymph nodes, and present processed antigens via MHC class II to naive T helper cells, initiating the adaptive immune response.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 13,
    question: "A patient has a fracture of the surgical neck of the humerus. Which nerve is most likely damaged?",
    options: [
      { label: "A", text: "Radial nerve" },
      { label: "B", text: "Ulnar nerve" },
      { label: "C", text: "Axillary nerve" },
      { label: "D", text: "Musculocutaneous nerve" },
    ],
    correctAnswer: "C",
    explanation: "The axillary nerve winds around the surgical neck of the humerus in the quadrangular space. Fracture of the surgical neck can injure it, causing paralysis of the deltoid (loss of shoulder abduction) and loss of sensation over the 'regimental badge' area.",
    subject: "Anatomy",
    difficulty: "Medium",
  },
  {
    id: 14,
    question: "Which of the following correctly describes the action potential in a cardiac ventricular myocyte?",
    options: [
      { label: "A", text: "Phase 0 is due to slow calcium influx" },
      { label: "B", text: "Phase 2 (plateau) is due to balanced Ca2+ influx and K+ efflux" },
      { label: "C", text: "Phase 4 is characterized by rapid spontaneous depolarization" },
      { label: "D", text: "Repolarization is driven by Na+ influx" },
    ],
    correctAnswer: "B",
    explanation: "The plateau (Phase 2) of the ventricular action potential results from a balance between inward L-type Ca2+ current and outward K+ current. Phase 0 is from rapid Na+ influx; Phase 4 is stable (not spontaneous like pacemaker cells); repolarization is K+ efflux.",
    subject: "Physiology",
    difficulty: "Hard",
  },
  {
    id: 15,
    question: "Which amino acid is the precursor for catecholamine synthesis?",
    options: [
      { label: "A", text: "Tryptophan" },
      { label: "B", text: "Tyrosine" },
      { label: "C", text: "Histidine" },
      { label: "D", text: "Glutamate" },
    ],
    correctAnswer: "B",
    explanation: "Tyrosine is the precursor for catecholamine synthesis (dopamine, noradrenaline, adrenaline). It is hydroxylated by tyrosine hydroxylase to DOPA, the rate-limiting step. Tryptophan is the precursor for serotonin and melatonin.",
    subject: "Biochemistry",
    difficulty: "Easy",
  },
  {
    id: 16,
    question: "Which of the following is a first-line treatment for status epilepticus?",
    options: [
      { label: "A", text: "Phenytoin IV" },
      { label: "B", text: "Lorazepam IV" },
      { label: "C", text: "Carbamazepine oral" },
      { label: "D", text: "Sodium valproate oral" },
    ],
    correctAnswer: "B",
    explanation: "IV benzodiazepines (lorazepam or diazepam) are the first-line treatment for status epilepticus. They enhance GABA activity and terminate seizures rapidly. Phenytoin/fosphenytoin is used as second-line if benzodiazepines fail.",
    subject: "Pharmacology",
    difficulty: "Easy",
  },
  {
    id: 17,
    question: "In the nephron, where does the majority of sodium reabsorption occur?",
    options: [
      { label: "A", text: "Proximal convoluted tubule (PCT)" },
      { label: "B", text: "Loop of Henle (descending limb)" },
      { label: "C", text: "Distal convoluted tubule (DCT)" },
      { label: "D", text: "Collecting duct" },
    ],
    correctAnswer: "A",
    explanation: "About 65-70% of filtered sodium is reabsorbed in the proximal convoluted tubule (PCT), driven by the Na+/K+ ATPase on the basolateral membrane. The loop of Henle reabsorbs ~25% and the DCT/collecting duct fine-tunes the remainder.",
    subject: "Physiology",
    difficulty: "Easy",
  },
  {
    id: 18,
    question: "Which type of necrosis is classically seen in myocardial infarction?",
    options: [
      { label: "A", text: "Liquefactive necrosis" },
      { label: "B", text: "Caseous necrosis" },
      { label: "C", text: "Coagulative necrosis" },
      { label: "D", text: "Fat necrosis" },
    ],
    correctAnswer: "C",
    explanation: "Coagulative necrosis is the classic pattern in myocardial infarction and most solid organ infarcts (except brain). Cellular architecture is preserved but cells are dead. Liquefactive necrosis is typical of brain infarcts and bacterial abscesses.",
    subject: "Pathology",
    difficulty: "Easy",
  },
  {
    id: 19,
    question: "Which clotting factor is shared between the intrinsic and extrinsic coagulation pathways?",
    options: [
      { label: "A", text: "Factor VII" },
      { label: "B", text: "Factor VIII" },
      { label: "C", text: "Factor X" },
      { label: "D", text: "Factor XII" },
    ],
    correctAnswer: "C",
    explanation: "Factor X (Stuart-Prower factor) is the convergence point of both the intrinsic (contact) and extrinsic (tissue factor) pathways. Both pathways activate Factor X, which then forms the prothrombinase complex with Factor Va to convert prothrombin to thrombin.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 20,
    question: "Which of the following correctly pairs a drug with its mechanism causing agranulocytosis?",
    options: [
      { label: "A", text: "Clozapine — bone marrow suppression" },
      { label: "B", text: "Penicillin — direct neutrophil toxicity" },
      { label: "C", text: "Metformin — myelosuppression" },
      { label: "D", text: "Aspirin — immune complex deposition" },
    ],
    correctAnswer: "A",
    explanation: "Clozapine (atypical antipsychotic) is notorious for causing agranulocytosis via bone marrow suppression. Patients must have mandatory weekly WBC monitoring. This is its most serious adverse effect and reason for restricted use.",
    subject: "Pharmacology",
    difficulty: "Hard",
  },
  {
    id: 21,
    question: "The foramen ovale closes after birth due to which mechanism?",
    options: [
      { label: "A", text: "Increased left atrial pressure due to lung expansion" },
      { label: "B", text: "Decreased right atrial pressure from reduced venous return" },
      { label: "C", text: "Constriction of the ductus arteriosus" },
      { label: "D", text: "Closure of the umbilical arteries" },
    ],
    correctAnswer: "A",
    explanation: "At birth, lung expansion causes pulmonary vascular resistance to fall, increasing left atrial pressure above right atrial pressure. This pressure reversal pushes the septum primum against the septum secundum, functionally closing the foramen ovale.",
    subject: "Anatomy",
    difficulty: "Hard",
  },
  {
    id: 22,
    question: "Which laboratory finding is most characteristic of disseminated intravascular coagulation (DIC)?",
    options: [
      { label: "A", text: "Elevated fibrinogen" },
      { label: "B", text: "Elevated D-dimer with prolonged PT and APTT" },
      { label: "C", text: "Isolated thrombocytopenia with normal coagulation" },
      { label: "D", text: "Elevated platelet count" },
    ],
    correctAnswer: "B",
    explanation: "DIC is characterized by simultaneous activation of coagulation and fibrinolysis. Classic findings include elevated D-dimer (fibrin degradation), prolonged PT and APTT (consumption of clotting factors), low fibrinogen, and thrombocytopenia.",
    subject: "Pathology",
    difficulty: "Hard",
  },
  {
    id: 23,
    question: "Which vitamin is essential for gamma-carboxylation of clotting factors II, VII, IX and X?",
    options: [
      { label: "A", text: "Vitamin C" },
      { label: "B", text: "Vitamin D" },
      { label: "C", text: "Vitamin K" },
      { label: "D", text: "Vitamin B12" },
    ],
    correctAnswer: "C",
    explanation: "Vitamin K is required as a cofactor for gamma-carboxylation of clotting factors II (prothrombin), VII, IX, and X, as well as Protein C and S. Carboxylation allows these factors to bind calcium and phospholipid surfaces, activating them.",
    subject: "Biochemistry",
    difficulty: "Easy",
  },
  {
    id: 24,
    question: "Which cranial nerve is tested by the corneal reflex (afferent limb)?",
    options: [
      { label: "A", text: "CN II" },
      { label: "B", text: "CN V1 (Ophthalmic)" },
      { label: "C", text: "CN VII" },
      { label: "D", text: "CN III" },
    ],
    correctAnswer: "B",
    explanation: "The afferent limb of the corneal reflex is CN V1 (ophthalmic branch of trigeminal nerve), which carries sensation from the cornea. The efferent limb is CN VII (facial nerve), which causes the blink response via orbicularis oculi.",
    subject: "Anatomy",
    difficulty: "Medium",
  },
  {
    id: 25,
    question: "Which of the following is the most common cause of community-acquired pneumonia (CAP) in adults?",
    options: [
      { label: "A", text: "Haemophilus influenzae" },
      { label: "B", text: "Klebsiella pneumoniae" },
      { label: "C", text: "Streptococcus pneumoniae" },
      { label: "D", text: "Mycoplasma pneumoniae" },
    ],
    correctAnswer: "C",
    explanation: "Streptococcus pneumoniae (pneumococcus) is the most common cause of community-acquired pneumonia in adults worldwide. It presents classically with lobar consolidation, productive cough, fever, and pleuritic chest pain.",
    subject: "Pathology",
    difficulty: "Easy",
  },
  {
    id: 26,
    question: "Which enzyme converts angiotensin I to angiotensin II?",
    options: [
      { label: "A", text: "Renin" },
      { label: "B", text: "Aldosterone synthase" },
      { label: "C", text: "Angiotensin-converting enzyme (ACE)" },
      { label: "D", text: "Chymase" },
    ],
    correctAnswer: "C",
    explanation: "ACE (Angiotensin-Converting Enzyme) converts angiotensin I to the active angiotensin II. It is located mainly in the pulmonary endothelium. ACE inhibitors (e.g., ramipril) block this step and are used to treat hypertension and heart failure.",
    subject: "Physiology",
    difficulty: "Easy",
  },
  {
    id: 27,
    question: "Which of the following drugs is a selective serotonin reuptake inhibitor (SSRI)?",
    options: [
      { label: "A", text: "Amitriptyline" },
      { label: "B", text: "Fluoxetine" },
      { label: "C", text: "Venlafaxine" },
      { label: "D", text: "Mirtazapine" },
    ],
    correctAnswer: "B",
    explanation: "Fluoxetine (Prozac) is a classic SSRI that selectively inhibits the reuptake of serotonin (5-HT) into the presynaptic neuron. Amitriptyline is a TCA, venlafaxine is an SNRI, and mirtazapine is a NaSSA (noradrenergic and specific serotonergic antidepressant).",
    subject: "Pharmacology",
    difficulty: "Easy",
  },
  {
    id: 28,
    question: "The zona glomerulosa of the adrenal cortex primarily produces which hormone?",
    options: [
      { label: "A", text: "Cortisol" },
      { label: "B", text: "Androgens (DHEA)" },
      { label: "C", text: "Aldosterone" },
      { label: "D", text: "Adrenaline (epinephrine)" },
    ],
    correctAnswer: "C",
    explanation: "The adrenal cortex has three zones: zona glomerulosa (outer) produces aldosterone; zona fasciculata (middle) produces cortisol; zona reticularis (inner) produces androgens. Adrenaline is produced by the adrenal medulla, not the cortex. Mnemonic: GFR = Salt, Sugar, Sex.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 29,
    question: "Which genetic mutation is most commonly associated with sickle cell disease?",
    options: [
      { label: "A", text: "Deletion of alpha-globin genes" },
      { label: "B", text: "Point mutation: Glutamate → Valine at position 6 of beta-globin" },
      { label: "C", text: "Insertion in exon 11 of the HBB gene" },
      { label: "D", text: "Trinucleotide repeat expansion in HBB" },
    ],
    correctAnswer: "B",
    explanation: "Sickle cell disease is caused by a single-nucleotide point mutation in the HBB gene (GAG → GTG), resulting in substitution of glutamic acid with valine at position 6 of the beta-globin chain. This produces HbS which polymerizes under hypoxia.",
    subject: "Biochemistry",
    difficulty: "Medium",
  },
  {
    id: 30,
    question: "Which of the following is the classic triad of Cushing's syndrome?",
    options: [
      { label: "A", text: "Moon face, buffalo hump, central obesity" },
      { label: "B", text: "Tremor, bradycardia, weight gain" },
      { label: "C", text: "Hypotension, hypoglycaemia, hyperkalemia" },
      { label: "D", text: "Polyuria, polydipsia, polyphagia" },
    ],
    correctAnswer: "A",
    explanation: "Cushing's syndrome (excess cortisol) classically presents with moon face (facial rounding), buffalo hump (dorsocervical fat pad), and central (truncal) obesity. Other features include purple striae, hypertension, diabetes, osteoporosis, and immunosuppression.",
    subject: "Physiology",
    difficulty: "Easy",
  },
  {
    id: 31,
    question: "Which of the following best describes the mechanism of penicillin?",
    options: [
      { label: "A", text: "Inhibits 30S ribosomal subunit" },
      { label: "B", text: "Inhibits bacterial DNA gyrase" },
      { label: "C", text: "Inhibits cell wall synthesis by binding PBPs" },
      { label: "D", text: "Disrupts the cell membrane" },
    ],
    correctAnswer: "C",
    explanation: "Penicillins are beta-lactam antibiotics that inhibit bacterial cell wall synthesis by irreversibly binding to penicillin-binding proteins (PBPs), which are transpeptidases responsible for cross-linking peptidoglycan chains in the bacterial cell wall.",
    subject: "Pharmacology",
    difficulty: "Easy",
  },
  {
    id: 32,
    question: "Which hepatitis virus is transmitted via the feco-oral route?",
    options: [
      { label: "A", text: "Hepatitis B" },
      { label: "B", text: "Hepatitis C" },
      { label: "C", text: "Hepatitis A" },
      { label: "D", text: "Hepatitis D" },
    ],
    correctAnswer: "C",
    explanation: "Hepatitis A (and E) are transmitted via the feco-oral route (contaminated food/water). Hepatitis B, C, and D are transmitted parenterally (blood, sexual contact, vertical transmission). Hepatitis A does not cause chronic infection.",
    subject: "Pathology",
    difficulty: "Easy",
  },
  {
    id: 33,
    question: "The Circle of Willis is formed by anastomoses between which two major arterial systems?",
    options: [
      { label: "A", text: "Vertebral and external carotid arteries" },
      { label: "B", text: "Internal carotid and vertebrobasilar arteries" },
      { label: "C", text: "External carotid and subclavian arteries" },
      { label: "D", text: "Internal carotid and facial arteries" },
    ],
    correctAnswer: "B",
    explanation: "The Circle of Willis connects the internal carotid arterial system (anterior circulation) with the vertebrobasilar arterial system (posterior circulation) via the posterior communicating arteries, providing collateral blood supply to the brain.",
    subject: "Anatomy",
    difficulty: "Medium",
  },
  {
    id: 34,
    question: "Which of the following is the first-line drug for treating type 2 diabetes mellitus in a non-obese patient with no contraindications?",
    options: [
      { label: "A", text: "Glibenclamide" },
      { label: "B", text: "Insulin glargine" },
      { label: "C", text: "Metformin" },
      { label: "D", text: "Sitagliptin" },
    ],
    correctAnswer: "C",
    explanation: "Metformin remains the universally recommended first-line pharmacotherapy for type 2 diabetes mellitus in all patients (obese and non-obese) unless contraindicated. It is preferred due to its efficacy, safety, low cost, and cardiovascular benefits.",
    subject: "Pharmacology",
    difficulty: "Easy",
  },
  {
    id: 35,
    question: "Activation of the complement system by antigen-antibody complexes occurs via which pathway?",
    options: [
      { label: "A", text: "Alternative pathway" },
      { label: "B", text: "Lectin pathway" },
      { label: "C", text: "Classical pathway" },
      { label: "D", text: "Terminal pathway" },
    ],
    correctAnswer: "C",
    explanation: "The classical pathway is activated when C1q binds to antigen-antibody (IgG or IgM) complexes. The alternative pathway is activated by microbial surfaces. The lectin pathway is activated by mannose-binding lectin binding to microbial carbohydrates.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 36,
    question: "Which of the following is NOT a feature of lower motor neuron (LMN) lesion?",
    options: [
      { label: "A", text: "Flaccid paralysis" },
      { label: "B", text: "Fasciculations" },
      { label: "C", text: "Spasticity" },
      { label: "D", text: "Hyporeflexia" },
    ],
    correctAnswer: "C",
    explanation: "Spasticity (increased tone, hyperreflexia, clonus) is a feature of UPPER motor neuron (UMN) lesions. LMN lesions cause flaccid paralysis, hypotonia, hyporeflexia, fasciculations, fibrillations, and muscle atrophy (denervation atrophy).",
    subject: "Anatomy",
    difficulty: "Medium",
  },
  {
    id: 37,
    question: "Which enzyme is the rate-limiting step in cholesterol biosynthesis?",
    options: [
      { label: "A", text: "Squalene synthase" },
      { label: "B", text: "HMG-CoA reductase" },
      { label: "C", text: "Mevalonate kinase" },
      { label: "D", text: "Lanosterol synthase" },
    ],
    correctAnswer: "B",
    explanation: "HMG-CoA reductase (3-hydroxy-3-methylglutaryl-CoA reductase) is the rate-limiting enzyme in cholesterol biosynthesis. It converts HMG-CoA to mevalonate. Statins (e.g., atorvastatin) competitively inhibit this enzyme to lower plasma cholesterol.",
    subject: "Biochemistry",
    difficulty: "Medium",
  },
  {
    id: 38,
    question: "A patient with long-standing rheumatoid arthritis develops proteinuria. Which complication has most likely occurred?",
    options: [
      { label: "A", text: "Membranous nephropathy" },
      { label: "B", text: "AA amyloidosis" },
      { label: "C", text: "IgA nephropathy" },
      { label: "D", text: "Minimal change disease" },
    ],
    correctAnswer: "B",
    explanation: "Chronic inflammatory diseases like rheumatoid arthritis cause overproduction of SAA (serum amyloid A) protein. SAA fragments deposit as AA amyloid in the kidneys (glomeruli), causing nephrotic-range proteinuria. This is a common cause of secondary amyloidosis.",
    subject: "Pathology",
    difficulty: "Hard",
  },
  {
    id: 39,
    question: "The brachial plexus is formed from which spinal nerve roots?",
    options: [
      { label: "A", text: "C4–C8" },
      { label: "B", text: "C5–T1" },
      { label: "C", text: "C4–T2" },
      { label: "D", text: "C6–T2" },
    ],
    correctAnswer: "B",
    explanation: "The brachial plexus is formed by the ventral rami of spinal nerve roots C5, C6, C7, C8, and T1. These roots merge to form trunks (upper, middle, lower), divisions, cords (lateral, posterior, medial), and terminal branches supplying the upper limb.",
    subject: "Anatomy",
    difficulty: "Medium",
  },
  {
    id: 40,
    question: "Which of the following correctly describes the oxygen-haemoglobin dissociation curve shift to the right?",
    options: [
      { label: "A", text: "Increased pH, decreased pCO2, decreased temperature" },
      { label: "B", text: "Decreased pH, increased pCO2, increased temperature, increased 2,3-DPG" },
      { label: "C", text: "Increased pH, increased pCO2, increased oxygen" },
      { label: "D", text: "Decreased pCO2, decreased temperature, decreased 2,3-DPG" },
    ],
    correctAnswer: "B",
    explanation: "A rightward shift of the O2-Hb curve means reduced O2 affinity (more O2 unloaded to tissues). Causes: decreased pH (acidosis — Bohr effect), increased pCO2, increased temperature, and increased 2,3-DPG (as in anaemia and high altitude).",
    subject: "Physiology",
    difficulty: "Hard",
  },
  {
    id: 41,
    question: "Which type of hypersensitivity reaction is responsible for anaphylaxis?",
    options: [
      { label: "A", text: "Type I (IgE-mediated)" },
      { label: "B", text: "Type II (cytotoxic)" },
      { label: "C", text: "Type III (immune complex)" },
      { label: "D", text: "Type IV (delayed/cell-mediated)" },
    ],
    correctAnswer: "A",
    explanation: "Anaphylaxis is a Type I (immediate) hypersensitivity reaction mediated by IgE antibodies bound to mast cells and basophils. Re-exposure to the allergen cross-links IgE, causing massive release of histamine, prostaglandins, and leukotrienes.",
    subject: "Pathology",
    difficulty: "Easy",
  },
  {
    id: 42,
    question: "Which of the following is the antidote for paracetamol (acetaminophen) overdose?",
    options: [
      { label: "A", text: "Flumazenil" },
      { label: "B", text: "N-acetylcysteine (NAC)" },
      { label: "C", text: "Naloxone" },
      { label: "D", text: "Atropine" },
    ],
    correctAnswer: "B",
    explanation: "N-acetylcysteine (NAC) is the antidote for paracetamol overdose. It replenishes glutathione stores, which conjugate the toxic metabolite NAPQI (N-acetyl-p-benzoquinone imine) before it damages hepatocytes. It must be given within 8-10 hours for best effect.",
    subject: "Pharmacology",
    difficulty: "Easy",
  },
  {
    id: 43,
    question: "What is the most common chromosomal abnormality in Down syndrome?",
    options: [
      { label: "A", text: "Monosomy 21" },
      { label: "B", text: "Trisomy 21 (non-disjunction)" },
      { label: "C", text: "Translocation of chromosome 14 and 15" },
      { label: "D", text: "Ring chromosome 21" },
    ],
    correctAnswer: "B",
    explanation: "95% of Down syndrome cases are due to trisomy 21 from non-disjunction during meiosis (usually meiosis I of oogenesis), resulting in 47 chromosomes. Maternal age is the major risk factor. About 4% are due to Robertsonian translocations (usually 14;21).",
    subject: "Pathology",
    difficulty: "Easy",
  },
  {
    id: 44,
    question: "The enzyme urease is used as a virulence factor by which organism responsible for peptic ulcer disease?",
    options: [
      { label: "A", text: "Escherichia coli" },
      { label: "B", text: "Helicobacter pylori" },
      { label: "C", text: "Clostridium difficile" },
      { label: "D", text: "Campylobacter jejuni" },
    ],
    correctAnswer: "B",
    explanation: "Helicobacter pylori produces urease, which splits urea into ammonia and CO2. The ammonia neutralizes gastric acid locally, allowing H. pylori to survive in the stomach. It is the major cause of peptic ulcer disease and is associated with gastric adenocarcinoma and MALT lymphoma.",
    subject: "Pathology",
    difficulty: "Easy",
  },
  {
    id: 45,
    question: "Which of the following best describes the Frank-Starling law of the heart?",
    options: [
      { label: "A", text: "Increased heart rate leads to increased stroke volume" },
      { label: "B", text: "Increased end-diastolic volume leads to increased stroke volume" },
      { label: "C", text: "Increased afterload leads to increased cardiac output" },
      { label: "D", text: "Decreased preload increases myocardial contractility" },
    ],
    correctAnswer: "B",
    explanation: "The Frank-Starling law states that the greater the end-diastolic volume (preload), the greater the force of myocardial contraction and stroke volume, up to a physiological limit. This is due to optimal overlap of actin and myosin filaments within sarcomeres.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 46,
    question: "Which of the following is the main function of surfactant in the lungs?",
    options: [
      { label: "A", text: "Increase alveolar surface tension" },
      { label: "B", text: "Reduce alveolar surface tension, preventing collapse" },
      { label: "C", text: "Facilitate O2 transport across the alveolar membrane" },
      { label: "D", text: "Stimulate respiratory centre in the medulla" },
    ],
    correctAnswer: "B",
    explanation: "Pulmonary surfactant (dipalmitoylphosphatidylcholine, DPPC) produced by type II pneumocytes reduces alveolar surface tension by disrupting intermolecular hydrogen bonds at the air-water interface, preventing alveolar collapse at end-expiration (atelectasis).",
    subject: "Physiology",
    difficulty: "Easy",
  },
  {
    id: 47,
    question: "Which of the following correctly describes the action of aldosterone?",
    options: [
      { label: "A", text: "Acts on proximal tubule to reabsorb Na+ and excrete K+" },
      { label: "B", text: "Acts on collecting duct to reabsorb Na+ and excrete K+ and H+" },
      { label: "C", text: "Inhibits ADH release from the posterior pituitary" },
      { label: "D", text: "Promotes water excretion in the loop of Henle" },
    ],
    correctAnswer: "B",
    explanation: "Aldosterone (from zona glomerulosa) acts on the principal cells of the collecting duct/cortical collecting tubule. It upregulates apical ENaC (Na+ channels) and basolateral Na+/K+ ATPase, increasing Na+ reabsorption and K+/H+ excretion, thus expanding ECF volume.",
    subject: "Physiology",
    difficulty: "Medium",
  },
  {
    id: 48,
    question: "Which cell organelle is primarily responsible for ATP production via oxidative phosphorylation?",
    options: [
      { label: "A", text: "Ribosome" },
      { label: "B", text: "Endoplasmic reticulum" },
      { label: "C", text: "Mitochondria" },
      { label: "D", text: "Lysosome" },
    ],
    correctAnswer: "C",
    explanation: "Mitochondria are the powerhouse of the cell. The inner mitochondrial membrane contains the electron transport chain (ETC) complexes I-IV and ATP synthase (Complex V), which use the proton gradient generated by NADH and FADH2 oxidation to produce ATP via oxidative phosphorylation.",
    subject: "Biochemistry",
    difficulty: "Easy",
  },
  {
    id: 49,
    question: "Which of the following is a feature that distinguishes malignant tumours from benign tumours?",
    options: [
      { label: "A", text: "Slow growth rate" },
      { label: "B", text: "Well-defined capsule" },
      { label: "C", text: "Metastasis" },
      { label: "D", text: "Low mitotic index" },
    ],
    correctAnswer: "C",
    explanation: "Metastasis (spread to distant sites via blood, lymphatics, or direct extension) is the hallmark feature of malignancy. Benign tumours grow slowly, are well-encapsulated, do not invade, and do not metastasise, though they can cause problems by compression.",
    subject: "Pathology",
    difficulty: "Easy",
  },
  {
    id: 50,
    question: "Which of the following statements about morphine is correct?",
    options: [
      { label: "A", text: "It acts primarily on kappa opioid receptors" },
      { label: "B", text: "It causes mydriasis (pupil dilation)" },
      { label: "C", text: "It can cause respiratory depression and constipation" },
      { label: "D", text: "It is contraindicated in severe pain" },
    ],
    correctAnswer: "C",
    explanation: "Morphine is a strong opioid analgesic acting mainly on mu (μ) opioid receptors. Its key adverse effects include respiratory depression (most dangerous), constipation (does not develop tolerance), miosis (pinpoint pupils — not mydriasis), nausea, and sedation.",
    subject: "Pharmacology",
    difficulty: "Medium",
  },
];

const SUBJECTS = ["All", "Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

// ─── Helper Utilities ─────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-green-100 text-green-700";
  if (d === "Medium") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const optionBg = (
  label: string,
  selected: string | null,
  correct: string,
  revealed: boolean
) => {
  if (!revealed) {
    return selected === label
      ? "bg-[#00875a] text-white border-[#00875a]"
      : "bg-white text-gray-800 border-gray-200 hover:border-[#00875a] hover:bg-[#f0fdf4]";
  }
  if (label === correct) return "bg-green-500 text-white border-green-500";
  if (label === selected && label !== correct) return "bg-red-400 text-white border-red-400";
  return "bg-white text-gray-400 border-gray-100";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <motion.div
        className="bg-[#00875a] h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}

function Timer({
  seconds,
  warningThreshold = 30,
}: {
  seconds: number;
  warningThreshold?: number;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds <= warningThreshold;
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold text-sm transition-colors ${
        isWarning ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-700"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuizCardPage() {
  const [mode, setMode] = useState<QuizMode>("setup");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(0); // 0 = no limit
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);

  // Quiz runtime state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  // ── Timer countdown ──
  const endQuiz = useCallback(() => {
    setTimerActive(false);
    setMode("results");
  }, []);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          endQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, endQuiz, timeLeft]);

  // ── Start Quiz ──
  const startQuiz = () => {
    let pool = QUESTION_BANK;
    if (selectedSubject !== "All") pool = pool.filter((q) => q.subject === selectedSubject);
    if (selectedDifficulty !== "All") pool = pool.filter((q) => q.difficulty === selectedDifficulty);

    const picked = shuffle(pool).slice(0, questionCount);
    const prepared = picked.map((q) => ({
      ...q,
      options: shuffleOptions ? shuffle(q.options) : q.options,
    }));

    setQuestions(prepared);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setRevealed(false);
    setAnswers({});
    if (timeLimit > 0) {
      setTimeLeft(timeLimit * 60);
      setTimerActive(true);
    }
    setMode("quiz");
  };

  // ── Answer selection ──
  const handleSelect = (label: string) => {
    if (revealed) return;
    setSelectedAnswer(label);
    if (!showExplanations) {
      setAnswers((prev) => ({ ...prev, [currentIndex]: label }));
    }
  };

  const handleReveal = () => {
    if (!selectedAnswer) return;
    setRevealed(true);
    setAnswers((prev) => ({ ...prev, [currentIndex]: selectedAnswer }));
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setTimerActive(false);
      setMode("results");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRevealed(false);
    }
  };

  const handleSkip = () => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: null }));
    handleNext();
  };

  // ── Results calc ──
  const score = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const gradeColor = percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-500";
  const gradeLabel = percentage >= 70 ? "Excellent" : percentage >= 50 ? "Fair" : "Needs Work";

  const fadeSlide = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.28 },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top nav bar */}
      <div className="fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 sm:px-8 gap-3">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#00875a] text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </NavLink>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-800 text-sm">Quiz Card</span>
        {mode === "quiz" && timeLimit > 0 && (
          <div className="ml-auto">
            <Timer seconds={timeLeft} />
          </div>
        )}
      </div>

      <div className="pt-14 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── SETUP SCREEN ── */}
          {mode === "setup" && (
            <motion.div key="setup" {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-8">
              <div className="w-full max-w-lg">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Quiz Card</h1>
                  <p className="text-sm text-gray-500 mt-1">Configure your quiz session and test your medical knowledge.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSubject(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedSubject === s
                              ? "bg-[#00875a] text-white border-[#00875a]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#00875a]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDifficulty(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedDifficulty === d
                              ? "bg-[#00875a] text-white border-[#00875a]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#00875a]"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of questions */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Questions: <span className="text-[#00875a]">{questionCount}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full accent-[#00875a]"
                    />
                    <div className="flex justify-between text-xss text-gray-400 mt-1">
                      <span>1</span><span>5</span><span>10</span><span>20</span><span>30</span><span>50</span>
                    </div>
                  </div>

                  {/* Time limit */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Time Limit: <span className="text-[#00875a]">{timeLimit === 0 ? "No limit" : `${timeLimit} min`}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={5}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="w-full accent-[#00875a]"
                    />
                    <div className="flex justify-between text-xss text-gray-400 mt-1">
                      <span>None</span><span>30 min</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3">
                    {(
                      [
                        { label: "Shuffle answer options", val: shuffleOptions, set: setShuffleOptions },
                        { label: "Show explanations after answer", val: showExplanations, set: setShowExplanations },
                      ] as { label: string; val: boolean; set: React.Dispatch<React.SetStateAction<boolean>> }[]
                    ).map(({ label, val, set }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <button
                          onClick={() => set((v) => !v)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${val ? "bg-[#00875a]" : "bg-gray-200"}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={startQuiz}
                    className="w-full bg-[#00875a] hover:bg-[#21875a] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── QUIZ SCREEN ── */}
          {mode === "quiz" && questions.length > 0 && (
            <motion.div key={`quiz-${currentIndex}`} {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-6">
              <div className="w-full max-w-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xss px-2 py-1 rounded-md font-medium ${difficultyColor(questions[currentIndex].difficulty)}`}>
                      {questions[currentIndex].difficulty}
                    </span>
                    <span className="text-xss bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                      {questions[currentIndex].subject}
                    </span>
                  </div>
                </div>

                <ProgressBar current={currentIndex} total={questions.length} />

                {/* Question card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mt-4">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed mb-5">
                    {questions[currentIndex].question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {questions[currentIndex].options.map((opt) => (
                      <motion.button
                        key={opt.label}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(opt.label)}
                        disabled={revealed}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${optionBg(
                          opt.label,
                          selectedAnswer,
                          questions[currentIndex].correctAnswer,
                          revealed
                        )}`}
                      >
                        <span className="w-7 h-7 flex-shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xss font-bold">
                          {opt.label}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                        {revealed && opt.label === questions[currentIndex].correctAnswer && (
                          <svg className="ml-auto w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        {revealed && opt.label === selectedAnswer && opt.label !== questions[currentIndex].correctAnswer && (
                          <svg className="ml-auto w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Explanation */}
                  <AnimatePresence>
                    {revealed && showExplanations && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Explanation</p>
                          <p className="text-sm text-blue-900 leading-relaxed">{questions[currentIndex].explanation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Skip
                    </button>
                    {!revealed ? (
                      <button
                        onClick={handleReveal}
                        disabled={!selectedAnswer}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          selectedAnswer
                            ? "bg-[#00875a] hover:bg-[#21875a] text-white"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {showExplanations ? "Check Answer" : "Submit"}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#00875a] hover:bg-[#21875a] text-white transition-colors"
                      >
                        {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS SCREEN ── */}
          {mode === "results" && (
            <motion.div key="results" {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-6">
              <div className="w-full max-w-xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <span className={`text-3xl font-bold ${gradeColor}`}>{percentage}%</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{gradeLabel}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    You answered {score} out of {questions.length} questions correctly.
                  </p>
                  <div className="mt-4">
                    <ProgressBar current={score} total={questions.length} />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { label: "Correct", val: score, color: "text-green-600" },
                      { label: "Wrong", val: questions.filter((q, i) => answers[i] !== null && answers[i] !== q.correctAnswer).length, color: "text-red-500" },
                      { label: "Skipped", val: questions.filter((_, i) => answers[i] === null || answers[i] === undefined).length, color: "text-gray-500" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="bg-gray-50 rounded-xl py-3">
                        <p className={`text-xl font-bold ${color}`}>{val}</p>
                        <p className="text-xss text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setMode("review")}
                      className="flex-1 py-2.5 rounded-xl border border-[#00875a] text-[#00875a] text-sm font-semibold hover:bg-[#f0fdf4] transition-colors"
                    >
                      Review Answers
                    </button>
                    <button
                      onClick={() => setMode("setup")}
                      className="flex-1 py-2.5 rounded-xl bg-[#00875a] hover:bg-[#21875a] text-white text-sm font-semibold transition-colors"
                    >
                      New Quiz
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── REVIEW SCREEN ── */}
          {mode === "review" && (
            <motion.div key={`review-${reviewIndex}`} {...fadeSlide} className="flex-1 flex items-start justify-center px-4 py-6">
              <div className="w-full max-w-xl">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setMode("results")}
                    className="text-sm text-gray-500 hover:text-[#00875a] flex items-center gap-1 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Results
                  </button>
                  <span className="text-xs text-gray-500">
                    {reviewIndex + 1} / {questions.length}
                  </span>
                </div>
                <ProgressBar current={reviewIndex + 1} total={questions.length} />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xss px-2 py-1 rounded-md font-medium ${difficultyColor(questions[reviewIndex].difficulty)}`}>
                      {questions[reviewIndex].difficulty}
                    </span>
                    <span className="text-xss bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{questions[reviewIndex].subject}</span>
                    {answers[reviewIndex] === questions[reviewIndex].correctAnswer ? (
                      <span className="ml-auto text-xss bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">Correct</span>
                    ) : answers[reviewIndex] === null || answers[reviewIndex] === undefined ? (
                      <span className="ml-auto text-xss bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">Skipped</span>
                    ) : (
                      <span className="ml-auto text-xss bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">Incorrect</span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed mb-4">
                    {questions[reviewIndex].question}
                  </p>

                  <div className="space-y-2.5">
                    {questions[reviewIndex].options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium ${optionBg(
                          opt.label,
                          answers[reviewIndex] ?? null,
                          questions[reviewIndex].correctAnswer,
                          true
                        )}`}
                      >
                        <span className="w-7 h-7 flex-shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xss font-bold">
                          {opt.label}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Explanation</p>
                    <p className="text-sm text-blue-900 leading-relaxed">{questions[reviewIndex].explanation}</p>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                      disabled={reviewIndex === 0}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (reviewIndex + 1 >= questions.length) setMode("results");
                        else setReviewIndex((i) => i + 1);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#00875a] hover:bg-[#21875a] text-white text-sm font-semibold transition-colors"
                    >
                      {reviewIndex + 1 >= questions.length ? "Back to Results" : "Next"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
