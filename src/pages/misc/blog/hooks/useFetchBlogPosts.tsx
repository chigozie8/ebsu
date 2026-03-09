/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  collection,
  getDoc,
  doc,
  query,
  onSnapshot,
} from "firebase/firestore";
import { IBlogPost, TBlogPost } from "../../../../models/misc/blog/blogPosts";
import { db } from "../../../../config/firebase";
import { notifyUser } from "../../../../helpers/notifyUser";
import { localBlogPosts } from "../../../../data/misc/blog/posts";

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

  const postsRef = collection(db, "blogPosts");

  const fetchBlogPosts = async () => {
    const postsQuery = query(postsRef);
    setBlogPostsLoading(true);
    try {
      onSnapshot(
        postsQuery,
        (querySnapshot) => {
          const list: IBlogPost[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as IBlogPost);
          });
          // Use local fallback if Firebase returns empty
          if (list.length === 0) {
            setBlogPosts(localBlogPosts);
          } else {
            setBlogPosts(list);
          }
          setBlogPostsLoading(false);
        },
        (error: any) => {
          // Use local fallback on error
          setBlogPosts(localBlogPosts);
          setBlogPostsLoading(false);
          setBlogPostsError(false);
        }
      );
    } catch (error) {
      // Use local fallback on catch
      setBlogPosts(localBlogPosts);
      setBlogPostsLoading(false);
      setBlogPostsError(false);
    }
  };
  const fetchHomeBlogPosts = async () => {
    const postsQuery = query(postsRef);
    setHomeBlogPostsLoading(true);
    try {
      onSnapshot(
        postsQuery,
        (querySnapshot) => {
          const list: IBlogPost[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as IBlogPost);
          });
          // Use local fallback if Firebase returns empty
          if (list.length === 0) {
            const shuffled = [...localBlogPosts].sort(() => 0.5 - Math.random());
            setHomeBlogPosts(shuffled);
          } else {
            const shuffled = list.sort(() => 0.5 - Math.random());
            setHomeBlogPosts(shuffled);
          }
          setHomeBlogPostsLoading(false);
        },
        (error: any) => {
          // Use local fallback on error
          const shuffled = [...localBlogPosts].sort(() => 0.5 - Math.random());
          setHomeBlogPosts(shuffled);
          setHomeBlogPostsLoading(false);
          setHomeBlogPostsError(false);
        }
      );
    } catch (error) {
      // Use local fallback on catch
      const shuffled = [...localBlogPosts].sort(() => 0.5 - Math.random());
      setHomeBlogPosts(shuffled);
      setHomeBlogPostsLoading(false);
      setHomeBlogPostsError(false);
    }
  };
  const fetchBlogPost = async (id: string) => {
    const postRef = doc(db, "blogPosts", id);
    setBlogPostLoading(true);
    try {
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data() as TBlogPost;
        setBlogPost(postData);
        setBlogPostLoading(false);
      } else {
        // Try to find in local fallback data
        const localPost = localBlogPosts.find(p => p.id === id);
        if (localPost) {
          setBlogPost(localPost as unknown as TBlogPost);
        } else {
          setBlogPost(null);
        }
        setBlogPostLoading(false);
      }
    } catch (error) {
      // Try to find in local fallback data on error
      const localPost = localBlogPosts.find(p => p.id === id);
      if (localPost) {
        setBlogPost(localPost as unknown as TBlogPost);
        setBlogPostLoading(false);
      } else {
        setBlogPostLoading(false);
        setBlogPostError(true);
        notifyUser("error", "An error occured. Please try again");
      }
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
