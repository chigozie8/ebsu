/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo } from "react";
import { useFetchBlogPosts } from "../hooks/useFetchBlogPosts";
import { useParams } from "react-router-dom";
import { PostContent } from "./PostContent";
import { PopularPosts } from "./cards/Popular";
import { RelatedPosts } from "./cards/Related";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Footer from "../../../../components/footer/Footer";
import CommentSection from "./comments/CommentSection";
import { useBlogComments } from "../hooks/useBlogComments";
import { useBlogLikes } from "../hooks/useBlogLikes";
import PostSkeleton from "./skeleton/PostSkeleton";
import Lottie from "lottie-react";
import profileAnim from "../../../../json/animation/avatar1.json";

// Helper function to calculate read time
const calculateReadTime = (contents: { type: string; content: string | unknown[] }[] | undefined): number => {
  if (!contents) return 1;
  const wordsPerMinute = 200;
  let totalWords = 0;
  
  contents.forEach((block) => {
    if (typeof block.content === 'string') {
      totalWords += block.content.split(/\s+/).filter(Boolean).length;
    }
  });
  
  const minutes = Math.ceil(totalWords / wordsPerMinute);
  return minutes < 1 ? 1 : minutes;
};

export default function BlogPost() {
  const {
    fetchBlogPost,
    blogPost,
    fetchBlogPosts,
    blogPosts,
    blogPostsLoading,
    blogPostsError,
    blogPostLoading,
    blogPostError,
  } = useFetchBlogPosts();
  const { postID, postType } = useParams();
  const { getPostComments } = useBlogComments();
  const { likes, isLiked, likesLoading, toggleLike } = useBlogLikes();

  const readTime = useMemo(() => calculateReadTime(blogPost?.contents), [blogPost?.contents]);

  // Get unique categories from all blog posts
  const categories = useMemo(() => {
    if (!blogPosts) return [];
    const cats = blogPosts
      .map((post) => (post as { category?: string }).category)
      .filter((cat): cat is string => Boolean(cat));
    return [...new Set(cats)];
  }, [blogPosts]);

  useEffect(() => {
    if (postID && postType) {
      try {
        fetchBlogPost(postID);
        getPostComments();
        fetchBlogPosts();
      } finally {
        window.scroll(0, 0);
      }
    }
  }, [postID]);

  return (
    <div className="min-h-screen bg-white">
      <div className="box-width2">
        <div className="px-3 py-20 sm:px-10 lg:px-12 sm:py-24">
          <div className="sticky grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3">
              {blogPostLoading && (
                <div className="bg-white shadow rounded-lg p-4">
                  <PostSkeleton />
                </div>
              )}
              {blogPostError && "Something went wrong!"}
              {!blogPostLoading && !blogPostError && blogPost && (
                <div className="bg-white shadow rounded-lg p-4">
                  {/* Category & Read Time */}
                  <div className="flex items-center gap-3 mb-3">
                    {(blogPost as { category?: string })?.category && (
                      <span className="px-2 py-1 bg-green2/10 text-green2 text-xs font-medium rounded-full">
                        {(blogPost as { category?: string }).category}
                      </span>
                    )}
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {readTime} min read
                    </span>
                  </div>
                  
                  <h1 className="text-lg sm:text-xl md:text-2xl font-semibold w-full">
                    {blogPost?.title}
                  </h1>
                  
                  {/* Author info with image */}
                  <div className="mb-3 mt-2">
                    <div className="flex items-center gap-2">
                      {(blogPost as { authorImage?: string })?.authorImage ? (
                        <img 
                          src={(blogPost as { authorImage?: string }).authorImage} 
                          alt={blogPost?.author}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <Lottie
                          animationData={profileAnim}
                          loop={false}
                          className="w-8 h-8"
                        />
                      )}
                      <div>
                        <p className="font-satisfy md:text-md text-gray-700">
                          {blogPost?.author}
                        </p>
                        <p className="text-gray-500 font-inter text-xss sm:text-xs font-[400]">
                          {blogPost?.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full flex items-center justify-center">
                    <img
                      src={blogPost?.sampleImg}
                      alt={blogPost?.title}
                      className="w-full mb-3 rounded-lg"
                    />
                  </div>
                  
                  {blogPost.contents && <PostContent contents={blogPost.contents} />}
                  
                  {/* Like button */}
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={toggleLike}
                      disabled={likesLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        isLiked 
                          ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <svg 
                        className={`w-5 h-5 ${isLiked ? 'fill-red-500' : 'fill-none stroke-current'}`} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={isLiked ? 0 : 2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-sm font-medium">{likes || 0}</span>
                    </button>
                    <span className="text-sm text-gray-500">
                      {isLiked ? 'You liked this post' : 'Like this post'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className=" md:col-span-2 flex flex-col-reverse md:flex-col">
              <div className="mb-4 bg-white shadow rounded-lg p-4">
                <h2 className="text-base sm:text-md md:text-lg font-semibold mb-2 text-green1">
                  Related Posts
                </h2>
                {blogPostsLoading && (
                  <Skeleton
                    className="mb-4 h-[110px] sm:h-[130px] md:h-[100px] w-full rounded-lg "
                    count={2}
                  />
                )}
                {blogPostsError ||
                  (blogPosts && blogPosts?.length < 1 && (
                    <p>Something went wrong. Please try again.</p>
                  ))}
                {!blogPostsLoading &&
                  !blogPostsError &&
                  blogPosts &&
                  blogPosts?.length > 0 &&
                  postID &&
                  postType && (
                    <RelatedPosts
                      blogPosts={blogPosts}
                      postID={postID}
                      postType={postType}
                    />
                  )}
              </div>
              <div className="mb-4 bg-white shadow rounded-lg p-4">
                <h2 className="text-base sm:text-md md:text-lg font-semibold mb-2 text-green1">
                  Popular Posts
                </h2>
                {blogPostsLoading && (
                  <Skeleton
                    className="mb-4 h-[110px] sm:h-[130px] md:h-[100px] w-full rounded-lg "
                    count={2}
                  />
                )}
                {blogPostsError ||
                  (blogPosts &&
                    blogPosts?.length < 1 &&
                    "Something went wrong. Please try again.")}
                {!blogPostsLoading &&
                  !blogPostsError &&
                  blogPosts &&
                  blogPosts?.length > 0 &&
                  postID &&
                  postType && (
                    <PopularPosts
                      blogPosts={blogPosts}
                      postID={postID}
                      postType={postType}
                    />
                  )}
              </div>
              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="mb-4 bg-white shadow rounded-lg p-4">
                  <h2 className="text-base sm:text-md md:text-lg font-semibold mb-3 text-green1">
                    Categories
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <span 
                        key={category}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-green2/10 hover:text-green2 cursor-pointer transition-colors"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <CommentSection />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
