import { FC, useState } from "react";
import { convertBytes } from "../../../helpers/convertBytes";
import { Content } from "../../../models/academics/learning-resources";
import { notifyUser } from "../../../helpers/notifyUser";
import { Spinner } from "../../../components/loaders/Spinner";
import { Tooltip } from "flowbite-react";
import { customTooltipTheme } from "../../../themes/customTooltip";
import { FileDownloadIcon } from "../../../components/icons/general/FileDownloadIcon";
import { useGetUserInfo } from "../../../hooks/auth/useGetUserInfo";
import { getAppwriteFileDownloadUrl, APPWRITE_BUCKETS } from "../../../config/appwrite";

interface ContentCardProps extends Content {
  description?: string;
  url?: string;
}

export const ContentCard: FC<ContentCardProps> = ({ name, size, path, description, url }) => {
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
      
      // Extract file ID from the path (Appwrite format)
      // The path format should be like the file ID for Appwrite
      const fileId = path; // path contains the Appwrite file ID
      
      const downloadUrl = getAppwriteFileDownloadUrl(
        APPWRITE_BUCKETS.LEARNING_RESOURCES,
        fileId
      );

      // Create download link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setFileLoading(false);
      notifyUser("success", "File Downloading...");
    } catch (error) {
      setFileLoading(false);
      notifyUser("error", "Something went wrong. Please try again");
      console.error("Error downloading file:", error);
    }
  };

  return (
    <div
      className={`w-full ${description ? 'min-h-[120px] sss:min-h-[160px]' : 'h-[100px] sss:h-[140px]'} border border-gray-300
      hover:bg-gray-100 hover:border-green1 transition duration-150 rounded-md p-2 ss:p-4 `}
    >
      <div className="relative h-full w-full flex flex-col">
        <p className="text-ss sss:text-sm xsm:text-base font-semibold text-wrap line-clamp-2">
          {name}
        </p>
        {description && (
          <p className="text-xss sss:text-ss text-gray-500 mt-1 line-clamp-2">{description}</p>
        )}
        <div className="flex-1" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-ss font-[500] text-gray-700">
            {dataSize}
          </span>
        <div>
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
    </div>
  );
};
