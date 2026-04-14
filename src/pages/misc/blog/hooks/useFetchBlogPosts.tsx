import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { IBlogPost, TBlogPost } from "../../../../models/misc/blog/blogPosts";
import { db, isFirebaseConfigured } from "../../../../config/firebase";
import { notifyUser } from "../../../../helpers/notifyUser";
import { localBlogPosts } from "../../../../data/misc/blog/posts";

// ---------- Module-level cache ----------
// One shared Promise across all hook instances — Firebase is queried exactly once
// per page load. Every component that calls useFetchBlogPosts() shares the result.
let _cachedPostsPromise: Promise<IBlogPost[]> | null = null;
let _cachedPosts: IBlogPost[] | null = null;

const mergeWithLocal = (firebasePosts: IBlogPost[]): IBlogPost[] => {
  const firebaseNos = new Set(firebasePosts.map((p) => p.no));
  const filtered = (localBlogPosts as IBlogPost[]).filter((p) => !firebaseNos.has(p.no));
  return [...firebasePosts, ...filtered];
};

const loadAllPosts = (): Promise<IBlogPost[]> => {
  // Return cached result immediately if already resolved
  if (_cachedPosts) return Promise.resolve(_cachedPosts);
  // Reuse in-flight request if one is already running
  if (_cachedPostsPromise) return _cachedPostsPromise;

  if (!isFirebaseConfigured) {
    const fallback = (localBlogPosts as IBlogPost[]).sort((a, b) => b.no - a.no);
    _cachedPosts = fallback;
    return Promise.resolve(fallback);
  }

  _cachedPostsPromise = getDocs(query(collection(db, "blogPosts")))
    .then((snap) => {
      const firebasePosts: IBlogPost[] = [];
      snap.forEach((d) => firebasePosts.push({ ...d.data(), id: d.id } as IBlogPost));
      const all = mergeWithLocal(firebasePosts).sort((a, b) => b.no - a.no);
      _cachedPosts = all;
      return all;
    })
    .catch(() => {
      // On failure clear the promise so a retry can start fresh
      _cachedPostsPromise = null;
      const fallback = (localBlogPosts as IBlogPost[]).sort((a, b) => b.no - a.no);
      return fallback;
    });

  return _cachedPostsPromise;
};

/** Call this to bust the cache and force a fresh fetch on next use */
export const invalidateBlogPostsCache = () => {
  _cachedPosts = null;
  _cachedPostsPromise = null;
};

// ---------- Hook ----------
export const useFetchBlogPosts = () => {
  const [blogPosts, setBlogPosts] = useState<IBlogPost[] | null>(_cachedPosts);
  const [homeBlogPosts, setHomeBlogPosts] = useState<IBlogPost[] | null>(_cachedPosts);
  const [blogPost, setBlogPost] = useState<TBlogPost | null>(null);

  const [blogPostsLoading, setBlogPostsLoading] = useState(!_cachedPosts);
  const [homeBlogPostsLoading, setHomeBlogPostsLoading] = useState(!_cachedPosts);
  const [blogPostsError, setBlogPostsError] = useState(false);
  const [homeBlogPostsError, setHomeBlogPostsError] = useState(false);
  const [blogPostLoading, setBlogPostLoading] = useState(true);
  const [blogPostError, setBlogPostError] = useState(false);

  const fetchHomeBlogPosts = useCallback(async () => {
    setHomeBlogPostsLoading(true);
    setHomeBlogPostsError(false);
    try {
      const all = await loadAllPosts();
      if (all.length === 0) setHomeBlogPostsError(true);
      else setHomeBlogPosts(all);
    } catch {
      setHomeBlogPostsError(true);
    } finally {
      setHomeBlogPostsLoading(false);
    }
  }, []);

  const fetchBlogPosts = useCallback(async () => {
    setBlogPostsLoading(true);
    setBlogPostsError(false);
    try {
      const all = await loadAllPosts();
      if (all.length === 0) setBlogPostsError(true);
      else setBlogPosts(all);
    } catch {
      setBlogPostsError(true);
    } finally {
      setBlogPostsLoading(false);
    }
  }, []);

  const fetchBlogPost = useCallback(async (postNo: string) => {
    setBlogPostLoading(true);
    setBlogPostError(false);
    const postNumber = parseInt(postNo, 10);
    try {
      const all = await loadAllPosts();
      const found = all.find((p) => p.no === postNumber || p.id === postNo);
      if (found) {
        setBlogPost(found as unknown as TBlogPost);
      } else {
        setBlogPost(null);
        setBlogPostError(true);
        notifyUser("error", "Post not found.");
      }
    } catch {
      setBlogPostError(true);
      notifyUser("error", "An error occurred. Please try again.");
    } finally {
      setBlogPostLoading(false);
    }
  }, []);

  // If cache already populated, skip the loading state entirely
  useEffect(() => {
    if (_cachedPosts) {
      setHomeBlogPosts(_cachedPosts);
      setBlogPosts(_cachedPosts);
      setHomeBlogPostsLoading(false);
      setBlogPostsLoading(false);
    }
  }, []);

  return {
    blogPosts,
    blogPost,
    fetchBlogPosts,
    fetchBlogPost,
    fetchHomeBlogPosts,
    homeBlogPosts,
    homeBlogPostsError,
    homeBlogPostsLoading,
    blogPostsLoading,
    blogPostLoading,
    blogPostsError,
    blogPostError,
  };
};
