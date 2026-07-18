import React, { useEffect, useState } from 'react';
import { Icons } from '../Icons/Icons';
import { useProfileStore } from '../../store/profileStore';
import { useCommunityStore } from '../../store/communityStore';
import { supabase } from '../../lib/supabase';

export default function CommunityFeed() {
  const profile = useProfileStore((state) => state.profile);
  const posts = useCommunityStore((state) => state.posts);
  const fetchPosts = useCommunityStore((state) => state.fetchPosts);
  const createPost = useCommunityStore((state) => state.createPost);
  const likePost = useCommunityStore((state) => state.likePost);
  const savePost = useCommunityStore((state) => state.savePost);
  const addComment = useCommunityStore((state) => state.addComment);
  const deletePost = useCommunityStore((state) => state.deletePost);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState('discussion');
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      await fetchPosts();
      await loadSavedPosts();
      setIsLoading(false);
    };
    loadData();
  }, [fetchPosts]);

  const loadSavedPosts = async () => {
    try {
      const { data } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', profile?.id);
      setSavedPosts(data?.map((s) => s.post_id) || []);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    try {
      await createPost({
        title: postTitle,
        content: postContent,
        tag: selectedTag,
      });
      setPostTitle('');
      setPostContent('');
      setSelectedTag('discussion');
      setShowCreateModal(false);
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
      await fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async (postId) => {
    try {
      await savePost(postId);
      setSavedPosts((prev) =>
        prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
      );
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;

    try {
      await addComment(postId, commentText);
      setCommentText('');
      await fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(postId);
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-red-500 to-pink-500',
      moderator: 'from-blue-500 to-cyan-500',
      contributor: 'from-green-500 to-emerald-500',
      member: 'from-purple-500 to-indigo-500',
    };
    return colors[role] || colors.member;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Icons.Crown className="w-4 h-4" />;
      case 'moderator':
        return <Icons.Flag className="w-4 h-4" />;
      case 'contributor':
        return <Icons.TrendingUp className="w-4 h-4" />;
      default:
        return <Icons.User className="w-4 h-4" />;
    }
  };

  const getTagStyles = (tag) => {
    const styles = {
      discussion: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      announcement: 'bg-red-500/20 text-red-300 border-red-500/50',
      guide: 'bg-green-500/20 text-green-300 border-green-500/50',
      fanart: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
      question: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    };
    return styles[tag] || styles.discussion;
  };

  const getTagLabel = (tag) => {
    const labels = {
      discussion: 'Discussion',
      announcement: 'Announcement',
      guide: 'Guide',
      fanart: 'Fan Art',
      question: 'Question',
    };
    return labels[tag] || tag;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl">Loading community feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Icons.ChatBubbleBottomCenterText className="w-10 h-10 text-purple-400" />
            Community Feed
          </h1>
          <p className="text-slate-300">Share, discuss, and connect with the AniEmpire community</p>
        </div>

        {/* Create Post Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full px-6 py-4 bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-xl hover:border-purple-400/50 transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                'A'
              )}
            </div>
            <span className="text-slate-400 group-hover:text-slate-300">
              What's on your mind, {profile?.username}?
            </span>
          </button>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Icons.DocumentText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-400/50 transition-all"
              >
                {/* Post Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                        {post.profiles?.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt={post.profiles?.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white hover:text-purple-300 cursor-pointer">
                            {post.profiles?.username}
                          </span>
                          {post.profiles?.role && (
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRoleColor(
                                post.profiles.role
                              )}`}
                            >
                              {getRoleIcon(post.profiles.role)}
                              {post.profiles.role.charAt(0).toUpperCase() +
                                post.profiles.role.slice(1)}
                            </div>
                          )}
                          {post.profiles?.guild_id && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-700/50 border border-slate-600">
                              <Icons.BuildingLibrary className="w-3 h-3" />
                              <span className="text-slate-300">{post.guild_name}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(post.created_at).toLocaleDateString()} at{' '}
                          {new Date(post.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Post Actions Dropdown */}
                    {profile?.id === post.user_id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        title="Delete post"
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Post Title and Content */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>
                    <p className="text-slate-300 leading-relaxed">{post.content}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getTagStyles(
                        post.tag
                      )}`}
                    >
                      {getTagLabel(post.tag)}
                    </span>
                  </div>
                </div>

                {/* Post Stats & Interactions */}
                <div className="px-6 py-4 bg-slate-900/30">
                  <div className="flex items-center justify-between mb-4 text-sm text-slate-400">
                    <span>{post.likes_count || 0} likes</span>
                    <span>{post.comments_count || 0} comments</span>
                  </div>

                  {/* Interaction Buttons */}
                  <div className="flex gap-3 border-t border-slate-700/50 pt-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                        post.user_liked
                          ? 'bg-red-500/20 text-red-300'
                          : 'text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <Icons.Heart
                        className="w-5 h-5"
                        fill={post.user_liked}
                      />
                      Like
                    </button>
                    <button
                      onClick={() =>
                        setExpandedPost(expandedPost === post.id ? null : post.id)
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 transition-all"
                    >
                      <Icons.MessageSquare className="w-5 h-5" />
                      Comment
                    </button>
                    <button
                      onClick={() => handleSave(post.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                        savedPosts.includes(post.id)
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <Icons.Bookmark
                        className="w-5 h-5"
                        fill={savedPosts.includes(post.id)}
                      />
                      Save
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 transition-all">
                      <Icons.Share className="w-5 h-5" />
                      Share
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {expandedPost === post.id && (
                  <div className="border-t border-slate-700/50 bg-slate-900/50 p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Icons.MessageSquare className="w-5 h-5" />
                      Comments ({post.comments?.length || 0})
                    </h3>

                    {/* Comments List */}
                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm flex-shrink-0">
                              {comment.profiles?.avatar_url ? (
                                <img
                                  src={comment.profiles.avatar_url}
                                  alt={comment.profiles?.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                'C'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-white">
                                  {comment.profiles?.username}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-sm">No comments yet. Be the first!</p>
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm flex-shrink-0">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile?.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          'Y'
                        )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentText.trim()}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 rounded-lg text-white transition-all"
                        >
                          <Icons.PaperAirplane className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-800 border border-purple-500/30 rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Icons.DocumentText className="w-6 h-6" />
                Create a Post
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Icons.X className="w-6 h-6 text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="What's your post about?"
                  maxLength={200}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-purple-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your thoughts, ideas, or questions..."
                  maxLength={5000}
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-purple-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                  required
                />
                <div className="text-xs text-slate-500 mt-1">
                  {postContent.length}/5000 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-purple-400/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="discussion">Discussion</option>
                  <option value="announcement">Announcement</option>
                  <option value="guide">Guide</option>
                  <option value="fanart">Fan Art</option>
                  <option value="question">Question</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!postTitle.trim() || !postContent.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Icons.PaperAirplane className="w-4 h-4" />
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
