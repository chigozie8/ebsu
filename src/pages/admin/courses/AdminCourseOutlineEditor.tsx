/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useFetchCourseOutlines, ICourse, ICourseDetail, ICourseContent } from "../../../hooks/useFetchCourseOutlines";
import { Spinner, Button, Modal, TextInput, Textarea, Select, Label, Tabs } from "flowbite-react";
import { HiPlus, HiPencil, HiTrash, HiArrowLeft, HiSave, HiX, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { customButtonTheme } from "../../../themes/customButtton";

interface CourseWithDetails extends ICourse {
  details?: ICourseDetail;
}

export default function AdminCourseOutlineEditor() {
  const [selectedLevel, setSelectedLevel] = useState<string>("100");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [coursesWithDetails, setCoursesWithDetails] = useState<CourseWithDetails[]>([]);

  // New course form state
  const [newCourseForm, setNewCourseForm] = useState({
    courseCode: "",
    courseTitle: "",
    creditUnit: 3,
    creditUnits: "(2-1-0)",
    option: "Compulsory",
    semester: "First",
    level: "100",
    preRequisite: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState<{
    courseCode: string;
    courseTitle: string;
    creditUnit: number;
    creditUnits: string;
    option: string;
    semester: string;
    preRequisite: string;
    info: ICourseContent[];
  }>({
    courseCode: "",
    courseTitle: "",
    creditUnit: 1,
    creditUnits: "",
    option: "Compulsory",
    semester: "First",
    preRequisite: "",
    info: [],
  });

  const {
    courses,
    coursesLoading,
    fetchCoursesByLevel,
    fetchCourseDetail,
    addCourse,
    addCourseDetail,
    updateCourse,
    updateCourseDetail,
    deleteCourse,
    deleteCourseDetail,
  } = useFetchCourseOutlines();

  useEffect(() => {
    fetchCoursesByLevel(selectedLevel);
  }, [selectedLevel]);

  useEffect(() => {
    // Reset when courses change
    setCoursesWithDetails(courses?.map(c => ({ ...c })) || []);
  }, [courses]);

  const handleExpandCourse = async (courseCode: string) => {
    if (expandedCourse === courseCode) {
      setExpandedCourse(null);
      return;
    }
    
    setExpandedCourse(courseCode);
    
    // Fetch details for this course
    const detail = await fetchCourseDetail(courseCode);
    if (detail) {
      setCoursesWithDetails(prev => 
        prev.map(c => c.courseCode === courseCode ? { ...c, details: detail } : c)
      );
    }
  };

  const handleStartEditing = (course: CourseWithDetails) => {
    setEditingCourse(course.courseCode);
    setEditForm({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      creditUnit: course.creditUnit,
      creditUnits: course.details?.creditUnits || "",
      option: course.option,
      semester: course.semester,
      preRequisite: course.details?.preRequisite || "",
      info: course.details?.info || [],
    });
  };

  const handleCancelEditing = () => {
    setEditingCourse(null);
    setEditForm({
      courseCode: "",
      courseTitle: "",
      creditUnit: 1,
      creditUnits: "",
      option: "Compulsory",
      semester: "First",
      preRequisite: "",
      info: [],
    });
  };

  const handleAddSection = () => {
    setEditForm(prev => ({
      ...prev,
      info: [...prev.info, { heading: "", content: "" }],
    }));
  };

  const handleRemoveSection = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      info: prev.info.filter((_, i) => i !== index),
    }));
  };

  const handleSectionChange = (index: number, field: "heading" | "content", value: string) => {
    setEditForm(prev => ({
      ...prev,
      info: prev.info.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSaveCourse = async (course: CourseWithDetails) => {
    setIsSubmitting(true);

    // Update course basic info
    if (course.id) {
      await updateCourse(course.id, {
        courseCode: editForm.courseCode,
        courseTitle: editForm.courseTitle,
        creditUnit: editForm.creditUnit,
        option: editForm.option,
        semester: editForm.semester,
        level: selectedLevel,
      });
    }

    // Update or create course details
    const detailData = {
      courseCode: editForm.courseCode,
      courseTitle: editForm.courseTitle,
      creditUnit: editForm.creditUnit,
      creditUnits: editForm.creditUnits,
      preRequisite: editForm.preRequisite,
      level: selectedLevel,
      semester: editForm.semester,
      info: editForm.info,
    };

    if (course.details?.id) {
      await updateCourseDetail(course.details.id, detailData);
    } else {
      await addCourseDetail(detailData);
    }

    setIsSubmitting(false);
    setEditingCourse(null);
    await fetchCoursesByLevel(selectedLevel);
    
    // Refresh the expanded course details
    const detail = await fetchCourseDetail(editForm.courseCode);
    if (detail) {
      setCoursesWithDetails(prev => 
        prev.map(c => c.courseCode === editForm.courseCode ? { ...c, details: detail } : c)
      );
    }
  };

  const handleDeleteCourse = async (course: CourseWithDetails) => {
    if (!confirm(`Are you sure you want to delete ${course.courseCode}?`)) return;
    
    setIsSubmitting(true);
    
    // Delete course details first
    if (course.details?.id) {
      await deleteCourseDetail(course.details.id);
    }
    
    // Delete course
    if (course.id) {
      await deleteCourse(course.id);
    }
    
    setIsSubmitting(false);
    await fetchCoursesByLevel(selectedLevel);
  };

  const handleAddNewCourse = async () => {
    setIsSubmitting(true);

    // Add course
    const courseSuccess = await addCourse({
      ...newCourseForm,
      level: selectedLevel,
    });

    if (courseSuccess) {
      // Add course details
      await addCourseDetail({
        courseCode: newCourseForm.courseCode,
        courseTitle: newCourseForm.courseTitle,
        creditUnit: newCourseForm.creditUnit,
        creditUnits: newCourseForm.creditUnits,
        preRequisite: newCourseForm.preRequisite,
        level: selectedLevel,
        semester: newCourseForm.semester,
        info: [],
      });
    }

    setIsSubmitting(false);
    setShowAddModal(false);
    setNewCourseForm({
      courseCode: "",
      courseTitle: "",
      creditUnit: 3,
      creditUnits: "(2-1-0)",
      option: "Compulsory",
      semester: "First",
      level: selectedLevel,
      preRequisite: "",
    });
    await fetchCoursesByLevel(selectedLevel);
  };

  // Group courses by semester
  const firstSemesterCourses = coursesWithDetails?.filter((c) => c.semester === "First") || [];
  const secondSemesterCourses = coursesWithDetails?.filter((c) => c.semester === "Second") || [];

  const renderCourseCard = (course: CourseWithDetails) => {
    const isExpanded = expandedCourse === course.courseCode;
    const isEditing = editingCourse === course.courseCode;

    return (
      <div
        key={course.id}
        className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
      >
        {/* Course Header */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => !isEditing && handleExpandCourse(course.courseCode)}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <HiChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <HiChevronDown className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {course.courseCode} - {course.courseTitle}
              </h3>
              <p className="text-sm text-gray-600">
                {course.creditUnit} Credit Units | {course.option}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {!isEditing && (
              <>
                <Button
                  size="sm"
                  color="light"
                  onClick={() => {
                    handleExpandCourse(course.courseCode);
                    setTimeout(() => handleStartEditing(course), 100);
                  }}
                >
                  <HiPencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  color="failure"
                  onClick={() => handleDeleteCourse(course)}
                  disabled={isSubmitting}
                >
                  <HiTrash className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4">
            {isEditing ? (
              // Edit Form
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Course Code</Label>
                    <TextInput
                      value={editForm.courseCode}
                      onChange={(e) => setEditForm(prev => ({ ...prev, courseCode: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Course Title</Label>
                    <TextInput
                      value={editForm.courseTitle}
                      onChange={(e) => setEditForm(prev => ({ ...prev, courseTitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Credit Unit</Label>
                    <TextInput
                      type="number"
                      min={1}
                      max={6}
                      value={editForm.creditUnit}
                      onChange={(e) => setEditForm(prev => ({ ...prev, creditUnit: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Credit Format</Label>
                    <TextInput
                      value={editForm.creditUnits}
                      onChange={(e) => setEditForm(prev => ({ ...prev, creditUnits: e.target.value }))}
                      placeholder="(2-1-0)"
                    />
                  </div>
                  <div>
                    <Label>Option</Label>
                    <Select
                      value={editForm.option}
                      onChange={(e) => setEditForm(prev => ({ ...prev, option: e.target.value }))}
                    >
                      <option value="Compulsory">Compulsory</option>
                      <option value="Elective">Elective</option>
                      <option value="Required">Required</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={editForm.semester}
                      onChange={(e) => setEditForm(prev => ({ ...prev, semester: e.target.value }))}
                    >
                      <option value="First">First</option>
                      <option value="Second">Second</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Pre-requisite</Label>
                  <TextInput
                    value={editForm.preRequisite}
                    onChange={(e) => setEditForm(prev => ({ ...prev, preRequisite: e.target.value }))}
                    placeholder="e.g., PTE 101 or None"
                  />
                </div>

                {/* Content Sections */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg">Course Outline Sections</Label>
                    <Button size="sm" color="light" onClick={handleAddSection}>
                      <HiPlus className="w-4 h-4 mr-1" />
                      Add Section
                    </Button>
                  </div>

                  {editForm.info.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No sections yet. Click "Add Section" to create course outline content.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {editForm.info.map((section, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                          <div className="space-y-3 pr-8">
                            <div>
                              <Label>Section Heading</Label>
                              <TextInput
                                value={section.heading || ""}
                                onChange={(e) => handleSectionChange(index, "heading", e.target.value)}
                                placeholder="e.g., Course Description, Objectives, Course Content"
                              />
                            </div>
                            <div>
                              <Label>Content</Label>
                              <Textarea
                                value={section.content || ""}
                                onChange={(e) => handleSectionChange(index, "content", e.target.value)}
                                placeholder="Enter the content for this section..."
                                rows={4}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    theme={customButtonTheme}
                    color="primary"
                    onClick={() => handleSaveCourse(course)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <HiSave className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button color="gray" onClick={handleCancelEditing}>
                    <HiX className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                {course.details ? (
                  <div className="space-y-4">
                    <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                      {course.details.creditUnits && (
                        <span>Format: {course.details.creditUnits}</span>
                      )}
                      {course.details.preRequisite && (
                        <span>Pre-requisite: {course.details.preRequisite}</span>
                      )}
                    </div>

                    {course.details.info && course.details.info.length > 0 ? (
                      <div className="space-y-3">
                        {course.details.info.map((section, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            {section.heading && (
                              <h4 className="font-semibold text-gray-800 mb-1">{section.heading}</h4>
                            )}
                            {section.content && (
                              <p className="text-gray-600 text-sm whitespace-pre-wrap">{section.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No course outline content yet.</p>
                    )}

                    <Button
                      size="sm"
                      color="light"
                      onClick={() => handleStartEditing(course)}
                    >
                      <HiPencil className="w-4 h-4 mr-2" />
                      Edit Course Outline
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="sm" />
                    <span className="ml-2 text-gray-500">Loading details...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10 px-4">
          <div className="flex items-center gap-4 mb-6">
            <NavLink
              to="/admin"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <HiArrowLeft className="w-5 h-5" />
              Back to Admin
            </NavLink>
          </div>

          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Outline Editor</h1>
              <p className="text-gray-600">Edit courses and their outlines directly</p>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-32"
              >
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </Select>
              <Button
                theme={customButtonTheme}
                color="primary"
                onClick={() => setShowAddModal(true)}
              >
                <HiPlus className="w-5 h-5 mr-2" />
                Add Course
              </Button>
            </div>
          </div>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : (
            <Tabs aria-label="Semester tabs" variant="underline">
              <Tabs.Item active title="First Semester (Harmattan)">
                {firstSemesterCourses.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">No courses for first semester</p>
                    <Button
                      theme={customButtonTheme}
                      color="primary"
                      onClick={() => {
                        setNewCourseForm(prev => ({ ...prev, semester: "First" }));
                        setShowAddModal(true);
                      }}
                    >
                      <HiPlus className="w-5 h-5 mr-2" />
                      Add First Semester Course
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {firstSemesterCourses.map(renderCourseCard)}
                  </div>
                )}
              </Tabs.Item>
              <Tabs.Item title="Second Semester (Rain)">
                {secondSemesterCourses.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">No courses for second semester</p>
                    <Button
                      theme={customButtonTheme}
                      color="primary"
                      onClick={() => {
                        setNewCourseForm(prev => ({ ...prev, semester: "Second" }));
                        setShowAddModal(true);
                      }}
                    >
                      <HiPlus className="w-5 h-5 mr-2" />
                      Add Second Semester Course
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {secondSemesterCourses.map(renderCourseCard)}
                  </div>
                )}
              </Tabs.Item>
            </Tabs>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)}>
        <Modal.Header>Add New Course</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newCourseCode">Course Code</Label>
                <TextInput
                  id="newCourseCode"
                  value={newCourseForm.courseCode}
                  onChange={(e) => setNewCourseForm(prev => ({ ...prev, courseCode: e.target.value }))}
                  placeholder="e.g., PTE 101"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newCourseTitle">Course Title</Label>
                <TextInput
                  id="newCourseTitle"
                  value={newCourseForm.courseTitle}
                  onChange={(e) => setNewCourseForm(prev => ({ ...prev, courseTitle: e.target.value }))}
                  placeholder="e.g., Introduction to Polymer Science"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="newCreditUnit">Credit Units</Label>
                <TextInput
                  id="newCreditUnit"
                  type="number"
                  min={1}
                  max={6}
                  value={newCourseForm.creditUnit}
                  onChange={(e) => setNewCourseForm(prev => ({ ...prev, creditUnit: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newCreditUnits">Format</Label>
                <TextInput
                  id="newCreditUnits"
                  value={newCourseForm.creditUnits}
                  onChange={(e) => setNewCourseForm(prev => ({ ...prev, creditUnits: e.target.value }))}
                  placeholder="(2-1-0)"
                />
              </div>
              <div>
                <Label htmlFor="newOption">Option</Label>
                <Select
                  id="newOption"
                  value={newCourseForm.option}
                  onChange={(e) => setNewCourseForm(prev => ({ ...prev, option: e.target.value }))}
                >
                  <option value="Compulsory">Compulsory</option>
                  <option value="Elective">Elective</option>
                  <option value="Required">Required</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="newSemester">Semester</Label>
                <Select
                  id="newSemester"
                  value={newCourseForm.semester}
                  onChange={(e) => setNewCourseForm(prev => ({ ...prev, semester: e.target.value }))}
                >
                  <option value="First">First</option>
                  <option value="Second">Second</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="newPreRequisite">Pre-requisite (Optional)</Label>
              <TextInput
                id="newPreRequisite"
                value={newCourseForm.preRequisite}
                onChange={(e) => setNewCourseForm(prev => ({ ...prev, preRequisite: e.target.value }))}
                placeholder="e.g., PTE 101 or None"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            theme={customButtonTheme}
            color="primary"
            onClick={handleAddNewCourse}
            disabled={isSubmitting || !newCourseForm.courseCode || !newCourseForm.courseTitle}
          >
            {isSubmitting ? <Spinner size="sm" /> : "Add Course"}
          </Button>
          <Button color="gray" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
