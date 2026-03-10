/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { supabase, STORAGE_BUCKETS, getPublicUrl } from "../../../config/supabase";
import { useParams } from "react-router-dom";
import { useLearningResourcesContext } from "../../../context/LearningResources";
import { Spinner } from "../../../components/loaders/Spinner";
import { ContentCard } from "./ContentCard";
import fileSearch from "../../../assets/svg/illustrations/fileSearch.svg";
import { FileMetadata } from "../../../models/academics/learning-resources";
import book from "../../../assets/svg/illustrations/reading.svg";
import { motion } from "framer-motion";
import { fadeInVariants1 } from "../../../animation/variants";
import { db, isFirebaseConfigured } from "../../../config/firebase";
import { collection, getDocs, query, where, and } from "firebase/firestore";

interface AdminMaterial {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  courseCode: string;
  level: string;
  semester: string;
  resourceType: string;
}

export default function Content() {
  const { level, id } = useParams();
  const { resourcesType } = useLearningResourcesContext();

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchFiles = async () => {
    const folderPath = `levels/${level}/${id}/${resourcesType}`;
    
    try {
      setError(false);
      setLoading(true);
      
      let fileList: FileMetadata[] = [];

      // 1. First fetch from Firestore (admin-uploaded materials with metadata)
      if (isFirebaseConfigured) {
        try {
          const q = query(
            collection(db, "learningMaterials"),
            and(
              where("level", "==", level),
              where("courseCode", "==", id),
              where("resourceType", "==", resourcesType)
            )
          );
          const snapshot = await getDocs(q);
          const adminMaterials = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as AdminMaterial[];

          // Add admin materials to file list
          adminMaterials.forEach(material => {
            fileList.push({
              name: material.title || material.fileName,
              path: material.filePath,
              size: material.fileSize || 0,
              url: material.fileUrl,
              description: material.description,
            });
          });
        } catch (firestoreError) {
          console.error("Error fetching from Firestore:", firestoreError);
        }
      }

      // 2. Also fetch directly from Supabase Storage (for backwards compatibility)
      try {
        const { data, error: listError } = await supabase.storage
          .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
          .list(folderPath, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' },
          });

        if (!listError && data) {
          // Map files to FileMetadata format
          const storageFiles: FileMetadata[] = data
            .filter(item => item.name && !item.name.startsWith('.'))
            .map((item) => ({
              name: item.name,
              path: `${folderPath}/${item.name}`,
              size: item.metadata?.size || 0,
              url: getPublicUrl(STORAGE_BUCKETS.LEARNING_RESOURCES, `${folderPath}/${item.name}`),
            }));

          // Add storage files that aren't already in the list (avoid duplicates)
          const existingUrls = new Set(fileList.map(f => f.url));
          storageFiles.forEach(file => {
            if (!existingUrls.has(file.url)) {
              fileList.push(file);
            }
          });
        }
      } catch (storageError) {
        console.error("Error fetching from Supabase Storage:", storageError);
      }

      setFiles(fileList);
      setLoading(false);
    } catch (error) {
      setError(true);
      setLoading(false);
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [resourcesType, level, id]);

  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center ">
        <Spinner className="fill-green1 w-8 " />
      </div>
    );
  } else if (files.length === 0) {
    if (error) {
      return (
        <div className="flex items-center justfiy-center flex-col">
          <img
            src={book}
            alt="File not available"
            className=" w-full ss:w-[300px]"
          />
          <p className="text-sm ss:text-xs text-gray-700 font-[500] text-center ">
            Oops, something went wrong. Please try again.
          </p>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center flex-col">
          <img
            src={fileSearch}
            alt="File not available"
            className=" w-full ss:w-[400px]"
          />
          <p className="text-sm ss:text-base text-gray-500 font-[500] text-center ">
            Sorry, {id}{" "}
            {resourcesType === "textbooks"
              ? "Textbooks"
              : resourcesType === "pastquestions"
                ? "Past Questions"
                : "Handouts"}{" "}
            are not available.
          </p>
        </div>
      );
    }
  } else if (files.length > 0) {
    return (
      <div className="grid items-center xss:grid-cols-2 sm:grid-cols-3 gap-4">
        {files.map((info, i) => (
          <motion.div
            variants={fadeInVariants1}
            initial="initial"
            whileInView="animate"
            viewport={{
              once: true,
            }}
            custom={i}
          >
            <ContentCard key={i} {...info} />
          </motion.div>
        ))}
      </div>
    );
  }
}
