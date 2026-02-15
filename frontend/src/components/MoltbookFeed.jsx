import React, { useState, useEffect, Component } from 'react';
import { MessageSquare, Heart, Repeat, User } from 'lucide-react';

// Error Boundary to prevent crashes from taking down the whole page
class FeedErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 border border-red-500/20 bg-red-500/5 rounded text-[10px] text-red-400 font-mono text-center">
                    FEED_RENDER_ERROR — Refresh page to retry
                </div>
            );
        }
        return this.props.children;
    }
}

const MoltbookFeedInner = ({ agentAddress }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';

    const fetchPosts = async () => {
        try {
            const response = await fetch(`${MOLTBOOK_API}/posts?submolt=game-arena&limit=10`);
            if (!response.ok) {
                setError(`HTTP ${response.status}`);
                return;
            }
            const data = await response.json();

            if (data && data.success && Array.isArray(data.posts)) {
                setPosts(data.posts);
                setError(null);
            } else {
                setError(data?.error || 'Feed unavailable');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, 60000);
        return () => clearInterval(interval);
    }, []);

    // Safe helpers to extract display values from API response
    const getSubmoltName = (post) => {
        if (!post.submolt) return 'general';
        if (typeof post.submolt === 'string') return post.submolt;
        return post.submolt.name || post.submolt.display_name || 'general';
    };

    const getAuthorName = (post) => {
        return post.agent?.name || post.author?.name || 'Unknown';
    };

    const getTimeString = (post) => {
        try {
            if (!post.created_at) return '...';
            return new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '...';
        }
    };

    // Truncate long wallet addresses like 0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1 → 0x2E33...7Ad1
    const formatContent = (content) => {
        if (!content) return '';
        return String(content).replace(/0x[a-fA-F0-9]{20,}/g, (addr) =>
            `${addr.slice(0, 6)}...${addr.slice(-4)}`
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-purple-500 animate-pulse uppercase font-bold tracking-widest">Loading Feed...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border border-red-500/20 bg-red-500/5 rounded text-[10px] text-red-400 font-mono text-center">
                OFFLINE: {String(error)}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.length === 0 ? (
                <div className="text-[10px] text-gray-600 italic text-center py-4">
                    NO_RECENT_SOCIAL_DATA
                </div>
            ) : (
                posts.map((post, index) => (
                    <div key={post.id || index} className="bg-white/5 border border-white/5 rounded-lg p-3 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-[10px]">
                                    <User size={12} className="text-purple-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-gray-200 truncate max-w-[120px]">
                                        {getAuthorName(post)}
                                    </span>
                                    <span className="text-[9px] text-gray-500 lowercase">m/{getSubmoltName(post)}</span>
                                </div>
                            </div>
                            <span className="text-[9px] text-gray-600 font-mono">
                                {getTimeString(post)}
                            </span>
                        </div>

                        <div className="text-[11px] leading-relaxed text-gray-300 font-mono mb-3 pl-1 border-l-2 border-purple-500/20" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {formatContent(post.content)}
                        </div>

                        <div className="flex items-center gap-4 text-[9px] text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 hover:text-purple-400 cursor-pointer">
                                <MessageSquare size={10} />
                                <span>{post.comment_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 hover:text-pink-400 cursor-pointer">
                                <Heart size={10} />
                                <span>{post.upvotes || post.upvote_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 hover:text-green-400 cursor-pointer">
                                <Repeat size={10} />
                                <span>{post.repost_count || 0}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}

            <a
                href="https://www.moltbook.com"
                target="_blank"
                rel="noreferrer"
                className="block text-center py-2 border border-purple-500/20 rounded hover:bg-purple-900/10 transition-colors"
            >
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Open Moltbook.com</span>
            </a>
        </div>
    );
};

// Wrap in error boundary so a crash here won't take down the whole page
const MoltbookFeed = (props) => (
    <FeedErrorBoundary>
        <MoltbookFeedInner {...props} />
    </FeedErrorBoundary>
);

export default MoltbookFeed;
