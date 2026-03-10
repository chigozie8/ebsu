import { FC } from "react";
import { AppProviderProps } from "../models/provider/provider";
import GPAContextProvider from "../context/GPA";
import ModalContextProvider from "../context/Modal";
import CourseOutlineContextProvider from "../context/CourseOutline";
import LearningResourcesContextProvider from "../context/LearningResources";
import { ThemeProvider } from "../context/Theme";

const AppProvider: FC<AppProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <ModalContextProvider>
        <LearningResourcesContextProvider>
          <GPAContextProvider>
            <CourseOutlineContextProvider>
              {children}
            </CourseOutlineContextProvider>
          </GPAContextProvider>
        </LearningResourcesContextProvider>
      </ModalContextProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
