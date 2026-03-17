import Footer from "../../components/footer/Footer";
import { InstagramIcon } from "../../components/icons/socials/InstagramIcon";
import { XIcon } from "../../components/icons/socials/XIcon";
import { YouTubeIcon } from "../../components/icons/socials/YouTubeIcon";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/ebsumsaofficial?utm_source=qr&igsh=MW5mMWlrY3g4c3lxaQ==",
    icon: <InstagramIcon className="w-5 h-5 fill-white" />,
    bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    handle: "@ebsumsaofficial",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/Ebsumsaofficial",
    icon: <XIcon className="w-5 h-5 fill-white" />,
    bg: "bg-black",
    handle: "@Ebsumsaofficial",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@ebsumsatv?si=qWJTfD2Z4L61wrBo",
    icon: <YouTubeIcon className="w-5 h-5 fill-white" />,
    bg: "bg-red-600",
    handle: "@ebsumsatv",
  },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-center px-2">
        <div className="px-2 sm:px-14 sm:py-10 py-6 my-16 ss:mt-20 sm:my-24 bg-white shadow rounded-lg">
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Follow Us
            </h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium ${social.bg} hover:opacity-90 transition-opacity`}
                >
                  {social.icon}
                  <span>{social.handle}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
