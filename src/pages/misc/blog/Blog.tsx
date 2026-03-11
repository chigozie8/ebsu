/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import { useFetchBlogPosts } from "./hooks/useFetchBlogPosts";
import { TopPosts } from "./cards/Top";
import { OthersPosts } from "./cards/Others";
import { FeaturedPosts } from "./cards/Featured";
import Footer from "../../../components/footer/Footer";
import { Spinner } from "../../../components/loaders/Spinner";
import { BadNetworkIcon } from "../../../components/icons/general/BadNetworkIcon";
import { Link } from "react-router-dom";
import { IoSearch, IoClose } from "react-icons/io5";

export default function Blog() {
  const { blogPosts, blogPostsLoading, blogPostsError, fetchBlogPosts } =
    useFetchBlogPosts();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  // Filter posts based on search query
  const searchResults = useMemo(() => {
    if (!blogPosts || !searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    return blogPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        (post as { category?: string }).category?.toLowerCase().includes(query)
    );
  }, [blogPosts, searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="box-width">
        <div className="px-3 py-[70px] sm:px-8 md:px-14 sm:py-[85px]">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(e.target.value.length > 0);
                }}
                placeholder="Search articles by title, author, or category..."
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green2/50 focus:border-green2 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <IoClose className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {isSearching && searchResults && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-green2 font-semibold text-lg ss:text-xll md:text-2xl">
                  Search Results ({searchResults.length})
                </h2>
                <button
                  onClick={clearSearch}
                  className="text-sm text-green1 hover:underline"
                >
                  Clear search
                </button>
              </div>
              {searchResults.length > 0 ? (
                <div className="grid gap-4">
                  {searchResults.map((post, i) => (
                    <Link
                      to={`/blog/posts/${encodeURIComponent(post.title)}/${post.no}/${post.postType}`}
                      key={i}
                    >
                      <div className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all">
                        <img
                          src={post.sampleImg}
                          alt={post.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 hover:text-green2 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {post.author} &middot; {post.date}
                          </p>
                          {(post as { category?: string }).category && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green2/10 text-green2 text-xs font-medium rounded-full">
                              {(post as { category?: string }).category}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <IoSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No articles found for "{searchQuery}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}

          {/* Regular Blog Content - Only show when not searching */}
          {!isSearching && (
            <>
              <h2 className="py-3 text-green2 border-b border-b-gray-200 w-full font-semibold text-lg ss:text-xll md:text-2xl mb-4">
                Top Articles
              </h2>
          {blogPosts && blogPosts.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <TopPosts blogPosts={blogPosts} />
                <OthersPosts blogPosts={blogPosts} />
              </div>
              <h2 className="text-green2 py-3 border-b border-b-gray-200 w-full font-semibold text-lg ss:text-xll md:text-2xl mb-4">
                Don't Miss
              </h2>
              <FeaturedPosts blogPosts={blogPosts} />
            </>
          )}
          {blogPostsLoading && !blogPosts && !blogPostsError && (
            <div className="w-full h-[70vh] flex items-center justify-center flex-col">
              <Spinner className="w-8 sm:w-8 md:w-10" />
              <p className="font-[500] text-sm sm:text-xs md:text-base text-gray-700 mt-2">
                Loading posts...
              </p>
            </div>
          )}{" "}
          {blogPostsError && !blogPostsLoading && !blogPosts && (
            <div className="w-full h-[70vh] flex items-center justify-center flex-col">
              <BadNetworkIcon className="w-10 sm:w-12 md:w-20" />
              <p className=" font-medium text-gray-700 text-ss sm:text-sm mmd:text-xs text-center">
                Sorry, could'nt load posts at the moment.{" "}
                <button
                  className="underline hover:no-underline text-green1"
                  onClick={() => fetchBlogPosts()}
                >
                  Retry
                </button>
              </p>
            </div>
          )}
          {blogPosts && blogPosts.length < 1 && (
            <div className="w-full h-[70vh] flex items-center justify-center flex-col">
              <BadNetworkIcon className="w-10 sm:w-12 md:w-20" />
              <p className=" font-medium text-gray-700 text-ss sm:text-sm mmd:text-xs text-center">
                Sorry, could'nt load posts at the moment.{" "}
                <button
                  className="underline hover:no-underline text-green1"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </p>
            </div>
          )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
