'use client';

import { useMemo, useRef, useState } from 'react';
import {
  MessageSquare, Megaphone, ShieldCheck, BookOpen, MoreHorizontal, Flag, Pin, PinOff,
  Trash2, Send, ThumbsUp, PartyPopper, Heart, Check, X, Sparkles, Lock, AlertTriangle,
} from 'lucide-react';
import {
  USERS, ADMIN_ID, MEMBER_ID, CATEGORIES, REPORT_REASONS, FLAGGED_KEYWORDS, SEED_POSTS,
  type Persona, type Category, type DemoPost, type ReactionKey,
} from '@/lib/mock';

type Tab = 'feed' | 'announcements' | 'moderation' | 'guidelines';

const catMeta = (key: Category) => CATEGORIES.find((c) => c.key === key)!;

const REACTION_ICONS: { key: ReactionKey; Icon: typeof ThumbsUp; label: string }[] = [
  { key: 'like', Icon: ThumbsUp, label: 'Like' },
  { key: 'celebrate', Icon: PartyPopper, label: 'Celebrate' },
  { key: 'love', Icon: Heart, label: 'Love' },
];

const GUIDELINES: { title: string; body: string }[] = [
  { title: 'Keep it professional & respectful', body: 'Treat every member the way you would in the field. Constructive, encouraging, and honest.' },
  { title: 'No income guarantees or misleading claims', body: 'Posts with phrases like “guaranteed,” “risk-free,” or “get rich” are automatically held for admin review before anyone sees them.' },
  { title: 'No naming, shaming, or venting at people', body: 'Frustrations happen — bring them to your upline or support, not the feed. Negative call-outs get reported and hidden.' },
  { title: 'Report anything off — anonymously', body: 'Every post has a Report option. Reporting is anonymous to the author, and 3+ reports auto-hide a post for admin review.' },
  { title: 'Announcements are admin-only', body: 'Official company updates come from admins and are clearly marked and pinned.' },
  { title: 'Admins can moderate or pause anytime', body: 'Admins review flagged/reported content and can pause the whole board instantly if needed.' },
];

function Avatar({ id, size = 40, ring }: { id: string; size?: number; ring?: boolean }) {
  const u = USERS[id];
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold flex-none ${ring ? 'ring-2 ring-[#C2914A]/40' : ''}`}
      style={{ width: size, height: size, background: u.color, fontSize: size * 0.36 }}
    >
      {u.initials}
    </div>
  );
}

function Badge({ category }: { category: Category }) {
  const c = catMeta(category);
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${c.color}1f`, color: c.color }}>
      {c.label}
    </span>
  );
}

