import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { IBlogPost, TBlogPost } from "../../../../models/misc/blog/blogPosts";
import { db, isFirebaseConfigured } from "../../../../config/firebase";
import { notifyUser } from "../../../../helpers/notifyUser";
import { localBlogPosts } from "../../../../data/misc/blog/posts";

// ---------- Module-level singleton cache ----------
// Firebase is queried at most once per page load.
// _cachedPosts is only set when we have a non-empty result.
// _cachedPostsPromise holds the in-flight request so parallel callers
// share one network round-trip instead of each firing their own.
let _cachedPosts: IBlogPost[] | null = null;
let _cachedPostsPromise: Promise<IBlogPost[]> | null = null;

const mergeWithLocal = (firebasePosts: IBlogPost[]): IBlogPost[] => {
  const firebaseNos = new Set(firebasePosts.map((p) => p.no));
  const extras = (localBlogPosts as IBlogPost[]).filter((p) => !firebaseNos.has(p.no));
  return [...firebasePosts, ...extras];
};

const loadAllPosts = async (): Promise<IBlogPost[]> => {
  // Serve from cache immediately when we have real posts
  if (_cachedPosts && _cachedPosts.length > 0) return _cachedPosts;
  // Piggyback on an already in-flight request
  if (_cachedPostsPromise) return _cachedPostsPromise;

  if (!isFirebaseConfigured) {
    const fallback = (localBlogPosts as IBlogPost[]).sort((a, b) => b.no - a.no);
    if (fallback.length > 0) _cachedPosts = fallback;
    return fallback;
  }

  // Fire the request and store the promise so concurrent callers reuse it
  _cachedPostsPromise = (async () => {
    try {
      const snap = await getDocs(query(collection(db, "blogPosts")));
      const firebasePosts: IBlogPost[] = [];
      snap.forEach((d) => firebasePosts.push({ ...d.data(), id: d.id } as IBlogPost));
      const all = mergeWithLocal(firebasePosts).sort((a, b) => b.no - a.no);
      // Only cache when we actually got posts back
      if (all.length > 0) _cachedPosts = all;
      return all;
    } catch (err) {
      console.error("[blog] Firebase fetch failed:", err);
      return (localBlogPosts as IBlogPost[]).sort((a, b) => b.no - a.no);
    } finally {
      // Always clear the in-flight reference so future calls can retry cleanly
      _cachedPostsPromise = null;
    }
  })();

  return _cachedPostsPromise;
};

/** Bust the cache — next call to any fetch function will re-query Firebase */
export const invalidateBlogPostsCache = () => {
  _cachedPosts = null;
  _cachedPostsPromise = null;
};

// ---------- Hook ----------
export const useFetchBlogPosts = () => {
  // Initialise state from cache so components that mount after the first
  // fetch render immediately with data and no loading flash
  const [blogPosts, setBlogPosts] = useState<IBlogPost[] | null>(
    _cachedPosts && _cachedPosts.length > 0 ? _cachedPosts : null
  );
  const [homeBlogPosts, setHomeBlogPosts] = useState<IBlogPost[] | null>(
    _cachedPosts && _cachedPosts.length > 0 ? _cachedPosts : null
  );
  const [blogPost, setBlogPost] = useState<TBlogPost | null>(null);

  const hasCachedData = Boolean(_cachedPosts && _cachedPosts.length > 0);
  const [blogPostsLoading, setBlogPostsLoading] = useState(!hasCachedData);
  const [homeBlogPostsLoading, setHomeBlogPostsLoading] = useState(!hasCachedData);
  const [blogPostsError, setBlogPostsError] = useState(false);
  const [homeBlogPostsError, setHomeBlogPostsError] = useState(false);
  const [blogPostLoading, setBlogPostLoading] = useState(true);
  const [blogPostError, setBlogPostError] = useState(false);

  // If another component already populated the cache before this one mounted,
  // skip all loading states immediately
  useEffect(() => {
    if (_cachedPosts && _cachedPosts.length > 0) {
      setHomeBlogPosts(_cachedPosts);
      setBlogPosts(_cachedPosts);
      setHomeBlogPostsLoading(false);
      setBlogPostsLoading(false);
    }
  }, []);

  const fetchHomeBlogPosts = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) invalidateBlogPostsCache();
    setHomeBlogPostsLoading(true);
    setHomeBlogPostsError(false);
    try {
      const all = await loadAllPosts();
      if (all.length === 0) {
        setHomeBlogPostsError(true);
      } else {
        setHomeBlogPosts(all);
      }
    } catch {
      setHomeBlogPostsError(true);
    } finally {
      setHomeBlogPostsLoading(false);
    }
  }, []);

  const fetchBlogPosts = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) invalidateBlogPostsCache();
    setBlogPostsLoading(true);
    setBlogPostsError(false);
    try {
      const all = await loadAllPosts();
      if (all.length === 0) {
        setBlogPostsError(true);
      } else {
        setBlogPosts(all);
      }
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
