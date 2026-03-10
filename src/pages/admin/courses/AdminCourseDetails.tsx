/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import { useFetchCourseOutlines, ICourseContent } from "../../../hooks/useFetchCourseOutlines";
import { Spinner, Button, Modal, TextInput, Textarea, Select, Label } from "flowbite-react";
import { HiPlus, HiPencil, HiTrash, HiArrowLeft } from "react-icons/hi";
import { customButtonTheme } from "../../../themes/customButtton";

export default function AdminCourseDetails() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentItems, setContentItems] = useState<ICourseContent[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    courseCode: courseCode || "",
    courseTitle: "",
    creditUnit: 1,
    creditUnits: "(1-0-0)",
    preRequisite: "",
    level: "100",
    semester: "First",
  });

  const {
    courseDetail,
    courseDetailLoading,
    courseDetailError,
    fetchCourseDetail,
    addCourseDetail,
    updateCourseDetail,
  } = useFetchCourseOutlines();

  useEffect(() => {
    if (courseCode) {
      fetchCourseDetail(courseCode);
    }
  }, [courseCode]);

  useEffect(() => {
    if (courseDetail) {
      setFormData({
        courseCode: courseDetail.courseCode,
        courseTitle: courseDetail.courseTitle,
        creditUnit: courseDetail.creditUnit,
        creditUnits: courseDetail.creditUnits || "",
        preRequisite: courseDetail.preRequisite || "",
        level: courseDetail.level || "100",
        semester: courseDetail.semester || "First",
      });
      setContentItems(courseDetail.info || []);
    }
  }, [courseDetail]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditUnit" ? parseInt(value) : value,
    }));
  };

  const handleAddContentItem = () => {
    setContentItems([...contentItems, { heading: "", content: "" }]);
  };

  const handleContentChange = (index: number, field: "heading" | "content", value: string) => {
    const updated = [...contentItems];
    updated[index][field] = value;
    setContentItems(updated);
  };

  const handleRemoveContentItem = (index: number) => {
    setContentItems(contentItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    const data = {
      ...formData,
      info: contentItems,
    };

    let success = false;
    if (courseDetail?.id) {
      success = await updateCourseDetail(courseDetail.id, data);
    } else {
      success = await addCourseDetail(data);
    }

    setIsSubmitting(false);
    if (success) {
      setShowModal(false);
      fetchCourseDetail(courseCode || "");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1000px] w-full mx-auto">
        <div className="pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10 px-4">
          <div className="flex items-center gap-4 mb-6">
            <NavLink
              to="/admin/courses"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <HiArrowLeft className="w-5 h-5" />
              Back to Courses
            </NavLink>
          </div>

          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Details: {courseCode}</h1>
              <p className="text-gray-600">Manage course outline and content</p>
            </div>
            <Button
              theme={customButtonTheme}
              color="primary"
              onClick={() => setShowModal(true)}
            >
              <HiPencil className="w-5 h-5 mr-2" />
              {courseDetail ? "Edit Details" : "Add Details"}
            </Button>
          </div>

          {courseDetailLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : courseDetailError ? (
            <div className="text-center py-10">
              <p className="text-red-500">Failed to load course details.</p>
            </div>
          ) : !courseDetail ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">No course details found for {courseCode}</p>
              <Button
                theme={customButtonTheme}
                color="primary"
                onClick={() => setShowModal(true)}
              >
                <HiPlus className="w-5 h-5 mr-2" />
                Add Course Details
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{courseDetail.courseTitle}</h2>
                <div className="flex gap-4 text-sm text-gray-600 mt-2">
                  <span>Code: {courseDetail.courseCode}</span>
                  <span>Credit Units: {courseDetail.creditUnit}</span>
                  {courseDetail.creditUnits && <span>{courseDetail.creditUnits}</span>}
                </div>
                {courseDetail.preRequisite && (
                  <p className="text-sm text-gray-600 mt-2">
                    Pre-requisite: {courseDetail.preRequisite}
                  </p>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Course Outline Content
              </h3>
              {courseDetail.info?.length === 0 ? (
                <p className="text-gray-500">No content sections added yet.</p>
              ) : (
                <div className="space-y-4">
                  {courseDetail.info?.map((item, index) => (
                    <div key={index} className="border-b pb-4">
                      {item.heading && (
                        <h4 className="font-semibold text-gray-800">{item.heading}</h4>
                      )}
                      {item.content && <p className="text-gray-600 mt-1">{item.content}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Details Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="4xl">
        <Modal.Header>
          {courseDetail ? "Edit Course Details" : "Add Course Details"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courseCode">Course Code</Label>
                <TextInput
                  id="courseCode"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  disabled={!!courseDetail}
                />
              </div>
              <div>
                <Label htmlFor="courseTitle">Course Title</Label>
                <TextInput
                  id="courseTitle"
                  name="courseTitle"
                  value={formData.courseTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Polymer Science"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="creditUnit">Credit Units</Label>
                <TextInput
                  id="creditUnit"
                  name="creditUnit"
                  type="number"
                  min={1}
                  max={6}
                  value={formData.creditUnit}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="creditUnits">Credit Format</Label>
                <TextInput
                  id="creditUnits"
                  name="creditUnits"
                  value={formData.creditUnits}
                  onChange={handleInputChange}
                  placeholder="e.g., (2-1-0)"
                />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                >
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                >
                  <option value="First">First</option>
                  <option value="Second">Second</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="preRequisite">Pre-requisite (Optional)</Label>
              <TextInput
                id="preRequisite"
                name="preRequisite"
                value={formData.preRequisite}
                onChange={handleInputChange}
                placeholder="e.g., PTE 101"
              />
            </div>

            {/* Content Sections */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Content Sections</Label>
                <Button size="sm" color="light" onClick={handleAddContentItem}>
                  <HiPlus className="w-4 h-4 mr-1" />
                  Add Section
                </Button>
              </div>

              {contentItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No content sections. Click "Add Section" to start.</p>
              ) : (
                <div className="space-y-4">
                  {contentItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveContentItem(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                      <div className="space-y-3">
                        <div>
                          <Label>Heading</Label>
                          <TextInput
                            value={item.heading || ""}
                            onChange={(e) => handleContentChange(index, "heading", e.target.value)}
                            placeholder="e.g., Course Description, Objectives, etc."
                          />
                        </div>
                        <div>
                          <Label>Content</Label>
                          <Textarea
                            value={item.content || ""}
                            onChange={(e) => handleContentChange(index, "content", e.target.value)}
                            placeholder="Enter the content for this section..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            theme={customButtonTheme}
            color="primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner size="sm" /> : "Save Details"}
          </Button>
          <Button color="gray" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
