import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCeDJW_9r37phtogoo04FDUWcqEninfPfM',
  authDomain: 'ebsumsa-f3120.firebaseapp.com',
  projectId: 'ebsumsa-f3120',
  storageBucket: 'ebsumsa-f3120.firebasestorage.app',
  messagingSenderId: '1020501012962',
  appId: '1:1020501012962:web:a5cfe29f53ad7aee9b89bb',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const communities = [
  {
    name: 'General',
    slug: 'general',
    description: 'Open discussion for all EBSU students — announcements, questions and everything in between.',
    icon: 'MessageSquare',
    color: '#075E54',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
  {
    name: 'Academics',
    slug: 'academics',
    description: 'Study tips, course materials, exam prep and academic support for EBSU students.',
    icon: 'BookOpen',
    color: '#1a73e8',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
  {
    name: 'Campus Life',
    slug: 'campus-life',
    description: 'Hostel, food, hangout spots, student activities and everything happening on campus.',
    icon: 'Home',
    color: '#e91e63',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
  {
    name: 'Tech & Innovation',
    slug: 'tech',
    description: 'Coding, projects, tech events and opportunities for EBSU tech enthusiasts.',
    icon: 'Cpu',
    color: '#43a047',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
  {
    name: 'Events',
    slug: 'events',
    description: 'Campus events, social gatherings, competitions and student union activities.',
    icon: 'Calendar',
    color: '#f57c00',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
  {
    name: 'Health & Wellness',
    slug: 'health',
    description: 'Mental health, physical wellness, sports and healthy living on campus.',
    icon: 'Heart',
    color: '#00acc1',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
  {
    name: 'Jobs & Internships',
    slug: 'jobs',
    description: 'Internship opportunities, graduate jobs, career advice and professional development.',
    icon: 'Briefcase',
    color: '#6d4c41',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
  {
    name: 'Buy & Sell',
    slug: 'buy-sell',
    description: 'Marketplace for EBSU students — sell books, gadgets, clothes and more.',
    icon: 'ShoppingCart',
    color: '#7b1fa2',
    member_count: 0,
    post_count: 0,
    is_active: true,
  },
];

async function seed() {
  console.log('Seeding EBSU communities into Firestore...');

  const ref = collection(db, 'communities');

  for (const community of communities) {
    const existing = await getDocs(query(ref, where('slug', '==', community.slug)));
    if (!existing.empty) {
      console.log(`  [skip] "${community.name}" already exists.`);
      continue;
    }

    await addDoc(ref, {
      ...community,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log(`  [added] "${community.name}"`);
  }

  console.log('Done! Communities seeded successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
