import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, Share2, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import moment from "moment";
import forumService from "../../services/forumService";

const ForumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await forumService.getPostDetail(id);
        if (res.success && res.data) {
          setPost(res.data);
        } else {
          // If not found, navigate back
          navigate("/forum");
        }
      } catch (error) {
        console.error("Failed to fetch post details", error);
        navigate("/forum");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-surface-container/20 py-12 md:py-16">
      <div className="max-w-[85%] lg:max-w-[75%] 2xl:max-w-[1200px] mx-auto px-4 sm:px-6">

        {/* Back Button */}
        <button
          onClick={() => navigate("/forum")}
          className="group flex items-center text-sm font-bold text-on-surface-variant hover:text-primary mb-8 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-outline-variant/30 flex items-center justify-center mr-3 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Quay lại danh sách
        </button>

        {/* Article Container */}
        <article className="bg-white rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden relative">

          {/* Header */}
          <header className="p-8 md:p-12 lg:p-16 border-b border-outline-variant/30 bg-white relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

            <div className="flex items-center gap-4 text-sm font-semibold text-on-surface-variant mb-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 text-lg">
                KPM
              </div>
              <div>
                <div className="text-on-surface font-extrabold text-base">Ban Quản Trị</div>
                <div className="flex items-center opacity-80 mt-0.5">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {moment(post.created_at).format("DD/MM/YYYY - HH:mm")}
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-on-surface leading-[1.15] mb-8 tracking-tight relative z-10">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-8 relative z-10">
              {post.hashtags?.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors">
                  <Tag className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                  {tag.replace("#", "")}
                </span>
              ))}
            </div>
          </header>
          {/* Content Body */}
          <div className="p-8 md:p-12 lg:p-16 prose prose-lg md:prose-xl prose-slate max-w-none text-on-surface-variant prose-headings:text-on-surface prose-headings:font-black prose-p:leading-relaxed prose-img:rounded-3xl prose-img:shadow-lg prose-img:w-full prose-img:object-cover prose-a:text-primary hover:prose-a:text-primary-container">
            <ReactMarkdown>
              {post.content}
            </ReactMarkdown>
          </div>

        </article>
      </div>
    </div>
  );
};

export default ForumDetail;
