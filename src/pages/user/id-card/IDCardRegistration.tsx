/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { useGetUserInfo } from "../../../hooks/auth/useGetUserInfo";
import { db } from "../../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { notifyUser } from "../../../helpers/notifyUser";
import { Spinner } from "../../../components/loaders/Spinner";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../../animation/variants";
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from "../../../config/supabase";
import { useLocation, useNavigate } from "react-router-dom";

export default function IDCardRegistration() {
  const { userID, studentDetails } = useGetUserInfo();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment receipt state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Get payment info passed from the payment page
  const paymentVerified = location.state?.paymentVerified as boolean | undefined;
  const payerName = location.state?.payerName as string | undefined;
  const paystackReference = location.state?.paystackReference as string | undefined;
  const amountPaid = location.state?.amountPaid as number | undefined;

  // Guard: if user navigated here directly without going through payment, send them back
  useEffect(() => {
    if (!paymentVerified) {
      navigate("/u/id-card-payment", { replace: true });
    }
  }, [paymentVerified, navigate]);

  const [formData, setFormData] = useState({
    firstName: studentDetails?.firstName || "",
    surname: studentDetails?.lastName || "",
    email: studentDetails?.email || "",
    phoneNumber: "",
    dateOfBirth: "",
    level: studentDetails?.level || "",
    classSet: "",
    registrationNumber: studentDetails?.regNo || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        notifyUser("error", "Please select a valid image file");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        notifyUser("error", "Please select a valid image or PDF file");
        return;
      }
      setReceiptFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview("pdf");
      }
    }
  };

  const uploadImageToSupabase = async (file: File, bucketPath: string): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userID}/${bucketPath}-${Date.now()}.${fileExt}`;
    const bucket = bucketPath === "receipt"
      ? STORAGE_BUCKETS.PAYMENT_RECEIPTS
      : STORAGE_BUCKETS.ID_CARDS;

    const { data, error } = await supabaseAdmin.storage
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.surname || !formData.email || !formData.phoneNumber || !formData.dateOfBirth || !formData.level || !formData.classSet || !formData.registrationNumber) {
      notifyUser("error", "Please fill in all required fields");
      return;
    }

    if (!imageFile) {
      notifyUser("error", "Please upload a passport photo");
      return;
    }

    if (!receiptFile) {
      notifyUser("error", "Please upload your payment receipt");
      return;
    }

    if (!userID) {
      notifyUser("error", "You must be logged in to register");
      return;
    }

    setIsSubmitting(true);

    try {
      notifyUser("loading", "Uploading your ID card registration...");

      // Upload passport photo
      const imageUrl = await uploadImageToSupabase(imageFile, "id-card");

      // Upload payment receipt
      const receiptUrl = await uploadImageToSupabase(receiptFile!, "receipt");

      // Save to Firestore
      await addDoc(collection(db, "idCardRegistrations"), {
        userId: userID,
        email: formData.email,
        firstName: formData.firstName,
        surname: formData.surname,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        level: formData.level,
        classSet: formData.classSet,
        registrationNumber: formData.registrationNumber,
        photoUrl: imageUrl,
        paymentReceiptUrl: receiptUrl,
        payerName: payerName || "",
        paystackReference: paystackReference || "",
        amountPaid: amountPaid || 2000,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Send email notification via Resend
      try {
        await fetch("/api/send-id-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            surname: formData.surname,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            dateOfBirth: formData.dateOfBirth,
            level: formData.level,
            classSet: formData.classSet,
            registrationNumber: formData.registrationNumber,
            photoUrl: imageUrl,
          }),
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
        // Don't fail the whole submission if email fails
      }

      notifyUser("success", "ID Card registration submitted successfully!");

      // Reset form
      setFormData({
        firstName: "",
        surname: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        level: "",
        classSet: "",
        registrationNumber: "",
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error("Error submitting registration:", error);
      notifyUser("error", "Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          variants={fadeInVariants5}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          custom={1}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            ID Card Registration
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Fill in your details below to register for your student ID card.
          </p>

          {/* Payment verified banner */}
          {paymentVerified && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden mb-6 border border-green-200 shadow-sm"
            >
              <div className="bg-[#00875a] px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Payment Successful</p>
                  <p className="text-white/70 text-xs">Your Paystack payment has been confirmed</p>
                </div>
              </div>
              {paystackReference && (
                <div className="bg-green-50 px-4 py-2.5 flex items-center justify-between gap-2">
                  <p className="text-xs text-green-700 font-medium">Reference:</p>
                  <p className="text-xs text-green-900 font-mono font-bold truncate">{paystackReference}</p>
                </div>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green2 transition-colors overflow-hidden bg-white"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mx-auto text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs text-gray-500">Upload Photo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Click to upload passport photo
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Enter surname"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                />
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
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                  <option value="500L">500 Level</option>
                  <option value="600L">600 Level</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  placeholder="Ebsu/2019/99999"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your registration number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="classSet"
                  value={formData.classSet}
                  onChange={handleInputChange}
                  placeholder="018, 019, 020"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green2 focus:border-transparent outline-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your class set (e.g., 018, 019, 020)</p>
              </div>
            </div>

            {/* Payment Receipt Upload */}
            <div className="rounded-2xl border-2 border-dashed border-[#00875a]/30 bg-green-50/30 overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-[#00875a]/10">
                <div className="w-8 h-8 rounded-xl bg-[#00875a]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#00875a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Payment Receipt <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-gray-500">Upload screenshot or photo of your Paystack receipt</p>
                </div>
              </div>
              <div className="p-4">
                <div
                  onClick={() => receiptInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#00875a]/25 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#00875a]/50 hover:bg-[#00875a]/5 transition-all overflow-hidden bg-white min-h-[120px]"
                >
                  {receiptPreview && receiptPreview !== "pdf" ? (
                    <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-52 object-contain" />
                  ) : receiptPreview === "pdf" ? (
                    <div className="text-center p-6">
                      <svg className="h-10 w-10 mx-auto text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-600 font-medium">{receiptFile?.name}</span>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#00875a]/10 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-[#00875a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click to upload receipt</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF — max 10MB</p>
                    </div>
                  )}
                </div>
                <input ref={receiptInputRef} type="file" accept="image/*,application/pdf" onChange={handleReceiptChange} className="hidden" />
                {receiptFile && (
                  <div className="flex items-center gap-2 mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-xs text-green-700 font-medium truncate">{receiptFile.name}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green2 hover:bg-green1 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-5 h-5 text-transparent animate-spin fill-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit Registration"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
