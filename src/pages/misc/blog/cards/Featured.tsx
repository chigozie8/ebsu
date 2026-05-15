import { FC } from "react";
import { BlogPostProp } from "../../../../models/misc/blog/blogPosts";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInVariants7 } from "../../../../animation/variants";
import { EngagementStats } from "../components/EngagementStats";

export const FeaturedPosts: FC<BlogPostProp> = ({ blogPosts }) => {
  return (
    <>
      {blogPosts.length > 0 && (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {blogPosts
            .filter((post) => post.postType === "featured")
            .map(
              (
                { title, sampleImg, contents, date, author, no, postType, likes },
                i
              ) => (
                <Link to={`/blog/posts/${encodeURIComponent(title)}/${no}/${postType}`} key={i}>
                  <motion.div
                    variants={fadeInVariants7}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                      once: true,
                    }}
                    custom={i}
                    className="group overflow-hidden h-[110px] xs:h-[120px] sm:h-[140px] flex flex-row md:flex-col md:h-[450px] w-full bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100"
                  >
                    <img
                      className="object-cover rounded-l-lg md:rounded-t-lg md:rounded-bl-none h-full w-1/3 md:h-[60%] md:w-full duration-300 ease-in-out transform group-hover:scale-105"
                      src={sampleImg}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="p-2 xs:p-2.5 sm:p-3 md:p-4 w-2/3 md:h-[40%] md:w-full flex flex-col justify-between overflow-hidden">
                      <div>
                        <h5 className="mb-1 text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-tight text-gray-900 line-clamp-2">
                          {title}
                        </h5>
                        <p className="font-normal hidden md:block text-xs text-gray-700 line-clamp-2">
                          {contents && contents[0] && typeof contents[0].content === "string" &&
                            contents[0].content
                              .split(" ")
                              .slice(0, 20)
                              .join(" ")}
                          ...
                        </p>
                      </div>
                      <div className="flex flex-row items-center justify-between gap-1 sm:gap-2">
                        <p className="font-medium text-gray-700 text-[9px] xs:text-[10px] sm:text-xs md:text-sm flex-1 min-w-0 truncate">
                          {author} on {date}
                        </p>
                        <EngagementStats likes={likes} className="flex-shrink-0 text-[10px] xs:text-xs" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            )}
        </div>
      )}
    </>
  );
};
