import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (!res.ok) throw new Error('Failed to fetch blogs');
        const data = await res.json();
        setPosts(data || []);
      } catch (err) {
        console.error('Failed to load blog posts:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const categories = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))];

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  const featuredPost = filtered[0];
  const restPosts = filtered.slice(1);

  return (
    <div className="bg-white min-h-screen">
      <SEOHead
        title="Blog"
        description="Read the latest articles on custom printing, design tips, corporate gifting ideas, and branding strategies from Printing Ustad."
        keywords="printing blog, custom printing tips, design ideas, corporate gifts guide, branding, printing ustad blog"
        canonical="/blog"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300 mb-4 font-semibold">Printing Ustad Blog</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Ideas, Tips &<br />Inspiration
          </h1>
          <p className="text-purple-200 max-w-xl text-lg">
            Design tips, printing guides, corporate gifting ideas and everything you need to create stunning custom products.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pill-scroll py-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">article</span>
              <h3 className="text-xl font-bold text-gray-400 mb-2">No posts yet</h3>
              <p className="text-gray-400">Check back soon for fresh articles and inspiration!</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="block mb-12 group"
                >
                  <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-purple-600/5 transition-all duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      <div className="aspect-[16/10] lg:aspect-auto overflow-hidden">
                        <img
                          src={featuredPost.featured_image || 'https://placehold.co/800x500/f3f0ff/6d28d9?text=Blog+Post'}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                            {featuredPost.category || 'General'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(featuredPost.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4 group-hover:text-purple-700 transition-colors">
                          {featuredPost.title}
                        </h2>
                        <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
                          {featuredPost.excerpt || featuredPost.content?.slice(0, 200) + '...'}
                        </p>
                        <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                          Read Article
                          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Rest of Posts Grid */}
              {restPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {restPosts.map(post => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="group"
                    >
                      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-purple-600/5 transition-all duration-500 h-full flex flex-col">
                        <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                          <img
                            src={post.featured_image || 'https://placehold.co/600x375/f3f0ff/6d28d9?text=Blog'}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="bg-purple-50 text-purple-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                              {post.category || 'General'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-purple-700 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-grow">
                            {post.excerpt || post.content?.slice(0, 150) + '...'}
                          </p>
                          <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm mt-4">
                            Read more
                            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to create something amazing?</h2>
          <p className="text-purple-200 text-lg mb-8">Turn your ideas into premium custom printed products.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/shop">
              <button className="bg-white text-purple-700 font-bold px-8 py-3 rounded-full hover:bg-yellow-400 hover:text-black transition-all shadow-lg">
                Browse Products
              </button>
            </Link>
            <Link to="/customizer">
              <button className="border-2 border-white/30 text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition-all">
                Open Design Studio
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
