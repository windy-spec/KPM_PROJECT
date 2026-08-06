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
    <div className="min-h-screen bg-surface-container/20 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
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
        <article className="bg-white rounded-[2rem] shadow-sm border border-outline-variant/30 overflow-hidden relative">
          
          {/* Header */}
          <header className="p-8 md:p-14 border-b border-outline-variant/30 bg-surface-container/10 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="flex flex-wrap gap-2 mb-8 relative z-10">
              {post.hashtags?.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.replace("#", "")}
                </span>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-on-surface leading-tight mb-6">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-between text-sm text-on-surface-variant">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-outline" />
                Đăng ngày: <span className="font-bold text-on-surface ml-1">{moment(post.created_at).format("DD/MM/YYYY HH:mm")}</span>
              </div>
              <button 
                className="flex items-center font-bold hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Đã copy link bài viết!");
                }}
              >
                <Share2 className="w-5 h-5 mr-1" />
                Chia sẻ
              </button>
            </div>
          </header>

          {/* Content Body */}
          <div className="p-8 md:p-12 prose prose-lg prose-slate max-w-none text-on-surface-variant prose-headings:text-on-surface prose-headings:font-black prose-img:rounded-2xl prose-img:shadow-md prose-img:w-full prose-img:object-cover prose-a:text-primary hover:prose-a:text-primary-container">
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
