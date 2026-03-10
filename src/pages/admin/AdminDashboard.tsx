/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useGetUserInfo } from "../../hooks/auth/useGetUserInfo";
import { db } from "../../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { notifyUser } from "../../helpers/notifyUser";
import { Spinner } from "../../components/loaders/Spinner";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";
import { supabase, STORAGE_BUCKETS, getPublicUrl } from "../../config/supabase";
import { getCoursesForLevelAndSemester } from "../../data/academics/learning-resources/mbbsCourses";

interface Material {
  id: string;
  title: string;
  description: string;
  resourceType: "handouts" | "textbooks" | "pastquestions";
  level: string;
  semester: "First" | "Second";
  courseCode: string;
  section: "preclinical" | "clinical";
  fileUrl: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: any;
}

interface IDCardRegistration {
  id: string;
  firstName: string;
  surname: string;
  dateOfBirth: string;
  level: string;
  photoUrl: string;
  email: string;
  status: string;
  registrationNumber: string;
  classSet: string;
  phoneNumber: string;
  createdAt: any;
}

interface ContentBlock {
  type: "p" | "p-bold" | "h1" | "h2" | "img" | "list";
  content: string;
}

interface BlogPost {
  id: string;
  no: number;
  title: string;
  author: string;
  authorImage?: string;
  date: string;
  sampleImg: string;
  postType: "top" | "featured" | "others";
  category?: string;
  contents: ContentBlock[];
  createdAt: any;
  updatedAt?: any;
  likes?: number;
  likedBy?: string[];
}

interface CourseEntry {
  id: string;
  courseCode: string;
  courseTitle: string;
  level: string;
  semester?: string;
  tip: string;
  createdAt: any;
}

interface LevelEntry {
  id: string;
  level: string;
  title: string;
  desc: string;
  section: "preclinical" | "clinical";
  order: number;
  createdAt: any;
}

interface CourseOutlineContent {
  heading: string;
  content: string;
}

interface CourseOutlineEntry {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  creditUnits: string;
  preRequisite: string | null;
  level: string;
  semester: "First" | "Second";
  info: CourseOutlineContent[];
  createdAt: any;
  updatedAt?: any;
}

// Admin email - add your admin email here
const ADMIN_EMAIL = "patronkwo@gmail.com";