export default function CommunityBoard() {
  const [persona, setPersona] = useState<Persona>('admin');
  const [posts, setPosts] = useState<DemoPost[]>(SEED_POSTS);
  const [tab, setTab] = useState<Tab>('feed');
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
  const [killed, setKilled] = useState(false);
  const [body, setBody] = useState('');
  const [composerCat, setComposerCat] = useState<Category>('general');
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(1000);
  const nextId = () => 'x' + idRef.current++;

  const me = persona === 'admin' ? ADMIN_ID : MEMBER_ID;
  const isAdmin = persona === 'admin';
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600); };

  const visible = useMemo(() => posts.filter((p) => p.status === 'visible'), [posts]);
  const feed = useMemo(() => {
    const list = catFilter === 'all' ? visible : visible.filter((p) => p.category === catFilter);
    return [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [visible, catFilter]);
  const announcements = useMemo(() => visible.filter((p) => p.category === 'announcement'), [visible]);
  const queue = useMemo(() => posts.filter((p) => p.status === 'pending' || p.status === 'hidden'), [posts]);
  const pinned = useMemo(() => visible.find((p) => p.pinned), [visible]);

  // ── Actions ───────────────────────────────
  function submitPost() {
    const text = body.trim();
    if (!text) return;
    const hit = FLAGGED_KEYWORDS.find((k) => text.toLowerCase().includes(k));
    const post: DemoPost = {
      id: nextId(), authorId: me, category: composerCat, body: text, createdAt: 'Just now',
      reactions: { like: [], celebrate: [], love: [] }, comments: [], reports: [],
      status: hit ? 'pending' : 'visible', flaggedKeyword: hit,
    };
    setPosts((p) => [post, ...p]);
    setBody(''); setComposerCat('general');
    flash(hit ? 'Held for review — a flagged phrase was detected.' : 'Posted to the community.');
  }
  function toggleReaction(postId: string, key: ReactionKey) {
    setPosts((all) => all.map((p) => {
      if (p.id !== postId) return p;
      const list = p.reactions[key];
      const has = list.includes(me);
      return { ...p, reactions: { ...p.reactions, [key]: has ? list.filter((u) => u !== me) : [...list, me] } };
    }));
  }
  function addComment(postId: string) {
    const draft = (commentDraft[postId] || '').trim();
    if (!draft) return;
    setPosts((all) => all.map((p) => p.id === postId
      ? { ...p, comments: [...p.comments, { id: nextId(), authorId: me, body: draft, createdAt: 'Just now' }] } : p));
    setCommentDraft((d) => ({ ...d, [postId]: '' }));
  }
  function report(postId: string, reason: string) {
    setPosts((all) => all.map((p) => {
      if (p.id !== postId) return p;
      const reports = [...p.reports, { userId: me, reason }];
      return { ...p, reports, status: reports.length >= 3 ? 'hidden' : p.status };
    }));
    setReportFor(null);
    flash('Reported — thank you. Our team will review it.');
  }
  function moderate(postId: string, action: 'approve' | 'reject') {
    setPosts((all) => all.map((p) => p.id === postId ? { ...p, status: action === 'approve' ? 'visible' : 'rejected' } : p));
    flash(action === 'approve' ? 'Approved — now visible in the feed.' : 'Rejected — kept out of the feed.');
  }
  function togglePin(postId: string) { setPosts((all) => all.map((p) => p.id === postId ? { ...p, pinned: !p.pinned } : p)); setMenuFor(null); }
  function removePost(postId: string) { setPosts((all) => all.map((p) => p.id === postId ? { ...p, status: 'rejected' } : p)); setMenuFor(null); flash('Removed from the feed.'); }

  const card = 'bg-white border border-[#E8E4DC] rounded-2xl shadow-[0_1px_3px_rgba(35,32,27,0.05)]';
  const titles: Record<Tab, { t: string; s: string }> = {
    feed: { t: 'Community', s: 'Share wins, tips, and questions with your team.' },
    announcements: { t: 'Announcements', s: 'Official updates from Apex.' },
    moderation: { t: 'Moderation', s: 'Review flagged & reported posts before anyone sees them.' },
    guidelines: { t: 'Community Guidelines', s: 'How we keep this a professional, trustworthy space.' },
  };

  const NAV: { key: Tab; label: string; Icon: typeof MessageSquare; adminOnly?: boolean; count?: number }[] = [
    { key: 'feed', label: 'Feed', Icon: MessageSquare },
    { key: 'announcements', label: 'Announcements', Icon: Megaphone },
    { key: 'moderation', label: 'Moderation', Icon: ShieldCheck, adminOnly: true, count: queue.length },
    { key: 'guidelines', label: 'Guidelines', Icon: BookOpen },
  ];

  // ── Post card ──────────────────────────────
  function PostCard({ p }: { p: DemoPost }) {
    return (
      <article className={`${p.pinned ? 'bg-gradient-to-br from-white to-[#FCF7EE] border-[#ECDFC6]' : 'bg-white border-[#E8E4DC]'} border rounded-2xl shadow-[0_1px_3px_rgba(35,32,27,0.05)]`}>
        {p.pinned && (
          <div className="flex items-center gap-1.5 px-5 pt-3 text-[11px] font-bold uppercase tracking-[0.6px] text-[#A8742F]">
            <Pin size={13} /> Pinned announcement
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Avatar id={p.authorId} ring />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[14px] text-[#23201B]">{USERS[p.authorId].name}</span>
                <Badge category={p.category} />
              </div>
              <div className="text-[12px] text-[#9A958B]">{p.createdAt}</div>
            </div>
            <div className="relative">
              <button onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="text-[#B0AB9F] hover:text-[#6E6A62] p-1 rounded-md hover:bg-[#F7F5F1]"><MoreHorizontal size={18} /></button>
              {menuFor === p.id && (
                <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-[#E8E4DC] rounded-xl shadow-lg py-1 text-sm">
                  <button onClick={() => { setReportFor(p.id); setMenuFor(null); }} className="w-full flex items-center gap-2 text-left px-3 py-2 text-[#23201B] hover:bg-[#F9F7F4]"><Flag size={14} /> Report</button>
                  {isAdmin && <button onClick={() => togglePin(p.id)} className="w-full flex items-center gap-2 text-left px-3 py-2 text-[#23201B] hover:bg-[#F9F7F4]">{p.pinned ? <><PinOff size={14} /> Unpin</> : <><Pin size={14} /> Pin</>}</button>}
                  {isAdmin && <button onClick={() => removePost(p.id)} className="w-full flex items-center gap-2 text-left px-3 py-2 text-[#C0524A] hover:bg-red-50"><Trash2 size={14} /> Remove</button>}
                </div>
              )}
            </div>
          </div>
          <p className="text-[14.5px] text-[#3A372F] leading-relaxed mt-3 whitespace-pre-wrap">{p.body}</p>
          <div className="flex items-center gap-2 mt-4">
            {REACTION_ICONS.map(({ key, Icon }) => {
              const on = p.reactions[key].includes(me);
              const n = p.reactions[key].length;
              return (
                <button key={key} onClick={() => toggleReaction(p.id, key)} className={`flex items-center gap-1.5 text-[13px] rounded-full border px-2.5 py-1 transition-all hover:-translate-y-px ${on ? 'border-[#C9A05C] bg-[#FCF7EE] text-[#A8742F]' : 'border-[#E8E4DC] text-[#6E6A62] hover:border-[#C9A05C]'}`}>
                  <Icon size={14} /> {n > 0 ? n : ''}
                </button>
              );
            })}
            <button onClick={() => setOpenComments((o) => ({ ...o, [p.id]: !o[p.id] }))} className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold text-[#2B4E7E]">
              <MessageSquare size={14} /> {p.comments.length}
            </button>
          </div>
          {openComments[p.id] && (
            <div className="mt-3 pt-3 border-t border-[#F1EDE5] space-y-3">
              {p.comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar id={c.authorId} size={28} />
                  <div className="flex-1 bg-[#F7F5F1] rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2"><span className="text-[12.5px] font-semibold text-[#23201B]">{USERS[c.authorId].name}</span><span className="text-[11px] text-[#9A958B]">{c.createdAt}</span></div>
                    <p className="text-[13.5px] text-[#3A372F]">{c.body}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2.5">
                <Avatar id={me} size={28} />
                <div className="flex-1 flex gap-2">
                  <input value={commentDraft[p.id] || ''} onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') addComment(p.id); }} placeholder="Write a comment…" className="flex-1 border border-[#E8E4DC] rounded-full px-3 py-1.5 text-[13.5px] outline-none focus:border-[#C2914A]" />
                  <button onClick={() => addComment(p.id)} className="flex items-center gap-1 text-[13px] font-semibold text-[#2B4E7E]"><Send size={13} /> Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7F5F1]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-[#1F3553] text-[#E8EEF6] sticky top-0 h-screen overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2.5 px-2 pb-4">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#C2914A] to-[#A8742F] flex items-center justify-center shrink-0"><span className="text-[#1F3553] font-bold text-lg serif">A</span></div>
            <div className="font-semibold text-[15px] serif">Apex Community</div>
          </div>
          <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-3 flex items-center gap-3">
            <Avatar id={me} size={40} />
            <div className="min-w-0">
              <div className="font-semibold text-[13.5px] truncate">{USERS[me].name}</div>
              <div className="text-[11.5px] text-[#9DB2CC] capitalize">{persona}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map(({ key, label, Icon, count }) => (
            <button key={key} onClick={() => setTab(key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-colors ${tab === key ? 'bg-white/10 text-white font-semibold' : 'text-[#C2D2E4] hover:bg-white/[0.06]'}`}>
              <Icon size={17} /> <span className="flex-1 text-left">{label}</span>
              {typeof count === 'number' && count > 0 && <span className="text-[11px] font-bold bg-[#C2914A] text-[#1F3553] rounded-full px-1.5">{count}</span>}
            </button>
          ))}
        </nav>
        {isAdmin && (
          <div className="p-3 border-t border-white/[0.08]">
            <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold flex items-center gap-1.5">{killed ? <Lock size={13} /> : <Sparkles size={13} />} Community {killed ? 'paused' : 'live'}</span>
                <button onClick={() => setKilled((k) => !k)} className={`w-10 h-6 rounded-full p-0.5 transition-colors ${killed ? 'bg-[#C0524A]' : 'bg-[#4FA07C]'}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${killed ? '' : 'translate-x-4'}`} />
                </button>
              </div>
              <p className="text-[11px] text-[#9DB2CC] mt-1.5">Kill switch — instantly hides the board from members.</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-20">
          <div className="px-5 lg:px-8 h-[62px] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold text-[#23201B] serif leading-tight truncate">{titles[tab].t}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#F2EFE9] border border-[#E8E4DC] rounded-full p-0.5">
                {(['admin', 'member'] as Persona[]).map((pn) => (
                  <button key={pn} onClick={() => { setPersona(pn); if (pn === 'member' && (tab === 'moderation')) setTab('feed'); }} className={`text-[12.5px] font-semibold px-3 py-1 rounded-full capitalize transition-colors ${persona === pn ? 'bg-[#1F3553] text-white' : 'text-[#6E6A62]'}`}>{pn}</button>
                ))}
              </div>
              <Avatar id={me} size={34} />
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 lg:px-8 py-6">
          <div className="max-w-[1120px] mx-auto">
            <p className="text-[14.5px] text-[#6E6A62] mb-5 max-w-[640px]">{titles[tab].s}</p>

            {killed && !isAdmin ? (
              <div className={`${card} p-14 text-center`}>
                <Lock size={34} className="mx-auto text-[#C2914A] mb-3" />
                <h2 className="text-xl font-semibold text-[#23201B]">Community is temporarily paused</h2>
                <p className="text-[#6E6A62] mt-1">An admin has paused the Community board. Please check back soon.</p>
              </div>
            ) : tab === 'guidelines' ? (
              <div className="max-w-[760px] space-y-3">
                {GUIDELINES.map((g, i) => (
                  <div key={i} className={`${card} p-5`}>
                    <h3 className="text-[15px] font-semibold text-[#23201B] serif">{g.title}</h3>
                    <p className="text-[13.5px] text-[#6E6A62] mt-1 leading-relaxed">{g.body}</p>
                  </div>
                ))}
              </div>
            ) : tab === 'moderation' ? (
              <div className="max-w-[760px] space-y-4">
                {queue.length === 0 ? (
                  <div className={`${card} p-12 text-center`}><Check size={30} className="mx-auto text-[#4FA07C] mb-2" /><p className="text-[#6E6A62]">The moderation queue is clear.</p></div>
                ) : queue.map((p) => (
                  <div key={p.id} className={`${card} p-5`}>
                    <div className="flex items-center gap-3">
                      <Avatar id={p.authorId} />
                      <div className="flex-1"><div className="font-semibold text-[14px] text-[#23201B]">{USERS[p.authorId].name}</div><div className="text-[12px] text-[#9A958B]">{p.createdAt}</div></div>
                      {p.status === 'pending'
                        ? <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F8EFDF] text-[#9A6B1E]"><AlertTriangle size={12} /> “{p.flaggedKeyword}”</span>
                        : <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F6E3E1] text-[#9A3B33]"><Flag size={12} /> {p.reports.length}</span>}
                    </div>
                    <p className="text-[14px] text-[#3A372F] leading-relaxed mt-3 whitespace-pre-wrap">{p.body}</p>
                    {p.reports.length > 0 && <div className="text-[12px] text-[#8A857B] mt-2">Reasons: {p.reports.map((r) => r.reason).join(', ')}</div>}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => moderate(p.id, 'approve')} className="flex items-center gap-1.5 bg-[#4FA07C] hover:brightness-95 text-white text-sm font-semibold rounded-lg px-4 py-2"><Check size={15} /> Approve</button>
                      <button onClick={() => moderate(p.id, 'reject')} className="flex items-center gap-1.5 bg-white border border-[#E8E4DC] text-[#6E6A62] hover:border-[#C0524A] hover:text-[#C0524A] text-sm font-semibold rounded-lg px-4 py-2"><X size={15} /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : tab === 'announcements' ? (
              <div className="max-w-[760px] space-y-4">
                {announcements.length === 0 ? <div className={`${card} p-12 text-center`}><Megaphone size={28} className="mx-auto text-[#C2914A] mb-2" /><p className="text-[#6E6A62]">No announcements yet.</p></div> : announcements.map((p) => <PostCard key={p.id} p={p} />)}
              </div>
            ) : (
              /* FEED */
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
                <div>
                  {/* Hero */}
                  <div className="rounded-2xl bg-gradient-to-br from-[#1F3553] to-[#2B4E7E] text-white p-6 mb-4 relative overflow-hidden">
                    <Sparkles size={90} className="absolute -right-4 -top-4 text-white/5" />
                    <h2 className="text-[22px] font-semibold serif">Welcome to the Apex Community</h2>
                    <p className="text-[14px] text-white/75 mt-1 max-w-[520px]">A place to share wins, swap what&apos;s working, and grow together — kept professional by design.</p>
                    {isAdmin && (
                      <div className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium bg-white/10 border border-white/15 rounded-full px-3 py-1"><Lock size={12} /> Hidden preview — members can&apos;t see this yet</div>
                    )}
                  </div>

                  {/* Category filter */}
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {(['all', 'general', 'wins', 'tips', 'questions'] as const).map((k) => (
                      <button key={k} onClick={() => setCatFilter(k)} className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-full border capitalize transition-colors ${catFilter === k ? 'bg-[#1F3553] text-white border-transparent' : 'bg-white text-[#6E6A62] border-[#E8E4DC] hover:border-[#C9A05C]'}`}>{k === 'all' ? 'All' : catMeta(k).label}</button>
                    ))}
                  </div>

                  {/* Composer */}
                  <div className={`${card} p-4 mb-4`}>
                    <div className="flex gap-3">
                      <Avatar id={me} ring />
                      <div className="flex-1">
                        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Share something with your team, ${USERS[me].name.split(' ')[0]}…`} rows={2} className="w-full resize-none text-[14px] text-[#23201B] placeholder-[#A8A296] outline-none" />
                        <div className="flex items-center justify-between gap-2 flex-wrap mt-2 pt-2 border-t border-[#F1EDE5]">
                          <div className="flex gap-1.5 flex-wrap">
                            {CATEGORIES.filter((c) => !c.adminOnly || isAdmin).map((c) => (
                              <button key={c.key} onClick={() => setComposerCat(c.key)} className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${composerCat === c.key ? 'text-white border-transparent' : 'text-[#6E6A62] border-[#E8E4DC] hover:border-[#C9A05C]'}`} style={composerCat === c.key ? { background: c.color } : undefined}>{c.label}</button>
                            ))}
                          </div>
                          <button onClick={submitPost} disabled={!body.trim()} className="flex items-center gap-1.5 bg-[#C2914A] enabled:hover:bg-[#A8742F] disabled:opacity-50 transition-colors text-white text-sm font-semibold rounded-lg px-5 py-2"><Send size={14} /> Post</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feed */}
                  <div className="space-y-4">
                    {feed.length === 0 ? <div className={`${card} p-12 text-center`}><p className="text-[#6E6A62]">Nothing here yet — be the first to post.</p></div> : feed.map((p) => <PostCard key={p.id} p={p} />)}
                  </div>
                </div>

                {/* Right rail */}
                <aside className="hidden xl:block space-y-4 sticky top-[86px]">
                  <div className={`${card} p-5`}>
                    <div className="flex items-center gap-2 text-[#23201B]"><BookOpen size={16} className="text-[#C2914A]" /><h3 className="text-[15px] font-semibold serif">Community Guidelines</h3></div>
                    <p className="text-[13px] text-[#6E6A62] mt-2 leading-relaxed">Keep it professional and encouraging. No income guarantees, no call-outs. Report anything off — it&apos;s anonymous.</p>
                    <button onClick={() => setTab('guidelines')} className="mt-3 text-[13px] font-semibold text-[#2B4E7E]">Read the guidelines →</button>
                  </div>
                  {pinned && (
                    <div className="rounded-2xl bg-gradient-to-br from-white to-[#FCF7EE] border border-[#ECDFC6] p-5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.6px] text-[#A8742F]"><Pin size={12} /> Pinned</div>
                      <p className="text-[13.5px] text-[#3A372F] mt-2 leading-relaxed line-clamp-4">{pinned.body}</p>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Report modal */}
      {reportFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setReportFor(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-[#23201B] serif flex items-center gap-2"><Flag size={16} className="text-[#C0524A]" /> Report this post</h3>
            <p className="text-[13px] text-[#6E6A62] mt-1 mb-3">Your report is anonymous to the author. 3+ reports auto-hide a post for admin review.</p>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <button key={r} onClick={() => report(reportFor, r)} className="w-full text-left text-[14px] text-[#23201B] border border-[#E8E4DC] rounded-lg px-3 py-2 hover:border-[#C9A05C] hover:bg-[#FCF7EE]">{r}</button>
              ))}
            </div>
            <button onClick={() => setReportFor(null)} className="w-full mt-3 text-[13px] text-[#8A857B]">Cancel</button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#1F3553] text-white text-[13.5px] font-medium px-4 py-2.5 rounded-full shadow-lg">{toast}</div>}
    </div>
  );
}
