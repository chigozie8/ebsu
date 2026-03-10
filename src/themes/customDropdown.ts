import type { CustomFlowbiteTheme } from "flowbite-react";

export const customDropdownTheme: CustomFlowbiteTheme["dropdown"] = {
  arrowIcon: "ml-0.5 h-4 w-4",
  floating: {
    base: "z-10 w-fit rounded-lg divide-y divide-gray-100 shadow-lg focus:outline-none bg-white",
    content: "py-1 text-sm text-gray-700 bg-white rounded-lg",
    item: {
      container: "bg-white",
      base: "flex items-center justify-start px-4 py-2 ss:px-4 ss:text-sm text-ss text-gray-700 cursor-pointer w-full bg-white hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
      icon: "mr-2 h-4 w-4 text-gray-700",
    },
  },
};
