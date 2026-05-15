import { FC } from "react";
import { BlogPostProp } from "../../../../models/misc/blog/blogPosts";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInVariants7 } from "../../../../animation/variants";
import { EngagementStats } from "../components/EngagementStats";

export const OthersPosts: FC<BlogPostProp> = ({ blogPosts }) => {
  return (
    <div>
      {blogPosts.length > 0 &&
        blogPosts
          .filter((post) => post.postType === "others")
          .map(
            ({ title, sampleImg, contents, date, postType, author, no, likes }, i) => (
              <Link to={`/blog/posts/${encodeURIComponent(title)}/${no}/${postType}`} key={i}>
                <motion.div
                  variants={fadeInVariants7}
                  initial="initial"
                  whileInView="animate"
                  viewport={{
                    once: true,
                  }}
                  custom={i}
                  className="overflow-hidden cursor-pointer group mb-3 sm:mb-4 flex flex-col-reverse bg-white border border-gray-200 rounded-lg shadow md:flex-row md:h-[150px] hover:bg-gray-100"
                >
                  <div className="flex items-start flex-col justify-between p-2 xs:p-3 sm:p-4 leading-normal w-full md:w-2/3">
                    <div className="w-full">
                      <h5 className="mb-1 text-xs xs:text-sm sm:text-base font-bold tracking-tight text-gray-900 line-clamp-2">
                        {title}
                      </h5>
                      <p className="mb-2 font-normal text-gray-700 text-[11px] xs:text-xs sm:text-sm line-clamp-2">
                        {contents && contents[0] && typeof contents[0].content === "string" &&
                          contents[0].content.split(" ").slice(0, 15).join(" ")}
                        ...
                      </p>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-2 w-full">
                      <p className="font-medium text-gray-700 text-[10px] xs:text-xs sm:text-sm flex-1 min-w-0 truncate">
                        {author} on {date}
                      </p>
                      <EngagementStats likes={likes} className="flex-shrink-0 text-xs" />
                    </div>
                  </div>
                  <img
                    className="object-cover h-[120px] xs:h-[140px] sm:h-[160px] w-full transition-all duration-300 ease-in-out transform group-hover:scale-105 rounded-t-lg md:h-full md:rounded-none md:rounded-r-lg md:w-1/3"
                    src={sampleImg}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>
              </Link>
            )
          )}
    </div>
  );
};
