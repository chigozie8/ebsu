import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-sm mx-auto">

        {/* Animated SVG illustration */}
        <div className="flex justify-center mb-6">
          <div className="relative w-36 h-36">
            {/* Outer pulse ring */}
            <span className="absolute inset-0 rounded-full bg-green1/10 animate-ping opacity-50" />
            <span className="relative flex items-center justify-center w-36 h-36 rounded-full bg-green1/5 border border-green1/10">
              <svg
                viewBox="0 0 80 80"
                width="72"
                height="72"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Compass / lost icon */}
                <circle cx="40" cy="40" r="28" stroke="#00875a" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="40" cy="40" r="5" fill="#00875a" />
                {/* North arrow (pointing off-track) */}
                <path
                  d="M40 40 L52 20"
                  stroke="#00875a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 40 40"
                    to="360 40 40"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </path>
                {/* South tail */}
                <path
                  d="M40 40 L28 60"
                  stroke="#00875a"
                  strokeOpacity="0.3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 40 40"
                    to="360 40 40"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </path>
                {/* Question mark */}
                <text
                  x="40"
                  y="44"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#00875a"
                  fontFamily="sans-serif"
                >
                  ?
                </text>
              </svg>
            </span>
          </div>
        </div>

        {/* Large decorative 404 */}
        <p className="text-[6rem] font-black text-green1/8 leading-none select-none -mb-2">
          404
        </p>

        <p className="text-sm font-semibold text-green1 uppercase tracking-widest mb-3">
          Page not found
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3 font-dmSans">
          You seem lost!
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed font-inter mb-8">
          {"Sorry, we couldn't find the page you're looking for. It may have been moved, deleted, or never existed."}
        </p>

        <div className="flex flex-col ss:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-2.5 rounded-xl bg-green1 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go back home
          </Link>
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Login &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
