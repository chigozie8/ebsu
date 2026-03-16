// ─────────────────────────────────────────────────────────────────────────────
// Gallery Data
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO ADD IMAGES:
//   1. Drop your image into  src/assets/img/gallery/
//   2. Add an import below
//   3. Add an entry to the galleryItems array
//
// That's it — the image will appear on the homepage AND the full gallery page.
// ─────────────────────────────────────────────────────────────────────────────

import img1  from "../assets/img/gallery/IMG-20260309-WA0048.jpg";
import img2  from "../assets/img/gallery/IMG-20260309-WA0049.jpg";
import img3  from "../assets/img/gallery/IMG-20260309-WA0051.jpg";
import img4  from "../assets/img/gallery/IMG-20260309-WA0059.jpg";
import img5  from "../assets/img/gallery/IMG-20260310-WA0094.jpg";
import img6  from "../assets/img/gallery/IMG-20260310-WA0095.jpg";
import img7  from "../assets/img/gallery/IMG-20260310-WA0097.jpg";
import img8  from "../assets/img/gallery/IMG-20260310-WA0099.jpg";
import img9  from "../assets/img/gallery/IMG-20260310-WA0106.jpg";
import img10 from "../assets/img/gallery/IMG-20260310-WA0110.jpg";
import img11 from "../assets/img/gallery/IMG-20260310-WA0224.jpg";
import img12 from "../assets/img/gallery/IMG-20260310-WA0226.jpg";
import img13 from "../assets/img/gallery/IMG-20260310-WA0228.jpg";
import img14 from "../assets/img/gallery/IMG-20260310-WA0234.jpg";
import img15 from "../assets/img/gallery/IMG-20260311-WA0007.jpg";
import img16 from "../assets/img/gallery/IMG-20260311-WA0018.jpg";
import img17 from "../assets/img/gallery/IMG-20260311-WA0035.jpg";
import img18 from "../assets/img/gallery/IMG-20260311-WA0066.jpg";
import img19 from "../assets/img/gallery/IMG-20260311-WA0076.jpg";
import img20 from "../assets/img/gallery/IMG-20260311-WA0090.jpg";
import img21 from "../assets/img/gallery/IMG-20260311-WA0094.jpg";
import img22 from "../assets/img/gallery/IMG-20260311-WA0100.jpg";
import img23 from "../assets/img/gallery/IMG-20260311-WA0109.jpg";
import img24 from "../assets/img/gallery/Screenshot_20260311-165130_1.jpg";
import img25 from "../assets/img/gallery/Screenshot_20260311-165133_1.jpg";
import img26 from "../assets/img/gallery/a.jpg";
import img27 from "../assets/img/gallery/aa.jpg";
import img28 from "../assets/img/gallery/b.jpg";
import img29 from "../assets/img/gallery/bb.jpg";
import img30 from "../assets/img/gallery/c.jpg";
import img31 from "../assets/img/gallery/cc.jpg";
import img32 from "../assets/img/gallery/dd.jpg";
import img33 from "../assets/img/gallery/ebsu.jpeg";
import img34 from "../assets/img/gallery/ee.jpg";
import img35 from "../assets/img/gallery/fetha.jpg";
import img36 from "../assets/img/gallery/g.jpg";
import img37 from "../assets/img/gallery/h.jpg";
import img38 from "../assets/img/gallery/i.jpg";
import img39 from "../assets/img/gallery/j.jpg";
import img40 from "../assets/img/gallery/k.jpg";
import img41 from "../assets/img/gallery/l.jpg";
import img42 from "../assets/img/gallery/oo.jpeg";
import img43 from "../assets/img/gallery/senate.jpg";

export interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  category?: string;
}

export const galleryItems: GalleryItem[] = [
  { id: "1",  url: img1,  type: "image", category: "events" },
  { id: "2",  url: img2,  type: "image", category: "events" },
  { id: "3",  url: img3,  type: "image", category: "events" },
  { id: "4",  url: img4,  type: "image", category: "events" },
  { id: "5",  url: img5,  type: "image", category: "activities" },
  { id: "6",  url: img6,  type: "image", category: "activities" },
  { id: "7",  url: img7,  type: "image", category: "activities" },
  { id: "8",  url: img8,  type: "image", category: "activities" },
  { id: "9",  url: img9,  type: "image", category: "activities" },
  { id: "10", url: img10, type: "image", category: "activities" },
  { id: "11", url: img11, type: "image", category: "general" },
  { id: "12", url: img12, type: "image", category: "general" },
  { id: "13", url: img13, type: "image", category: "general" },
  { id: "14", url: img14, type: "image", category: "general" },
  { id: "15", url: img15, type: "image", category: "outreach" },
  { id: "16", url: img16, type: "image", category: "outreach" },
  { id: "17", url: img17, type: "image", category: "outreach" },
  { id: "18", url: img18, type: "image", category: "outreach" },
  { id: "19", url: img19, type: "image", category: "outreach" },
  { id: "20", url: img20, type: "image", category: "outreach" },
  { id: "21", url: img21, type: "image", category: "convocation" },
  { id: "22", url: img22, type: "image", category: "convocation" },
  { id: "23", url: img23, type: "image", category: "convocation" },
  { id: "24", url: img24, type: "image", category: "executives" },
  { id: "25", url: img25, type: "image", category: "executives" },
  { id: "26", url: img26, type: "image", category: "general" },
  { id: "27", url: img27, type: "image", category: "general" },
  { id: "28", url: img28, type: "image", category: "general" },
  { id: "29", url: img29, type: "image", category: "general" },
  { id: "30", url: img30, type: "image", category: "general" },
  { id: "31", url: img31, type: "image", category: "general" },
  { id: "32", url: img32, type: "image", category: "general" },
  { id: "33", url: img33, type: "image", category: "general" },
  { id: "34", url: img34, type: "image", category: "general" },
  { id: "35", url: img35, type: "image", category: "events" },
  { id: "36", url: img36, type: "image", category: "events" },
  { id: "37", url: img37, type: "image", category: "events" },
  { id: "38", url: img38, type: "image", category: "events" },
  { id: "39", url: img39, type: "image", category: "activities" },
  { id: "40", url: img40, type: "image", category: "activities" },
  { id: "41", url: img41, type: "image", category: "activities" },
  { id: "42", url: img42, type: "image", category: "general" },
  { id: "43", url: img43, type: "image", category: "executives", caption: "EBSU Senate" },
];
