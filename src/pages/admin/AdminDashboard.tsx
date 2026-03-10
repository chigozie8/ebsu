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
} from "firebase/firestore";
import { notifyUser } from "../../helpers/notifyUser";
import { Spinner } from "../../components/loaders/Spinner";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";
import { imagekitConfig, getImageKitAuthParams } from "../../config/imagekit";

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
  createdAt: any;
}

// Admin email - you can change this to your admin email
const ADMIN_EMAIL = "admin@ebsu.edu.ng";

export default function AdminDashboard() {
  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const [activeTab, setActiveTab] = useState<"materials" | "idcards">(
    "materials"
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [idCards, setIdCards] = useState<IDCardRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if user is admin
  const isAdmin =
    studentDetails?.email === ADMIN_EMAIL ||
    studentDetails?.email?.includes("admin");

  useEffect(() => {
    if (isAdmin) {
      fetchMaterials();
      fetchIDCards();
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

  const uploadFileToImageKit = async (file: File): Promise<string> => {
    const authParams = await getImageKitAuthParams();

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("publicKey", imagekitConfig.publicKey);
    formDataUpload.append("signature", authParams.signature);
    formDataUpload.append("expire", authParams.expire.toString());
    formDataUpload.append("token", authParams.token);
    formDataUpload.append("fileName", `material-${Date.now()}-${file.name}`);
    formDataUpload.append("folder", `/learning-materials`);

    const response = await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        body: formDataUpload,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const result = await response.json();
    return result.url;
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

      const fileUrl = await uploadFileToImageKit(selectedFile);

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

      // Reset form
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

      // Refresh materials list
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
                <p><strong>Date of Birth:</strong> ${card.dateOfBirth}</p>
                <p><strong>Level:</strong> ${card.level}</p>
                <p><strong>Email:</strong> ${card.email}</p>
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
            Manage learning materials and ID card registrations
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
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
        </div>

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
                          {material.category} | {material.level} |{" "}
                          {material.fileName}
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Photo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        DOB
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Level
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {idCards.map((card) => (
                      <tr
                        key={card.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <img
                            src={card.photoUrl}
                            alt={card.firstName}
                            className="w-10 h-12 object-cover rounded"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {card.firstName} {card.surname}
                        </td>
                        <td className="py-3 px-4">{card.dateOfBirth}</td>
                        <td className="py-3 px-4">{card.level}</td>
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
