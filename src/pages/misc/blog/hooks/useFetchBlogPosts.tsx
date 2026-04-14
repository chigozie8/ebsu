import { useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { IBlogPost, TBlogPost } from "../../../../models/misc/blog/blogPosts";
import { db, isFirebaseConfigured } from "../../../../config/firebase";
import { notifyUser } from "../../../../helpers/notifyUser";
import { localBlogPosts } from "../../../../data/misc/blog/posts";

const mergeWithLocal = (firebasePosts: IBlogPost[]): IBlogPost[] => {
  const firebaseNos = new Set(firebasePosts.map((p) => p.no));
  const filtered = localBlogPosts.filter((p) => !firebaseNos.has(p.no));
  return [...firebasePosts, ...(filtered as IBlogPost[])];
};

export const useFetchBlogPosts = () => {
  const [blogPosts, setBlogPosts] = useState<IBlogPost[] | null>(null);
  const [homeBlogPosts, setHomeBlogPosts] = useState<IBlogPost[] | null>(null);
  const [blogPost, setBlogPost] = useState<TBlogPost | null>(null);
  const [blogPostsLoading, setBlogPostsLoading] = useState(true);
  const [homeBlogPostsLoading, setHomeBlogPostsLoading] = useState(true);
  const [blogPostsError, setBlogPostsError] = useState(false);
  const [homeBlogPostsError, setHomeBlogPostsError] = useState(false);
  const [blogPostLoading, setBlogPostLoading] = useState(true);
  const [blogPostError, setBlogPostError] = useState(false);

  const fetchBlogPosts = async () => {
    setBlogPostsLoading(true);
    setBlogPostsError(false);

    if (!isFirebaseConfigured) {
      const fallback = localBlogPosts as IBlogPost[];
      if (fallback.length === 0) setBlogPostsError(true);
      else setBlogPosts(fallback);
      setBlogPostsLoading(false);
      return;
    }

    try {
      const snap = await getDocs(query(collection(db, "blogPosts")));
      const firebasePosts: IBlogPost[] = [];
      snap.forEach((d) => {
        firebasePosts.push({ ...d.data(), id: d.id } as IBlogPost);
      });
      const all = mergeWithLocal(firebasePosts).sort((a, b) => b.no - a.no);
      if (all.length === 0) setBlogPostsError(true);
      else setBlogPosts(all);
    } catch (err) {
      console.error("[v0] fetchBlogPosts error:", err);
      setBlogPostsError(true);
    } finally {
      setBlogPostsLoading(false);
    }
  };

  const fetchHomeBlogPosts = async () => {
    setHomeBlogPostsLoading(true);
    setHomeBlogPostsError(false);

    if (!isFirebaseConfigured) {
      console.log("[v0] Firebase not configured, using local posts:", localBlogPosts.length);
      const fallback = [...localBlogPosts].sort((a, b) => b.no - a.no) as IBlogPost[];
      if (fallback.length === 0) {
        setHomeBlogPostsError(true);
      } else {
        setHomeBlogPosts(fallback);
      }
      setHomeBlogPostsLoading(false);
      return;
    }

    try {
      console.log("[v0] Fetching blog posts from Firebase...");
      const snap = await getDocs(query(collection(db, "blogPosts")));
      console.log("[v0] Firebase snap size:", snap.size);
      const firebasePosts: IBlogPost[] = [];
      snap.forEach((d) => {
        const data = d.data();
        console.log("[v0] Post doc:", d.id, "title:", data.title, "keys:", Object.keys(data).join(", "));
        firebasePosts.push({ ...data, id: d.id } as IBlogPost);
      });
      console.log("[v0] Total firebase posts fetched:", firebasePosts.length);
      const all = mergeWithLocal(firebasePosts).sort((a, b) => b.no - a.no);
      console.log("[v0] Final merged posts count:", all.length);
      if (all.length === 0) {
        setHomeBlogPostsError(true);
      } else {
        setHomeBlogPosts(all);
      }
    } catch (err) {
      console.error("[v0] fetchHomeBlogPosts error:", err);
      setHomeBlogPostsError(true);
    } finally {
      setHomeBlogPostsLoading(false);
    }
  };

  const fetchBlogPost = async (postNo: string) => {
    setBlogPostLoading(true);
    setBlogPostError(false);
    const postNumber = parseInt(postNo, 10);

    if (!isFirebaseConfigured) {
      const local = localBlogPosts.find((p) => p.no === postNumber || p.id === postNo);
      setBlogPost(local ? (local as unknown as TBlogPost) : null);
      setBlogPostLoading(false);
      return;
    }

    try {
      const snap = await getDocs(query(collection(db, "blogPosts")));
      let found: TBlogPost | null = null;
      snap.forEach((d) => {
        const data = d.data() as TBlogPost;
        if (data.no === postNumber) {
          found = { ...data, id: d.id } as unknown as TBlogPost;
        }
      });

      if (found) {
        setBlogPost(found);
      } else {
        const local = localBlogPosts.find((p) => p.no === postNumber || p.id === postNo);
        setBlogPost(local ? (local as unknown as TBlogPost) : null);
      }
    } catch {
      const local = localBlogPosts.find((p) => p.no === postNumber || p.id === postNo);
      if (local) {
        setBlogPost(local as unknown as TBlogPost);
      } else {
        setBlogPostError(true);
        notifyUser("error", "An error occurred. Please try again");
      }
    } finally {
      setBlogPostLoading(false);
    }
  };

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
