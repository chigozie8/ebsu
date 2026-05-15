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
                    className="group overflow-hidden h-[140px] sm:h-[160px] flex items-center flex-row md:flex-col md:h-[500px] w-full bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100"
                  >
                    <img
                      className="object-cover rounded-none rounded-l-lg md:rounded-t-lg md:rounded-none h-full w-1/3 md:h-3/5 md:w-full duration-300 ease-in-out transform group-hover:scale-105"
                      src={sampleImg}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="p-2 sm:p-3 md:p-4 h-full w-2/3 md:h-2/5 md:w-full flex flex-col justify-between">
                      <div>
                        <h5 className="mb-1 sm:mb-2 text-xs sm:text-sm md:text-lg lg:text-xl xlg:text-xll font-bold tracking-tight text-gray-900 line-clamp-2">
                          {title}
                        </h5>
                        <p className="mb-2 font-normal hidden md:block text-xs md:text-ss xl:text-xs text-gray-700 line-clamp-3">
                          {contents && contents[0] && typeof contents[0].content === "string" &&
                            contents[0].content
                              .split(" ")
                              .slice(0, 25)
                              .join(" ")}
                          ...
                        </p>{" "}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-2">
                        <p className="font-medium text-gray-700 text-xs sm:text-xs md:text-sm flex-1 min-w-0 truncate">
                          {author} on {date}
                        </p>
                        <EngagementStats likes={likes} className="flex-shrink-0" />
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
