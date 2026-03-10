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
      
      // List files from Supabase Storage
      const { data, error: listError } = await supabase.storage
        .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (listError) {
        throw listError;
      }

      // Map files to FileMetadata format
      const fileList: FileMetadata[] = (data || [])
        .filter(item => item.name && !item.name.startsWith('.')) // Filter out hidden files
        .map((item) => ({
          name: item.name,
          path: `${folderPath}/${item.name}`,
          size: item.metadata?.size || 0,
          url: getPublicUrl(STORAGE_BUCKETS.LEARNING_RESOURCES, `${folderPath}/${item.name}`),
        }));

      setFiles(fileList);
      setLoading(false);
      console.log(fileList);
    } catch (error) {
      setError(true);
      setLoading(false);
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [resourcesType]);

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
