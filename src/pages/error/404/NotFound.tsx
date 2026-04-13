import { Button } from "flowbite-react";
import { customButtonTheme } from "../../../themes/customButtton";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        {/* Large decorative 404 */}
        <p className="text-[7rem] sm:text-[10rem] font-black text-green1/10 leading-none select-none">
          404
        </p>
        <p className="text-base font-semibold text-green1 -mt-6">Page not found</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Oops! This page does not exist.
        </h1>
        <p className="mt-4 text-sm leading-7 text-gray-500 max-w-sm mx-auto">
          {"Sorry, we couldn't find the page you're looking for. It may have been moved or deleted."}
        </p>
        <div className="mt-10 flex flex-col ss:flex-row gap-y-4 items-center justify-center gap-x-6">
          <Button
            theme={customButtonTheme}
            color="primary"
            size="lg"
            href="/"
          >
            Go back home
          </Button>
          <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-green1 transition-colors">
            Login <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
