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

interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  fileUrl: string;
  fileName: string;
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

// Admin email - add your admin email here
const ADMIN_EMAIL = "patronkwo@gmail.com";

export default function AdminDashboard() {
  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const [activeTab, setActiveTab] = useState<"materials" | "idcards" | "blog" | "courses">(
    "materials"
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [idCards, setIdCards] = useState<IDCardRegistration[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blogImageRef = useRef<HTMLInputElement>(null);
  const contentImageRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      !formData.category ||
      !formData.level ||
      !selectedFile
    ) {
      notifyUser("error", "Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      notifyUser("loading", "Uploading material...");

      const fileUrl = await uploadFileToSupabase(selectedFile);

      await addDoc(collection(db, "learningMaterials"), {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        fileUrl: fileUrl,
        fileName: selectedFile.name,
        uploadedBy: studentDetails?.email || "Admin",
        createdAt: serverTimestamp(),
      });

      notifyUser("success", "Material uploaded successfully!");

      setFormData({
        title: "",
        description: "",
        category: "",
        level: "",
      });
      setSelectedFile(null);
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

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
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
            Manage learning materials, ID cards, blog posts, and courses
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select category</option>
                    <option value="lecture-notes">Lecture Notes</option>
                    <option value="past-questions">Past Questions</option>
                    <option value="textbooks">Textbooks</option>
                    <option value="practicals">Practicals</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
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
                        <h3 className="font-medium text-gray-900">
                          {material.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {material.category} | Level {material.level}
                        </p>
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
                          onClick={() => handleDeleteMaterial(material.id)}
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
      </div>
    </div>
  );
}
