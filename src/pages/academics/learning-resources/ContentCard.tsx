import { FC, useState } from "react";
import { convertBytes } from "../../../helpers/convertBytes";
import { supabase, STORAGE_BUCKETS } from "../../../config/supabase";
import { Content } from "../../../models/academics/learning-resources";
import { notifyUser } from "../../../helpers/notifyUser";
import { Spinner } from "../../../components/loaders/Spinner";
import { Tooltip } from "flowbite-react";
import { customTooltipTheme } from "../../../themes/customTooltip";
import { FileDownloadIcon } from "../../../components/icons/general/FileDownloadIcon";
import { useGetUserInfo } from "../../../hooks/auth/useGetUserInfo";

export const ContentCard: FC<Content> = ({ name, size, path }) => {
  const [fileLoading, setFileLoading] = useState(false);
  const dataSize = convertBytes(size);
  const { user } = useGetUserInfo();

  const downloadFile = async () => {
    if (!user) {
      notifyUser("info", "Please login to access this feature.");
      return;
    }
    try {
      setFileLoading(true);
      notifyUser("loading", "Please wait...");
      
      // Download file from Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
        .download(path);

      if (error) {
        throw error;
      }

      // Create download link
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(data);
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      
      setFileLoading(false);
      notifyUser("success", "File Downloading...");
    } catch (error) {
      setFileLoading(false);
      notifyUser("error", "Something went wrong. Please try again");
    }
  };

  return (
    <div
      className="w-full h-[100px] sss:h-[140px] border border-gray-300
      hover:bg-gray-100 hover:border-green1 transition duration-150 rounded-md p-2 ss:p-4 "
    >
      <div className="relative h-full w-full">
        <p className="text-ss  sss:text-sm xsm:text-base font-semibold text-wrap ">
          {name}
        </p>
        <span className="text-ss font-[500] absolute bottom-0 left-0 text-gray-700">
          {dataSize}
        </span>
        <div className="absolute bottom-0 right-0">
          {fileLoading ? (
            <Spinner className="w-4 sm:w-6" />
          ) : (
            <Tooltip
              content="Download"
              animation="duration-500"
              theme={customTooltipTheme}
            >
              <button onClick={downloadFile}>
                <FileDownloadIcon className="mt-1 w-5 md:w-6" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
