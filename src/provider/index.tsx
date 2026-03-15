import { FC } from "react";
import { SWRConfig } from "swr";
import { AppProviderProps } from "../models/provider/provider";
import GPAContextProvider from "../context/GPA";
import ModalContextProvider from "../context/Modal";
import CourseOutlineContextProvider from "../context/CourseOutline";
import LearningResourcesContextProvider from "../context/LearningResources";

// Global SWR config — cache data for 5 minutes, no re-fetch on tab focus or reconnect
const swrConfig = {
  dedupingInterval: 5 * 60 * 1000,   // dedupe identical requests within 5 min
  revalidateOnFocus: false,            // don't re-fetch when tab regains focus
  revalidateOnReconnect: false,        // don't re-fetch on network reconnect
  shouldRetryOnError: false,           // don't retry on Firestore errors
};

const AppProvider: FC<AppProviderProps> = ({ children }) => {
  return (
    <SWRConfig value={swrConfig}>
      <ModalContextProvider>
        <LearningResourcesContextProvider>
          <GPAContextProvider>
            <CourseOutlineContextProvider>
              {children}
            </CourseOutlineContextProvider>
          </GPAContextProvider>
        </LearningResourcesContextProvider>
      </ModalContextProvider>
    </SWRConfig>
  );
};

export default AppProvider;
