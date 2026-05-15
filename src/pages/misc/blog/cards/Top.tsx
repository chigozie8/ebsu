import { Carousel } from "flowbite-react";
import { FC } from "react";
import { BlogPostProp } from "../../../../models/misc/blog/blogPosts";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInVariants7 } from "../../../../animation/variants";
import { EngagementStats } from "../components/EngagementStats";

export const TopPosts: FC<BlogPostProp> = ({ blogPosts }) => {
  return (
    <>
      {blogPosts && (
        <motion.div
          variants={fadeInVariants7}
          initial="initial"
          whileInView="animate"
          viewport={{
            once: true,
          }}
          className="overflow-hidden h-[320px] xs:h-[360px] sm:h-[420px] md:h-[480px] w-full bg-white border border-gray-200 rounded-lg shadow"
        >
          <Carousel slideInterval={2000} indicators={false}>
            {blogPosts
              .filter((post) => post.postType === "top")
              .map(
                (
                  { title, sampleImg, contents, date, author, postType, no, likes },
                  i
                ) => (
                  <div key={i} className="h-full hover:bg-gray-100">
                    <Link to={`/blog/posts/${encodeURIComponent(title)}/${no}/${postType}`}>
                      <img
                        className="object-cover rounded-t-lg h-[55%] sm:h-[60%] w-full"
                        src={sampleImg}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="p-2 xs:p-3 sm:p-4 md:p-5 h-[45%] sm:h-[40%] w-full flex flex-col justify-between overflow-hidden">
                        <div>
                          <h5 className="mb-1 text-xs xs:text-sm sm:text-base md:text-lg font-bold tracking-tight text-gray-900 line-clamp-2">
                            {title}
                          </h5>
                          <p className="mb-1 sm:mb-2 font-normal text-xs text-gray-700 line-clamp-2 hidden xs:block">
                            {contents && contents[0] && typeof contents[0].content === "string" &&
                              contents[0].content
                                .split(" ")
                                .slice(0, 20)
                                .join(" ")}
                            ...
                          </p>{" "}
                        </div>
                        <div className="flex flex-row items-center justify-between gap-2">
                          <p className="font-medium text-gray-700 text-[10px] xs:text-xs sm:text-sm flex-1 min-w-0 truncate">
                            {author} on {date}
                          </p>
                          <EngagementStats likes={likes} className="flex-shrink-0 text-xs" />
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              )}
          </Carousel>
        </motion.div>
      )}
    </>
  );
};
