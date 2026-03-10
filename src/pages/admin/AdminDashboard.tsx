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

interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  level: string;
  semester?: string;
  section: "preclinical" | "clinical";
  description?: string;
  createdAt: any;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorImage?: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  readTime: number;
  createdAt: any;
  updatedAt?: any;
}

// Admin email - add your admin email here
const ADMIN_EMAIL = "patronkwo@gmail.com";

export default function AdminDashboard() {
  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const [activeTab, setActiveTab] = useState<"materials" | "idcards" | "courses" | "blog">("materials");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [idCards, setIdCards] = useState<IDCardRegistration[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blogImageRef = useRef<HTMLInputElement>(null);

  // Material form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Course form
  const [courseFormData, setCourseFormData] = useState({
    courseCode: "",
    courseTitle: "",
    level: "",
    semester: "",
    section: "preclinical" as "preclinical" | "clinical",
    description: "",
  });

  // Blog form
  const [blogFormData, setBlogFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    author: "",
    category: "",
    tags: "",
    status: "draft" as "draft" | "published",
  });
  const [blogImage, setBlogImage] = useState<File | null>(null);
  const [blogImagePreview, setBlogImagePreview] = useState<string>("");

  // Check if user is admin
  const isAdmin =
    studentDetails?.email === ADMIN_EMAIL ||
    studentDetails?.email?.includes("admin");

  useEffect(() => {
    if (isAdmin) {
      fetchMaterials();
      fetchIDCards();
      fetchCourses();
      fetchBlogPosts();
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
      })) as Course[];
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCourseFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlogInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBlogFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBlogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBlogImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlogImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFileToSupabase = async (file: File, folder: string = "materials"): Promise<string> => {
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return getPublicUrl(STORAGE_BUCKETS.LEARNING_RESOURCES, data.path);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.level || !selectedFile) {
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

      setFormData({ title: "", description: "", category: "", level: "" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchMaterials();
    } catch (error: any) {
      console.error("Error uploading material:", error);
      notifyUser("error", "Failed to upload material. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseFormData.courseCode || !courseFormData.courseTitle || !courseFormData.level) {
      notifyUser("error", "Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      await addDoc(collection(db, "courses"), {
        courseCode: courseFormData.courseCode,
        courseTitle: courseFormData.courseTitle,
        level: courseFormData.level,
        semester: courseFormData.section === "preclinical" ? courseFormData.semester : null,
        section: courseFormData.section,
        description: courseFormData.description,
        createdAt: serverTimestamp(),
      });

      notifyUser("success", "Course added successfully!");

      setCourseFormData({
        courseCode: "",
        courseTitle: "",
        level: "",
        semester: "",
        section: "preclinical",
        description: "",
      });
      fetchCourses();
    } catch (error: any) {
      console.error("Error adding course:", error);
      notifyUser("error", "Failed to add course. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishBlog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blogFormData.title || !blogFormData.content || !blogFormData.author) {
      notifyUser("error", "Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      notifyUser("loading", "Publishing blog post...");

      let imageUrl = "";
      if (blogImage) {
        imageUrl = await uploadFileToSupabase(blogImage, "blog-images");
      }

      // Calculate read time (average 200 words per minute)
      const wordCount = blogFormData.content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);

      await addDoc(collection(db, "blogPosts"), {
        title: blogFormData.title,
        content: blogFormData.content,
        excerpt: blogFormData.excerpt || blogFormData.content.substring(0, 150) + "...",
        author: blogFormData.author,
        authorImage: studentDetails?.profileImageURL || "",
        imageUrl: imageUrl,
        category: blogFormData.category || "General",
        tags: blogFormData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        status: blogFormData.status,
        readTime: readTime,
        createdAt: serverTimestamp(),
      });

      notifyUser("success", "Blog post published successfully!");

      setBlogFormData({
        title: "",
        content: "",
        excerpt: "",
        author: "",
        category: "",
        tags: "",
        status: "draft",
      });
      setBlogImage(null);
      setBlogImagePreview("");
      if (blogImageRef.current) blogImageRef.current.value = "";
      fetchBlogPosts();
    } catch (error: any) {
      console.error("Error publishing blog:", error);
      notifyUser("error", "Failed to publish blog post. Please try again.");
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

  const handleDeleteBlogPost = async (postId: string) => {
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

  const toggleBlogStatus = async (postId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      await updateDoc(doc(db, "blogPosts", postId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      notifyUser("success", `Post ${newStatus === "published" ? "published" : "unpublished"} successfully`);
      fetchBlogPosts();
    } catch (error) {
      console.error("Error updating blog status:", error);
      notifyUser("error", "Failed to update blog status");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="bg-gray-50 min-h-screen pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10">
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
            Manage learning materials, courses, ID cards, and blog posts
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
            Materials
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
            onClick={() => setActiveTab("idcards")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "idcards"
                ? "bg-green2 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            ID Cards
          </button>
        </div>

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <div className="grid lg:grid-cols-3 gap-6">
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
                    placeholder="e.g., Anatomy Lecture Notes"
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
                    <option value="">Select Category</option>
                    <option value="books">Books</option>
                    <option value="handouts">Handouts</option>
                    <option value="pastQuestions">Past Questions</option>
                    <option value="notes">Lecture Notes</option>
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
                    <option value="all">All Levels</option>
                    <option value="100L">100 Level</option>
                    <option value="200L">200 Level</option>
                    <option value="300L">300 Level</option>
                    <option value="400L">400 Level</option>
                    <option value="500L">500 Level</option>
                    <option value="600L">600 Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png,.jpeg"
                    onChange={handleFileChange}
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
                <div className="flex items-center justify-center py-10">
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
                        <p className="text-xs text-gray-500">
                          {material.category} | {material.level} | {material.fileName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
              <form onSubmit={handleAddCourse} className="space-y-4">
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
                    Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="section"
                    value={courseFormData.section}
                    onChange={handleCourseInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="preclinical">Preclinical (Year 1-3)</option>
                    <option value="clinical">Clinical (Year 4-6)</option>
                  </select>
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
                    {courseFormData.section === "preclinical" ? (
                      <>
                        <option value="100">100 Level</option>
                        <option value="200">200 Level</option>
                        <option value="300">300 Level</option>
                      </>
                    ) : (
                      <>
                        <option value="400">400 Level</option>
                        <option value="500">500 Level</option>
                        <option value="600">600 Level</option>
                      </>
                    )}
                  </select>
                </div>

                {courseFormData.section === "preclinical" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="semester"
                      value={courseFormData.semester}
                      onChange={handleCourseInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                    >
                      <option value="">Select Semester</option>
                      <option value="First">First Semester</option>
                      <option value="Second">Second Semester</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={courseFormData.description}
                    onChange={handleCourseInputChange}
                    placeholder="Course description..."
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

            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={5}
              className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Courses ({courses.length})
              </h2>
              {courses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No courses added yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {course.courseCode} - {course.courseTitle}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {course.level}L | {course.section} 
                          {course.semester && ` | ${course.semester} Semester`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === "blog" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={3}
              className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Create Blog Post
              </h2>
              <form onSubmit={handlePublishBlog} className="space-y-4">
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
                    <option value="News">News</option>
                    <option value="Academic">Academic</option>
                    <option value="Events">Events</option>
                    <option value="Health">Health</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Sports">Sports</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    value={blogFormData.excerpt}
                    onChange={handleBlogInputChange}
                    placeholder="Brief excerpt (auto-generated if empty)..."
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={blogFormData.content}
                    onChange={handleBlogInputChange}
                    placeholder="Write your blog post content here..."
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={blogFormData.tags}
                    onChange={handleBlogInputChange}
                    placeholder="medical, student, health"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image
                  </label>
                  <input
                    ref={blogImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBlogImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green2 file:text-white hover:file:bg-green1"
                  />
                  {blogImagePreview && (
                    <img
                      src={blogImagePreview}
                      alt="Preview"
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={blogFormData.status}
                    onChange={handleBlogInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-green2 hover:bg-green1 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    "Publish Post"
                  )}
                </button>
              </form>
            </motion.div>

            <motion.div
              variants={fadeInVariants5}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              custom={5}
              className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Blog Posts ({blogPosts.length})
              </h2>
              {blogPosts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No blog posts yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {blogPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm truncate">
                              {post.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              By {post.author} | {post.category} | {post.readTime} min read
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                              post.status === "published"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {post.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => toggleBlogStatus(post.id, post.status)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={post.status === "published" ? "Unpublish" : "Publish"}
                        >
                          {post.status === "published" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteBlogPost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Photo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Reg. No.</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">DOB</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Class</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {idCards.map((card) => (
                      <tr key={card.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <img src={card.photoUrl} alt={card.firstName} className="w-10 h-12 object-cover rounded" />
                        </td>
                        <td className="py-3 px-4">{card.firstName} {card.surname}</td>
                        <td className="py-3 px-4 text-xs font-medium text-green2">{card.registrationNumber || "N/A"}</td>
                        <td className="py-3 px-4">{card.dateOfBirth}</td>
                        <td className="py-3 px-4">{card.level}</td>
                        <td className="py-3 px-4">{card.classSet || "N/A"}</td>
                        <td className="py-3 px-4">{card.phoneNumber || "N/A"}</td>
                        <td className="py-3 px-4">{card.email}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => printIDCard(card)}
                            className="px-3 py-1 bg-green2 text-white rounded-lg text-xs hover:bg-green1 transition-colors"
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
      </div>
    </div>
  );
}
