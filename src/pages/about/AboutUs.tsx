import Footer from "../../components/footer/Footer";
import { InstagramIcon } from "../../components/icons/socials/InstagramIcon";
import { XIcon } from "../../components/icons/socials/XIcon";
import { YouTubeIcon } from "../../components/icons/socials/YouTubeIcon";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/ebsumsaofficial?utm_source=qr&igsh=MW5mMWlrY3g4c3lxaQ==",
    icon: InstagramIcon,
    accent: "#E1306C",
    bg: "hover:border-[#E1306C]",
    iconBg: "bg-[#E1306C]",
    handle: "@ebsumsaofficial",
    cta: "Follow on Instagram",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/Ebsumsaofficial",
    icon: XIcon,
    accent: "#000000",
    bg: "hover:border-black",
    iconBg: "bg-black",
    handle: "@Ebsumsaofficial",
    cta: "Follow on X",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@ebsumsatv?si=qWJTfD2Z4L61wrBo",
    icon: YouTubeIcon,
    accent: "#FF0000",
    bg: "hover:border-[#FF0000]",
    iconBg: "bg-[#FF0000]",
    handle: "@ebsumsatv",
    cta: "Watch on YouTube",
  },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-center px-4">
        <div className="px-4 sm:px-14 sm:py-10 py-6 my-16 ss:mt-20 sm:my-24 bg-white shadow rounded-lg w-full">
          <h2 className="mb-4">
            <div className="bar-style" />
            About EBSUMSA
          </h2>
          <p className="text-sm sm:text-xs text-gray-700 leading-7 mb-5">
            Ebonyi State University Medical Students Association (EBSUMSA) is the association of all medical students at Ebonyi State University, Abakaliki. Our motto is "Pro Deo et Humanitate" which translates as "For God and Humanity" hence we are tasked with the responsibility of impacting our immediate environment and transforming overall public health.
          </p>
          <p className="text-sm sm:text-xs text-gray-700 leading-7 mb-5">
            For our members, we advance academic excellence, professional development, and community health by organizing clinical skills workshops, research forums, public health outreaches, and peer-support programs to set medical students of EBSU as top on the global landscape.
          </p>
          <p className="text-sm sm:text-xs text-gray-700 leading-7 mb-5">
            EBSUMSA also serves as a bridge between students, faculty, and healthcare partners or investors to promote ethical practice, leadership, and opportunities for internships and collaborative projects. Through our initiatives, we foster a culture of excellence, compassion, and commitment to improving healthcare delivery and public health outcomes in our society.
          </p>
          <p className="text-sm sm:text-xs text-gray-700 leading-7 mb-8">
            Our core values encompass professionalism, integrity, innovation, and a deep commitment to social responsibility. We believe that medical education extends beyond the classroom—it encompasses developing well-rounded healthcare professionals who are not only skilled clinicians but also advocates for their communities and leaders in their fields.
          </p>

          {/* Social Media Links */}
          <div className="border-t border-gray-100 pt-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Connect with us
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`group flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${social.bg}`}
                  >
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${social.iconBg} flex-shrink-0`}>
                      <Icon className="w-5 h-5 fill-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-900 truncate">{social.label}</span>
                      <span className="text-xs text-gray-500 truncate">{social.handle}</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors ml-auto flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

