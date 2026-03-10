/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC } from "react";
import { IPostComment, PostCommentsProp } from "../../../../../models/misc/blog/postComments";
import { ThreeVerticalDotsIcon } from "../../../../../components/icons/general/ThreeVerticalDotsIcon";
import { useGetUserInfo } from "../../../../../hooks/auth/useGetUserInfo";
import {
  Popover,
  PopoverHandler,
  PopoverContent,
} from "@material-tailwind/react";
import { useBlogComments } from "../../hooks/useBlogComments";
import Lottie from "lottie-react";
import profile from "../../../../../json/animation/avatar1.json";
import { PaperPlaneIcon } from "../../../../../components/icons/general/PaperPlaneIcon";

export const Comments: FC<PostCommentsProp> = ({ postComments }) => {
  const { userID } = useGetUserInfo();
  const { 
    deleteUserComment, 
    replyComment, 
    setReplyComment, 
    replyingTo, 
    setReplyingTo, 
    addReplyComment 
  } = useBlogComments();

  // Filter top-level comments (no parentCommentID)
  const topLevelComments = postComments.filter(c => !c.parentCommentID);
  
  // Get replies for a comment
  const getReplies = (commentID: string): IPostComment[] => {
    return postComments.filter(c => c.parentCommentID === commentID);
  };

  const renderComment = (
    {
      firstName,
      lastName,
      comment,
      time,
      date,
      commentUserID,
      commentID,
      profileImageURL,
    }: IPostComment,
    isReply = false
  ) => {
    const replies = getReplies(commentID);
    
    return (
      <div key={commentID} className={`${isReply ? 'ml-6 sm:ml-10' : ''}`}>
        <div className="flex items-start pb-1 w-full gap-1 mb-2">
          {profileImageURL && profileImageURL.length > 0 ? (
            <img
              src={profileImageURL}
              alt={`${firstName}'s avatar`}
              className={`${isReply ? 'w-5 h-5 sm:w-7 sm:h-7' : 'w-6 h-6 sm:w-9 sm:h-9'} mr-2 rounded-full object-cover flex-shrink-0`}
            />
          ) : (
            <Lottie
              animationData={profile}
              loop={false}
              className={`${isReply ? 'w-5 h-5 sm:w-7 sm:h-7' : 'w-6 h-6 sm:w-9 sm:h-9'} mr-2 flex-shrink-0`}
            />
          )}
          <div className="flex flex-col border-b border-gray-100 pb-2 w-[90%] overflow-x-hidden">
            <div className="flex items-start justify-between">
              <div className="flex gap-3 items-center sm:mt-0">
                <div className="">
                  <p className="text-xss xxss:text-ss sm:text-xs md:text-[12px] font-medium text-green1">
                    {firstName} {lastName}
                  </p>
                </div>
                <span className="text-xss xxss:text-ss sm:text-sm font-[300] md:text-xss lg:text-ss text-gray-500 sm:pt-0">
                  • {time} {date}
                </span>
              </div>
              {userID && commentUserID === userID && (
                <>
                  <Popover
                    animate={{
                      mount: { scale: 1, y: 0 },
                      unmount: { scale: 0, y: 25 },
                    }}
                  >
                    <PopoverHandler>
                      <button className="p-[1.5px] hover:bg-gray-100 rounded-full relative">
                        <ThreeVerticalDotsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </PopoverHandler>
                    <PopoverContent
                      onClick={() =>
                        deleteUserComment(commentID, commentUserID)
                      }
                      placeholder={""}
                      onResize={() => {}}
                      onResizeCapture={() => {}}
                      onPointerEnterCapture={() => {}}
                      onPointerLeaveCapture={() => {}}
                      className={` cursor-pointer shadow font-medium text-black font-dmSans p-2 text-[10px] sm:text-ss hover:bg-gray-100 rounded-lg`}
                    >
                      Delete
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
            <div className="w-full">
              <p className="text-xss xxss:text-ss sm:text-sm md:text-[12px] break-all ">
                {comment}
              </p>
            </div>
            {/* Reply button */}
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === commentID ? null : commentID)}
                className="text-xss sm:text-xs text-green2 hover:text-green1 font-medium mt-1 self-start"
              >
                {replyingTo === commentID ? 'Cancel' : 'Reply'}
              </button>
            )}
            {/* Reply input */}
            {replyingTo === commentID && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={replyComment}
                  onChange={(e) => setReplyComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-green2"
                  maxLength={180}
                />
                <button
                  onClick={() => addReplyComment(commentID)}
                  className="p-1 text-green1 hover:bg-green1/10 rounded"
                >
                  <PaperPlaneIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Render replies */}
        {replies.length > 0 && (
          <div className="space-y-1">
            {replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {topLevelComments.map((comment) => renderComment(comment))}
    </div>
  );
};
