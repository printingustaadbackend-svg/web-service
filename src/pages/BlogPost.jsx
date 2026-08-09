import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead, { blogPostSchema } from '../components/SEOHead';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blogs/${slug}`);
        if (!res.ok) throw new Error('Post not found');
        const { post: postData, related } = await res.json();
        setPost(postData);
        setRelatedPosts(related || []);
      } catch (err) {
        console.error('Failed to load blog post:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="aspect-[16/9] bg-gray-200 rounded-2xl mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">article</span>
          <h1 className="text-2xl font-bold text-gray-400 mb-2">Post not found</h1>
          <p className="text-gray-400 mb-6">This article doesn't exist or has been removed.</p>
          <Link to="/blog" className="text-purple-600 font-semibold hover:underline">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  // Simple markdown-like content rendering (paragraphs, headings, bold, lists)
  const renderContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    const elements = [];
    let listItems = [];
    let listType = null;

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === 'ul') {
          elements.push(<ul key={`list-${elements.length}`} className="list-disc pl-6 space-y-2 text-gray-600 my-4">{listItems.map((li, i) => <li key={i}>{li}</li>)}</ul>);
        } else {
          elements.push(<ol key={`list-${elements.length}`} className="list-decimal pl-6 space-y-2 text-gray-600 my-4">{listItems.map((li, i) => <li key={i}>{li}</li>)}</ol>);
        }
        listItems = [];
        listType = null;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(<h3 key={idx} className="text-xl font-bold text-gray-900 mt-8 mb-3">{trimmed.slice(4)}</h3>);
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(<h2 key={idx} className="text-2xl font-extrabold text-gray-900 mt-10 mb-4">{trimmed.slice(3)}</h2>);
      } else if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(<h2 key={idx} className="text-2xl font-extrabold text-gray-900 mt-10 mb-4">{trimmed.slice(2)}</h2>);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (listType !== 'ul') { flushList(); listType = 'ul'; }
        listItems.push(trimmed.slice(2));
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') { flushList(); listType = 'ol'; }
        listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      } else if (trimmed === '') {
        flushList();
      } else {
        flushList();
        // Process bold with **text**
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-800">{part}</strong> : part
        );
        elements.push(<p key={idx} className="text-gray-600 leading-relaxed my-3">{rendered}</p>);
      }
    });
    flushList();
    return elements;
  };

  const shareUrl = encodeURIComponent(`https://printingustad.com/blog/${post.slug}`);
  const shareTitle = encodeURIComponent(post.title);

  return (
    <div className="bg-white min-h-screen">
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || post.content?.slice(0, 160)}
        keywords={post.tags?.join(', ')}
        canonical={`/blog/${post.slug}`}
        ogImage={post.featured_image}
        ogType="article"
        schemaData={blogPostSchema(post)}
      />

      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <nav className="text-xs text-gray-400 flex items-center gap-1.5">
            <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <Link to="/blog" className="hover:text-gray-600 transition-colors">Blog</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-gray-600 font-medium truncate max-w-[200px]">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
            {post.category || 'General'}
          </span>
          <span className="text-sm text-gray-400">
            {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {post.author && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500">By {post.author}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-500 leading-relaxed mb-8 font-light">
            {post.excerpt}
          </p>
        )}

        {/* Featured Image */}
        {post.featured_image && (
          <div className="rounded-2xl overflow-hidden mb-10 shadow-lg">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose-custom">
          {renderContent(post.content)}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-800 mb-3">Share this article</p>
          <div className="flex gap-3">
            <a
              href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
              title="Share on WhatsApp"
            >
              <span className="text-sm font-bold">W</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              title="Share on Facebook"
            >
              <span className="text-sm font-bold">f</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
              title="Share on X"
            >
              <span className="text-sm font-bold">X</span>
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(`https://printingustad.com/blog/${post.slug}`); }}
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
              title="Copy link"
            >
              <span className="material-symbols-outlined text-sm">link</span>
            </button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-12 md:py-16 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map(rp => (
                <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                  <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-500 h-full flex flex-col">
                    <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                      <img
                        src={rp.featured_image || 'https://placehold.co/600x375/f3f0ff/6d28d9?text=Blog'}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <span className="text-xs text-gray-400 mb-2">
                        {new Date(rp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-purple-700 transition-colors line-clamp-2">
                        {rp.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to Blog CTA */}
      <section className="py-12 text-center border-t border-gray-100">
        <Link to="/blog" className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:gap-3 transition-all">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to all articles
        </Link>
      </section>
    </div>
  );
};

export default BlogPost;