export default function AdminDashboard() {
  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const [activeTab, setActiveTab] = useState<"materials" | "idcards" | "blog" | "courses" | "levels" | "outlines">(
    "materials"
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [idCards, setIdCards] = useState<IDCardRegistration[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [levels, setLevels] = useState<LevelEntry[]>([]);
  const [courseOutlines, setCourseOutlines] = useState<CourseOutlineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blogImageRef = useRef<HTMLInputElement>(null);
  const contentImageRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resourceType: "" as "" | "handouts" | "textbooks" | "pastquestions",
    level: "",
    semester: "" as "" | "First" | "Second",
    courseCode: "",
    section: "preclinical" as "preclinical" | "clinical",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableMaterialCourses, setAvailableMaterialCourses] = useState<{courseCode: string; courseTitle: string}[]>([]);

  // Blog form state - matches the Blog page data structure
  const [blogFormData, setBlogFormData] = useState({
    title: "",
    author: "",
    postType: "others" as "top" | "featured" | "others",
    category: "",
  });
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { type: "p", content: "" }
  ]);
  const [blogImage, setBlogImage] = useState<File | null>(null);
  const [blogImagePreview, setBlogImagePreview] = useState<string>("");
  const [authorImage, setAuthorImage] = useState<File | null>(null);
  const [authorImagePreview, setAuthorImagePreview] = useState<string>("");
  const authorImageRef = useRef<HTMLInputElement>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  // Course form state
  const [courseFormData, setCourseFormData] = useState({
    courseCode: "",
    courseTitle: "",
    level: "",
    semester: "",
    tip: "",
  });

  // Level form state
  const [levelFormData, setLevelFormData] = useState({
    level: "",
    title: "",
    desc: "",
    section: "preclinical" as "preclinical" | "clinical",
  });
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);

  // Course Outline form state
  const [outlineFormData, setOutlineFormData] = useState({
    courseCode: "",
    courseTitle: "",
    creditUnit: 0,
    creditUnits: "",
    preRequisite: "",
    level: "",
    semester: "" as "" | "First" | "Second",
  });
  const [outlineInfoBlocks, setOutlineInfoBlocks] = useState<CourseOutlineContent[]>([
    { heading: "", content: "" }
  ]);
  const [editingOutlineId, setEditingOutlineId] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin =
    studentDetails?.email === ADMIN_EMAIL ||
    studentDetails?.email?.includes("admin");

  useEffect(() => {
    if (isAdmin) {
      fetchMaterials();
      fetchIDCards();
      fetchBlogPosts();
      fetchCourses();
      fetchLevels();
      fetchCourseOutlines();
    }
  }, [isAdmin]);

  const fetchMaterials = async () => {
    try {
      const q = query(
        collection(db, "learningMaterials"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const materialsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Material[];
      setMaterials(materialsData);
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIDCards = async () => {
    try {
      const q = query(
        collection(db, "idCardRegistrations"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const idCardsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as IDCardRegistration[];
      setIdCards(idCardsData);
    } catch (error) {
      console.error("Error fetching ID cards:", error);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const q = query(
        collection(db, "blogPosts"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BlogPost[];
      setBlogPosts(postsData);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const q = query(
        collection(db, "courses"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const coursesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CourseEntry[];
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchLevels = async () => {
    try {
      const q = query(
        collection(db, "learningResourceLevels"),
        orderBy("order", "asc")
      );
      const snapshot = await getDocs(q);
      const levelsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LevelEntry[];
      setLevels(levelsData);
    } catch (error) {
      console.error("Error fetching levels:", error);
    }
  };

  const fetchCourseOutlines = async () => {
    try {
      const q = query(
        collection(db, "courseOutlines"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const outlinesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CourseOutlineEntry[];
      setCourseOutlines(outlinesData);
    } catch (error) {
      console.error("Error fetching course outlines:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFileToSupabase = async (file: File, bucket: string = STORAGE_BUCKETS.LEARNING_RESOURCES): Promise<string> => {
    const fileName = `${bucket}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return getPublicUrl(bucket, data.path);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.resourceType ||
      !formData.level ||
      !formData.semester ||
      !formData.courseCode ||
      !selectedFile
    ) {
      notifyUser("error", "Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      notifyUser("loading", "Uploading material...");

      // Upload to Supabase Storage with the correct folder structure
      // Path: levels/{level}/{course}/{resourcesType}/{filename}
      const filePath = `levels/${formData.level}/${formData.courseCode}/${formData.resourceType}/${Date.now()}-${selectedFile.name}`;
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const fileUrl = getPublicUrl(STORAGE_BUCKETS.LEARNING_RESOURCES, data.path);

      // Save metadata to Firestore
      await addDoc(collection(db, "learningMaterials"), {
        title: formData.title,
        description: formData.description,
        resourceType: formData.resourceType,
        level: formData.level,
        semester: formData.semester,
        courseCode: formData.courseCode,
        section: formData.section,
        fileUrl: fileUrl,
        fileName: selectedFile.name,
        filePath: filePath,
        fileSize: selectedFile.size,
        uploadedBy: studentDetails?.email || "Admin",
        createdAt: serverTimestamp(),
      });

      notifyUser("success", "Material uploaded successfully!");

      setFormData({
        title: "",
        description: "",
        resourceType: "",
        level: "",
        semester: "",
        courseCode: "",
        section: "preclinical",
      });
      setSelectedFile(null);
      setAvailableMaterialCourses([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchMaterials();
    } catch (error: any) {
      console.error("Error uploading material:", error);
      notifyUser("error", "Failed to upload material. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string, filePath?: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      // Delete from Supabase storage if filePath exists
      if (filePath) {
        await supabase.storage
          .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
          .remove([filePath]);
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, "learningMaterials", materialId));
      notifyUser("success", "Material deleted successfully");
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      notifyUser("error", "Failed to delete material");
    }
  };

  // Blog functions
  const handleBlogInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setBlogFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBlogImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlogImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuthorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAuthorImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthorImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Content block management
  const addContentBlock = (type: ContentBlock["type"]) => {
    setContentBlocks([...contentBlocks, { type, content: "" }]);
  };

  const updateContentBlock = (index: number, content: string) => {
    const updated = [...contentBlocks];
    updated[index].content = content;
    setContentBlocks(updated);
  };

  const updateContentBlockType = (index: number, type: ContentBlock["type"]) => {
    const updated = [...contentBlocks];
    updated[index].type = type;
    setContentBlocks(updated);
  };

  const removeContentBlock = (index: number) => {
    if (contentBlocks.length === 1) {
      notifyUser("error", "You need at least one content block");
      return;
    }
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const moveContentBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contentBlocks.length) return;
    
    const updated = [...contentBlocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setContentBlocks(updated);
  };

  const handleContentImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      notifyUser("loading", "Uploading image...");
      const imageUrl = await uploadFileToSupabase(file, STORAGE_BUCKETS.LEARNING_RESOURCES);
      updateContentBlock(index, imageUrl);
      notifyUser("success", "Image uploaded!");
    } catch (error) {
      console.error("Error uploading image:", error);
      notifyUser("error", "Failed to upload image");
    }
  };

  const handleSubmitBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blogFormData.title || !blogFormData.author) {
      notifyUser("error", "Please fill in title and author");
      return;
    }

    // Validate content blocks
    const hasContent = contentBlocks.some(block => block.content.trim() !== "");
    if (!hasContent) {
      notifyUser("error", "Please add at least one content block with content");
      return;
    }

    if (!blogImage && !editingBlogId) {
      notifyUser("error", "Please add a featured image for the blog post");
      return;
    }

    setIsUploading(true);

    try {
      notifyUser("loading", editingBlogId ? "Updating post..." : "Creating post...");

      let sampleImgUrl = "";
      if (blogImage) {
        sampleImgUrl = await uploadFileToSupabase(blogImage, STORAGE_BUCKETS.LEARNING_RESOURCES);
      }

      let authorImgUrl = "";
      if (authorImage) {
        authorImgUrl = await uploadFileToSupabase(authorImage, STORAGE_BUCKETS.LEARNING_RESOURCES);
      }

      // Filter out empty content blocks
      const filteredContents = contentBlocks.filter(block => block.content.trim() !== "");

      // Get the next post number (find the highest existing no and add 1)
      const existingNos = blogPosts.map(p => p.no || 0);
      const maxNo = existingNos.length > 0 ? Math.max(...existingNos) : 0;
      const nextNo = editingBlogId 
        ? blogPosts.find(p => p.id === editingBlogId)?.no || maxNo + 1
        : maxNo + 1;

      // Format date
      const today = new Date();
      const formattedDate = `${today.getDate()}${getOrdinalSuffix(today.getDate())} ${today.toLocaleString('default', { month: 'long' })}, ${today.getFullYear()}`;

      // Determine the image URL
      let finalSampleImgUrl = sampleImgUrl;
      let finalAuthorImgUrl = authorImgUrl;
      if (!finalSampleImgUrl && editingBlogId) {
        // Keep existing image if no new one provided
        const existingPost = blogPosts.find(p => p.id === editingBlogId);
        if (existingPost) {
          finalSampleImgUrl = existingPost.sampleImg;
          finalAuthorImgUrl = existingPost.authorImage || "";
        }
      }
      
      // Use a default placeholder if no image
      if (!finalSampleImgUrl) {
        finalSampleImgUrl = "/images/blog/default-blog-image.jpg";
      }

      const postData: Omit<BlogPost, "id" | "createdAt"> & { updatedAt?: any; createdAt?: any } = {
        no: nextNo,
        title: blogFormData.title,
        author: blogFormData.author,
        authorImage: finalAuthorImgUrl,
        date: formattedDate,
        postType: blogFormData.postType,
        category: blogFormData.category,
        contents: filteredContents,
        sampleImg: finalSampleImgUrl,
        updatedAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
      };

      if (editingBlogId) {
        await updateDoc(doc(db, "blogPosts", editingBlogId), postData);
        notifyUser("success", "Blog post updated successfully!");
      } else {
        await addDoc(collection(db, "blogPosts"), {
          ...postData,
          createdAt: serverTimestamp(),
        });
        notifyUser("success", "Blog post created successfully!");
      }

      // Reset form
      resetBlogForm();
      fetchBlogPosts();
    } catch (error: any) {
      console.error("Error saving blog post:", error);
      notifyUser("error", "Failed to save blog post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const resetBlogForm = () => {
    setBlogFormData({
      title: "",
      author: "",
      postType: "others",
      category: "",
    });
    setContentBlocks([{ type: "p", content: "" }]);
    setBlogImage(null);
    setBlogImagePreview("");
    setAuthorImage(null);
    setAuthorImagePreview("");
    setEditingBlogId(null);
    if (blogImageRef.current) {
      blogImageRef.current.value = "";
    }
    if (authorImageRef.current) {
      authorImageRef.current.value = "";
    }
  };

  const handleEditBlog = (post: BlogPost) => {
    setBlogFormData({
      title: post.title,
      author: post.author,
      postType: post.postType,
      category: post.category || "",
    });
    setContentBlocks(post.contents && post.contents.length > 0 ? post.contents : [{ type: "p", content: "" }]);
    setBlogImagePreview(post.sampleImg || "");
    setAuthorImagePreview(post.authorImage || "");
    setEditingBlogId(post.id);
    setActiveTab("blog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteBlog = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      await deleteDoc(doc(db, "blogPosts", postId));
      notifyUser("success", "Blog post deleted successfully");
      fetchBlogPosts();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      notifyUser("error", "Failed to delete blog post");
    }
  };

  // Course functions
  const handleCourseInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setCourseFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseFormData.courseCode || !courseFormData.courseTitle || !courseFormData.level) {
      notifyUser("error", "Please fill in course code, title, and level");
      return;
    }

    setIsUploading(true);

    try {
      notifyUser("loading", "Adding course...");

      await addDoc(collection(db, "courses"), {
        courseCode: courseFormData.courseCode,
        courseTitle: courseFormData.courseTitle,
        level: courseFormData.level,
        semester: courseFormData.semester,
        tip: courseFormData.tip,
        createdAt: serverTimestamp(),
      });

      notifyUser("success", "Course added successfully!");

      setCourseFormData({
        courseCode: "",
        courseTitle: "",
        level: "",
        semester: "",
        tip: "",
      });

      fetchCourses();
    } catch (error: any) {
      console.error("Error adding course:", error);
      notifyUser("error", "Failed to add course. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await deleteDoc(doc(db, "courses", courseId));
      notifyUser("success", "Course deleted successfully");
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      notifyUser("error", "Failed to delete course");
    }
  };

  // Level functions
  const handleLevelInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setLevelFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitLevel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!levelFormData.level || !levelFormData.title || !levelFormData.desc) {
      notifyUser("error", "Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      notifyUser("loading", editingLevelId ? "Updating level..." : "Adding level...");

      // Determine the order based on level number
      const levelNum = parseInt(levelFormData.level);
      const order = levelNum / 100;

      const levelData = {
        level: levelFormData.level,
        title: levelFormData.title,
        desc: levelFormData.desc,
        section: levelFormData.section,
        order,
      };

      if (editingLevelId) {
        await updateDoc(doc(db, "learningResourceLevels", editingLevelId), levelData);
        notifyUser("success", "Level updated successfully!");
      } else {
        await addDoc(collection(db, "learningResourceLevels"), {
          ...levelData,
          createdAt: serverTimestamp(),
        });
        notifyUser("success", "Level added successfully!");
      }

      resetLevelForm();
      fetchLevels();
    } catch (error: any) {
      console.error("Error saving level:", error);
      notifyUser("error", "Failed to save level. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetLevelForm = () => {
    setLevelFormData({
      level: "",
      title: "",
      desc: "",
      section: "preclinical",
    });
    setEditingLevelId(null);
  };

  const handleEditLevel = (level: LevelEntry) => {
    setLevelFormData({
      level: level.level,
      title: level.title,
      desc: level.desc,
      section: level.section,
    });
    setEditingLevelId(level.id);
    setActiveTab("levels");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm("Are you sure you want to delete this level?")) return;

    try {
      await deleteDoc(doc(db, "learningResourceLevels", levelId));
      notifyUser("success", "Level deleted successfully");
      fetchLevels();
    } catch (error) {
      console.error("Error deleting level:", error);
      notifyUser("error", "Failed to delete level");
    }
  };

  // Course Outline functions
  const handleOutlineInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setOutlineFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addOutlineInfoBlock = () => {
    setOutlineInfoBlocks([...outlineInfoBlocks, { heading: "", content: "" }]);
  };

  const updateOutlineInfoBlock = (index: number, field: "heading" | "content", value: string) => {
    const updated = [...outlineInfoBlocks];
    updated[index][field] = value;
    setOutlineInfoBlocks(updated);
  };

  const removeOutlineInfoBlock = (index: number) => {
    if (outlineInfoBlocks.length === 1) {
      notifyUser("error", "You need at least one content block");
      return;
    }
    setOutlineInfoBlocks(outlineInfoBlocks.filter((_, i) => i !== index));
  };

  const handleSubmitOutline = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!outlineFormData.courseCode || !outlineFormData.courseTitle || !outlineFormData.level || !outlineFormData.semester) {
      notifyUser("error", "Please fill in all required fields (Course Code, Title, Level, Semester)");
      return;
    }

    // Validate at least one content block
    const hasContent = outlineInfoBlocks.some(block => block.content.trim() !== "");
    if (!hasContent) {
      notifyUser("error", "Please add at least one content section");
      return;
    }

    setIsUploading(true);

    try {
      notifyUser("loading", editingOutlineId ? "Updating course outline..." : "Adding course outline...");

      // Filter out empty content blocks
      const filteredInfo = outlineInfoBlocks.filter(block => block.content.trim() !== "");

      const outlineData = {
        courseCode: outlineFormData.courseCode.toUpperCase(),
        courseTitle: outlineFormData.courseTitle,
        creditUnit: Number(outlineFormData.creditUnit) || 0,
        creditUnits: outlineFormData.creditUnits,
        preRequisite: outlineFormData.preRequisite || null,
        level: outlineFormData.level,
        semester: outlineFormData.semester,
        info: filteredInfo,
        updatedAt: serverTimestamp(),
      };

      if (editingOutlineId) {
        await updateDoc(doc(db, "courseOutlines", editingOutlineId), outlineData);
        notifyUser("success", "Course outline updated successfully!");
      } else {
        await addDoc(collection(db, "courseOutlines"), {
          ...outlineData,
          createdAt: serverTimestamp(),
        });
        notifyUser("success", "Course outline added successfully!");
      }

      resetOutlineForm();
      fetchCourseOutlines();
    } catch (error: any) {
      console.error("Error saving course outline:", error);
      notifyUser("error", "Failed to save course outline. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetOutlineForm = () => {
    setOutlineFormData({
      courseCode: "",
      courseTitle: "",
      creditUnit: 0,
      creditUnits: "",
      preRequisite: "",
      level: "",
      semester: "",
    });
    setOutlineInfoBlocks([{ heading: "", content: "" }]);
    setEditingOutlineId(null);
  };

  const handleEditOutline = (outline: CourseOutlineEntry) => {
    setOutlineFormData({
      courseCode: outline.courseCode,
      courseTitle: outline.courseTitle,
      creditUnit: outline.creditUnit,
      creditUnits: outline.creditUnits,
      preRequisite: outline.preRequisite || "",
      level: outline.level,
      semester: outline.semester,
    });
    setOutlineInfoBlocks(outline.info && outline.info.length > 0 ? outline.info : [{ heading: "", content: "" }]);
    setEditingOutlineId(outline.id);
    setActiveTab("outlines");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteOutline = async (outlineId: string) => {
    if (!confirm("Are you sure you want to delete this course outline?")) return;

    try {
      await deleteDoc(doc(db, "courseOutlines", outlineId));
      notifyUser("success", "Course outline deleted successfully");
      fetchCourseOutlines();
    } catch (error) {
      console.error("Error deleting course outline:", error);
      notifyUser("error", "Failed to delete course outline");
    }
  };

  const printIDCard = (card: IDCardRegistration) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ID Card - ${card.firstName} ${card.surname}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .id-card {
                width: 350px;
                border: 2px solid #00875a;
                border-radius: 12px;
                padding: 20px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #00875a;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .header h1 { color: #00875a; font-size: 18px; margin: 0; }
              .header p { margin: 5px 0 0; font-size: 12px; color: #666; }
              .photo {
                width: 100px;
                height: 120px;
                border: 1px solid #ccc;
                margin: 0 auto 15px;
                display: block;
                object-fit: cover;
              }
              .info { font-size: 14px; }
              .info p { margin: 8px 0; }
              .info strong { color: #333; }
              .footer {
                text-align: center;
                margin-top: 15px;
                font-size: 10px;
                color: #999;
              }
            </style>
          </head>
          <body>
            <div class="id-card">
              <div class="header">
                <h1>EBSU STUDENT ID</h1>
                <p>Ebonyi State University</p>
              </div>
              <img src="${card.photoUrl}" class="photo" alt="Student Photo" />
              <div class="info">
                <p><strong>Name:</strong> ${card.firstName} ${card.surname}</p>
                <p><strong>Reg. No.:</strong> ${card.registrationNumber || "N/A"}</p>
                <p><strong>Date of Birth:</strong> ${card.dateOfBirth}</p>
                <p><strong>Level:</strong> ${card.level}</p>
                <p><strong>Class:</strong> ${card.classSet || "N/A"}</p>
              </div>
              <div class="footer">
                <p>This card is property of EBSU. If found, please return.</p>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (gettingStudentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          variants={fadeInVariants5}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          custom={1}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage learning materials, ID cards, blog posts, courses, and course outlines
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-2 text-xs text-gray-500 sm:hidden">Scroll or tap to see all tabs</div>
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "materials"
                ? "bg-green2 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Learning Materials
          </button>
          <button
            onClick={() => setActiveTab("idcards")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "idcards"
                ? "bg-green2 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            ID Card Registrations
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "blog"
                ? "bg-green2 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Blog Posts
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "courses"
                ? "bg-green2 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab("levels")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "levels"
                ? "bg-green2 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Learning Resources
          </button>
          <button
            onClick={() => setActiveTab("outlines")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === "outlines"
                ? "bg-green2 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-green2"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Course Outlines
          </button>
        </div>

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upload Form */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={3}
              className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Upload New Material
              </h2>
              <form onSubmit={handleUploadMaterial} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Material title"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          section: "preclinical", 
                          level: "", 
                          courseCode: "",
                          semester: "" 
                        }));
                        setAvailableMaterialCourses([]);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        formData.section === "preclinical"
                          ? "bg-green2 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Preclinical (100-300L)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          section: "clinical", 
                          level: "", 
                          courseCode: "",
                          semester: "" 
                        }));
                        setAvailableMaterialCourses([]);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        formData.section === "clinical"
                          ? "bg-green2 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Clinical (400-600L)
                    </button>
                  </div>
                </div>

                {/* Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={(e) => {
                      const newLevel = e.target.value;
                      setFormData(prev => ({ ...prev, level: newLevel, courseCode: "" }));
                      if (newLevel && formData.semester) {
                        const courses = getCoursesForLevelAndSemester(newLevel, formData.semester as "First" | "Second");
                        setAvailableMaterialCourses(courses);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select Level</option>
                    {formData.section === "preclinical" ? (
                      <>
                        <option value="100">100 Level (Year 1)</option>
                        <option value="200">200 Level (Year 2)</option>
                        <option value="300">300 Level (Year 3)</option>
                      </>
                    ) : (
                      <>
                        <option value="400">400 Level (Year 4)</option>
                        <option value="500">500 Level (Year 5)</option>
                        <option value="600">600 Level (Year 6)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Semester Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={(e) => {
                      const newSemester = e.target.value as "First" | "Second";
                      setFormData(prev => ({ ...prev, semester: newSemester, courseCode: "" }));
                      if (formData.level && newSemester) {
                        const courses = getCoursesForLevelAndSemester(formData.level, newSemester);
                        setAvailableMaterialCourses(courses);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select Semester</option>
                    <option value="First">First Semester</option>
                    <option value="Second">Second Semester</option>
                  </select>
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="courseCode"
                    value={formData.courseCode}
                    onChange={handleInputChange}
                    disabled={!formData.level || !formData.semester}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.level || !formData.semester 
                        ? "Select level & semester first" 
                        : "Select Course"}
                    </option>
                    {availableMaterialCourses.map((course) => (
                      <option key={course.courseCode} value={course.courseCode}>
                        {course.courseCode} - {course.courseTitle}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resource Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="resourceType"
                    value={formData.resourceType}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select Resource Type</option>
                    <option value="handouts">Handouts / Lecture Notes</option>
                    <option value="textbooks">Textbooks / PDFs</option>
                    <option value="pastquestions">Past Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green2 file:text-white hover:file:bg-green1"
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-green2 hover:bg-green1 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    "Upload Material"
                  )}
                </button>
              </form>
            </motion.div>

            {/* Materials List */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={5}
              className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Uploaded Materials ({materials.length})
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner className="w-8 h-8" />
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No materials uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {material.title}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="px-2 py-0.5 bg-green2/10 text-green2 text-xs rounded">
                            {material.level}L
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            {material.semester || "N/A"}
                          </span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            {material.courseCode || material.resourceType || "N/A"}
                          </span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded capitalize">
                            {material.resourceType || "material"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {material.fileName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeleteMaterial(material.id, material.filePath)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ID Cards Tab */}
        {activeTab === "idcards" && (
          <motion.div
            variants={fadeInVariants5}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            custom={3}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              ID Card Registrations ({idCards.length})
            </h2>
            {idCards.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>No ID card registrations yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 font-medium">Photo</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Reg. No.</th>
                      <th className="text-left p-3 font-medium">Level</th>
                      <th className="text-left p-3 font-medium">Class</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {idCards.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <img
                            src={card.photoUrl}
                            alt={card.firstName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        </td>
                        <td className="p-3 font-medium">
                          {card.firstName} {card.surname}
                        </td>
                        <td className="p-3">{card.registrationNumber || "N/A"}</td>
                        <td className="p-3">{card.level}</td>
                        <td className="p-3">{card.classSet || "N/A"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              card.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : card.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {card.status || "pending"}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => printIDCard(card)}
                            className="px-3 py-1 bg-green2 text-white rounded-lg text-xs font-medium hover:bg-green1 transition-colors"
                          >
                            Print ID
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Blog Tab */}
        {activeTab === "blog" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Blog Form */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={3}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editingBlogId ? "Edit Blog Post" : "Create Blog Post"}
              </h2>
              <form onSubmit={handleSubmitBlogPost} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={blogFormData.title}
                    onChange={handleBlogInputChange}
                    placeholder="Blog post title"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={blogFormData.author}
                    onChange={handleBlogInputChange}
                    placeholder="Author name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Author Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Image
                  </label>
                  <input
                    ref={authorImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAuthorImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green2 file:text-white hover:file:bg-green1"
                  />
                  {authorImagePreview && (
                    <div className="mt-2">
                      <img
                        src={authorImagePreview}
                        alt="Author Preview"
                        className="w-16 h-16 object-cover rounded-full"
                      />
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={blogFormData.category}
                    onChange={handleBlogInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select Category</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Technology">Technology</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="News">News</option>
                    <option value="Research">Research</option>
                    <option value="Campus Life">Campus Life</option>
                    <option value="Career">Career</option>
                  </select>
                </div>

                {/* Post Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post Type
                  </label>
                  <select
                    name="postType"
                    value={blogFormData.postType}
                    onChange={handleBlogInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="top">Top (Featured on top)</option>
                    <option value="featured">Featured</option>
                    <option value="others">Others</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Top posts appear prominently at the top of the blog page
                  </p>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={blogImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBlogImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green2 file:text-white hover:file:bg-green1"
                  />
                  {blogImagePreview && (
                    <div className="mt-2">
                      <img
                        src={blogImagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Content Blocks Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Content Blocks <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addContentBlock("p")}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-medium"
                      >
                        + Paragraph
                      </button>
                      <button
                        type="button"
                        onClick={() => addContentBlock("h2")}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-medium"
                      >
                        + Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => addContentBlock("list")}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-medium"
                      >
                        + List
                      </button>
                      <button
                        type="button"
                        onClick={() => addContentBlock("img")}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium"
                      >
                        + Image
                      </button>
                    </div>
                  </div>

                  {/* Content Blocks */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {contentBlocks.map((block, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <select
                            value={block.type}
                            onChange={(e) => updateContentBlockType(index, e.target.value as ContentBlock["type"])}
                            className="text-xs p-1 border rounded"
                          >
                            <option value="p">Paragraph</option>
                            <option value="p-bold">Bold Paragraph</option>
                            <option value="h1">Heading 1</option>
                            <option value="h2">Heading 2</option>
                            <option value="list">List (comma-separated)</option>
                            <option value="img">Image</option>
                          </select>
                          <div className="flex-1" />
                          <button
                            type="button"
                            onClick={() => moveContentBlock(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveContentBlock(index, "down")}
                            disabled={index === contentBlocks.length - 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeContentBlock(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {block.type === "img" ? (
                          <div>
                            <input
                              ref={contentImageRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleContentImageUpload(index, e)}
                              className="w-full p-2 border border-gray-300 rounded text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-green2 file:text-white"
                            />
                            {block.content && (
                              <img
                                src={block.content}
                                alt="Content"
                                className="mt-2 w-full h-24 object-cover rounded"
                              />
                            )}
                            <p className="text-xs text-gray-500 mt-1">Or paste image URL:</p>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => updateContentBlock(index, e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="w-full p-2 border border-gray-300 rounded text-xs mt-1"
                            />
                          </div>
                        ) : block.type === "list" ? (
                          <div>
                            <textarea
                              value={block.content}
                              onChange={(e) => updateContentBlock(index, e.target.value)}
                              placeholder="Enter list items separated by commas: Item 1, Item 2, Item 3"
                              rows={3}
                              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Separate items with commas
                            </p>
                          </div>
                        ) : (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateContentBlock(index, e.target.value)}
                            placeholder={
                              block.type === "h1" || block.type === "h2"
                                ? "Enter heading text..."
                                : "Enter paragraph text..."
                            }
                            rows={block.type === "h1" || block.type === "h2" ? 1 : 3}
                            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-green2 hover:bg-green1 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                        <span>Saving...</span>
                      </>
                    ) : editingBlogId ? (
                      "Update Post"
                    ) : (
                      "Create Post"
                    )}
                  </button>
                  {editingBlogId && (
                    <button
                      type="button"
                      onClick={resetBlogForm}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </motion.div>

            {/* Blog Posts List */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={5}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Blog Posts ({blogPosts.length})
              </h2>
              {blogPosts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No blog posts yet.</p>
                  <p className="text-sm mt-2">Create your first blog post using the form.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto">
                  {blogPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex gap-4">
                        {post.sampleImg && (
                          <img
                            src={post.sampleImg}
                            alt={post.title}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              post.postType === "top"
                                ? "bg-green-100 text-green-800"
                                : post.postType === "featured"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {post.postType}
                            </span>
                            <span className="text-xs text-gray-500">
                              #{post.no}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            By {post.author} | {post.date}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {post.contents?.length || 0} content blocks
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleEditBlog(post)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(post.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                        <a
                          href={`/blog/posts/${encodeURIComponent(post.title)}/${post.no}/${post.postType}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Course Form */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={3}
              className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Add New Course
              </h2>
              <form onSubmit={handleSubmitCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="courseCode"
                    value={courseFormData.courseCode}
                    onChange={handleCourseInputChange}
                    placeholder="e.g., ANA 201"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="courseTitle"
                    value={courseFormData.courseTitle}
                    onChange={handleCourseInputChange}
                    placeholder="e.g., Gross Anatomy of Upper Limb"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="level"
                    value={courseFormData.level}
                    onChange={handleCourseInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select Level</option>
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level (Clinical)</option>
                    <option value="500">500 Level (Clinical)</option>
                    <option value="600">600 Level (Clinical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester (Preclinical only)
                  </label>
                  <select
                    name="semester"
                    value={courseFormData.semester}
                    onChange={handleCourseInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                    disabled={["400", "500", "600"].includes(courseFormData.level)}
                  >
                    <option value="">Select Semester</option>
                    <option value="First">First Semester</option>
                    <option value="Second">Second Semester</option>
                  </select>
                  {["400", "500", "600"].includes(courseFormData.level) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Clinical years don't have semester divisions
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Study Tip
                  </label>
                  <textarea
                    name="tip"
                    value={courseFormData.tip}
                    onChange={handleCourseInputChange}
                    placeholder="Helpful tips for students..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-green2 hover:bg-green1 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    "Add Course"
                  )}
                </button>
              </form>
            </motion.div>

            {/* Courses List */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={5}
              className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Added Courses ({courses.length})
              </h2>
              {courses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No courses added yet.</p>
                  <p className="text-sm mt-2">
                    Note: Static courses are defined in the codebase. Use this to add additional courses.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-green2 text-sm">
                            {course.courseCode}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                            {course.level}L
                          </span>
                          {course.semester && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              {course.semester}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {course.courseTitle}
                        </h3>
                        {course.tip && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            Tip: {course.tip}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Learning Resources Levels Tab */}
        {activeTab === "levels" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Level Form */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={3}
              className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editingLevelId ? "Edit Level" : "Add New Level"}
              </h2>
              <form onSubmit={handleSubmitLevel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="level"
                    value={levelFormData.level}
                    onChange={handleLevelInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select Level</option>
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                    <option value="500">500 Level</option>
                    <option value="600">600 Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={levelFormData.title}
                    onChange={handleLevelInputChange}
                    placeholder="e.g., 100 Level (Year 1)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="desc"
                    value={levelFormData.desc}
                    onChange={handleLevelInputChange}
                    placeholder="Description of what students learn at this level..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="section"
                    value={levelFormData.section}
                    onChange={handleLevelInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="preclinical">Preclinical (Year 1-3)</option>
                    <option value="clinical">Clinical (Year 4-6)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Preclinical: 100-300 Level | Clinical: 400-600 Level
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-green2 hover:bg-green1 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                        <span>{editingLevelId ? "Updating..." : "Adding..."}</span>
                      </>
                    ) : (
                      editingLevelId ? "Update Level" : "Add Level"
                    )}
                  </button>
                  {editingLevelId && (
                    <button
                      type="button"
                      onClick={resetLevelForm}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </motion.div>

            {/* Levels List */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={5}
              className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Learning Resource Levels ({levels.length})
              </h2>
              
              {/* Info Box */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Add levels here to customize the Learning Resources page. 
                  These will override the default static levels defined in the code.
                </p>
              </div>

              {levels.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No custom levels added yet.</p>
                  <p className="text-sm mt-2">
                    Default levels (100-600) are currently being used from the static configuration.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preclinical Levels */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      Preclinical (Year 1-3)
                    </h3>
                    <div className="space-y-2">
                      {levels
                        .filter((l) => l.section === "preclinical")
                        .sort((a, b) => a.order - b.order)
                        .map((level) => (
                          <div
                            key={level.id}
                            className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-green2 text-sm">
                                  {level.level}L
                                </span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  Preclinical
                                </span>
                              </div>
                              <h3 className="font-medium text-gray-900 text-sm">
                                {level.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {level.desc}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditLevel(level)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(level.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      {levels.filter((l) => l.section === "preclinical").length === 0 && (
                        <p className="text-sm text-gray-400 py-2">No preclinical levels added</p>
                      )}
                    </div>
                  </div>

                  {/* Clinical Levels */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Clinical (Year 4-6)
                    </h3>
                    <div className="space-y-2">
                      {levels
                        .filter((l) => l.section === "clinical")
                        .sort((a, b) => a.order - b.order)
                        .map((level) => (
                          <div
                            key={level.id}
                            className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-green2 text-sm">
                                  {level.level}L
                                </span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                  Clinical
                                </span>
                              </div>
                              <h3 className="font-medium text-gray-900 text-sm">
                                {level.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {level.desc}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditLevel(level)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(level.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      {levels.filter((l) => l.section === "clinical").length === 0 && (
                        <p className="text-sm text-gray-400 py-2">No clinical levels added</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Course Outlines Tab */}
        {activeTab === "outlines" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Outline Form */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={3}
              className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editingOutlineId ? "Edit Course Outline" : "Add New Course Outline"}
              </h2>
              <form onSubmit={handleSubmitOutline} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="courseCode"
                      value={outlineFormData.courseCode}
                      onChange={handleOutlineInputChange}
                      placeholder="e.g., PHY101"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Unit
                    </label>
                    <input
                      type="number"
                      name="creditUnit"
                      value={outlineFormData.creditUnit || ""}
                      onChange={handleOutlineInputChange}
                      placeholder="e.g., 4"
                      min="0"
                      max="10"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="courseTitle"
                    value={outlineFormData.courseTitle}
                    onChange={handleOutlineInputChange}
                    placeholder="e.g., GENERAL PHYSICS I"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Units Format
                  </label>
                  <input
                    type="text"
                    name="creditUnits"
                    value={outlineFormData.creditUnits}
                    onChange={handleOutlineInputChange}
                    placeholder="e.g., (2, 1, 1)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="level"
                      value={outlineFormData.level}
                      onChange={handleOutlineInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                    >
                      <option value="">Select</option>
                      <option value="100">100L</option>
                      <option value="200">200L</option>
                      <option value="300">300L</option>
                      <option value="400">400L</option>
                      <option value="500">500L</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="semester"
                      value={outlineFormData.semester}
                      onChange={handleOutlineInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                    >
                      <option value="">Select</option>
                      <option value="First">First</option>
                      <option value="Second">Second</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pre-Requisite
                  </label>
                  <input
                    type="text"
                    name="preRequisite"
                    value={outlineFormData.preRequisite}
                    onChange={handleOutlineInputChange}
                    placeholder="e.g., Credit O'Level Physics"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Content Blocks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Course Content <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addOutlineInfoBlock}
                      className="text-xs text-green2 hover:text-green1 font-medium"
                    >
                      + Add Section
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {outlineInfoBlocks.map((block, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">Section {index + 1}</span>
                          {outlineInfoBlocks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOutlineInfoBlock(index)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={block.heading}
                          onChange={(e) => updateOutlineInfoBlock(index, "heading", e.target.value)}
                          placeholder="Section heading (optional)"
                          className="w-full p-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-xs"
                        />
                        <textarea
                          value={block.content}
                          onChange={(e) => updateOutlineInfoBlock(index, "content", e.target.value)}
                          placeholder="Course content description..."
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-xs resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-green2 hover:bg-green1 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                        <span>{editingOutlineId ? "Updating..." : "Adding..."}</span>
                      </>
                    ) : (
                      editingOutlineId ? "Update Outline" : "Add Outline"
                    )}
                  </button>
                  {editingOutlineId && (
                    <button
                      type="button"
                      onClick={resetOutlineForm}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </motion.div>

            {/* Outlines List */}
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={5}
              className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Course Outlines ({courseOutlines.length})
                </h2>
              </div>

              {/* Info Box */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Note:</strong> Course outlines added here will be visible to students on the Course Outlines page.
                  Students can filter by level, semester, and course code.
                </p>
              </div>

              {courseOutlines.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No course outlines added yet.</p>
                  <p className="text-sm mt-2">
                    Add course outlines to help students access course information.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {/* Group by Level */}
                  {["100", "200", "300", "400", "500"].map((level) => {
                    const levelOutlines = courseOutlines.filter(o => o.level === level);
                    if (levelOutlines.length === 0) return null;
                    
                    return (
                      <div key={level} className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 sticky top-0 bg-white py-1">
                          <span className="w-3 h-3 bg-green2 rounded-full"></span>
                          {level} Level ({levelOutlines.length} courses)
                        </h3>
                        <div className="space-y-2">
                          {levelOutlines.map((outline) => (
                            <div
                              key={outline.id}
                              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-bold text-green2 text-sm">
                                    {outline.courseCode}
                                  </span>
                                  <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                    {outline.level}L
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    outline.semester === "First" 
                                      ? "bg-blue-100 text-blue-700" 
                                      : "bg-purple-100 text-purple-700"
                                  }`}>
                                    {outline.semester} Semester
                                  </span>
                                  {outline.creditUnit > 0 && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                      {outline.creditUnit} Units
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-medium text-gray-900 text-sm">
                                  {outline.courseTitle}
                                </h3>
                                {outline.info && outline.info.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {outline.info[0].content}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4 flex-shrink-0">
                                <button
                                  onClick={() => handleEditOutline(outline)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteOutline(outline.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
