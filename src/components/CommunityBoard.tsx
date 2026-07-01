'use client';

import { useMemo, useRef, useState } from 'react';
import {
  USERS, ADMIN_ID, MEMBER_ID, CATEGORIES, REACTIONS, REPORT_REASONS,
  FLAGGED_KEYWORDS, SEED_POSTS,
  type Persona, type Category, type DemoPost, type ReactionKey,
} from '@/lib/mock';

const cat = (key: Category) => CATEGORIES.find((c) => c.key === key)!;

function Avatar({ id, size = 38 }: { id: string; size?: number }) {
  const u = USERS[id];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-none"
      style={{ width: size, height: size, background: u.color, fontSize: size * 0.36 }}
    >
      {u.initials}
    </div>
  );
}

function Badge({ category }: { category: Category }) {
  const c = cat(category);
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${c.color}22`, color: c.color }}>
      {c.label}
    </span>
  );
}

export default function CommunityBoard() {
  const [persona, setPersona] = useState<Persona>('admin');
  const [posts, setPosts] = useState<DemoPost[]>(SEED_POSTS);
  const [tab, setTab] = useState<'feed' | 'moderation'>('feed');
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

  const feed = useMemo(() => {
    const visible = posts.filter((p) => p.status === 'visible');
    return [...visible].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [posts]);
  const queue = useMemo(() => posts.filter((p) => p.status === 'pending' || p.status === 'hidden'), [posts]);

  // ── Actions ───────────────────────────────
  function submitPost() {
    const text = body.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const hit = FLAGGED_KEYWORDS.find((k) => lower.includes(k));
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
      ? { ...p, comments: [...p.comments, { id: nextId(), authorId: me, body: draft, createdAt: 'Just now' }] }
      : p));
    setCommentDraft((d) => ({ ...d, [postId]: '' }));
  }

  function report(postId: string, reason: string) {
    setPosts((all) => all.map((p) => {
      if (p.id !== postId) return p;
      const reports = [...p.reports, { userId: me, reason }];
      const status = reports.length >= 3 ? 'hidden' : p.status;
      return { ...p, reports, status };
    }));
    setReportFor(null);
    flash('Reported — thank you. Our team will review it.');
  }

  function moderate(postId: string, action: 'approve' | 'reject') {
    setPosts((all) => all.map((p) => p.id === postId ? { ...p, status: action === 'approve' ? 'visible' : 'rejected' } : p));
    flash(action === 'approve' ? 'Approved — now visible in the feed.' : 'Rejected — kept out of the feed.');
  }

  function togglePin(postId: string) {
    setPosts((all) => all.map((p) => p.id === postId ? { ...p, pinned: !p.pinned } : p));
    setMenuFor(null);
  }
  function removePost(postId: string) {
    setPosts((all) => all.map((p) => p.id === postId ? { ...p, status: 'rejected' } : p));
    setMenuFor(null);
    flash('Removed from the feed.');
  }

  const card = 'bg-white border border-[#E8E4DC] rounded-2xl shadow-[0_1px_3px_rgba(35,32,27,0.05)]';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-30">
        <div className="max-w-[820px] mx-auto px-4 h-[62px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#C2914A] to-[#A8742F] flex items-center justify-center shrink-0">
              <span className="text-[#1F3553] font-bold text-lg serif">A</span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[15px] text-[#23201B] serif leading-tight">Apex Community</div>
              <div className="text-[11px] text-[#8A857B] leading-tight">Internal demo · not connected to production</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Persona switcher */}
            <div className="flex items-center bg-[#F2EFE9] border border-[#E8E4DC] rounded-full p-0.5">
              {(['admin', 'member'] as Persona[]).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPersona(p); if (p === 'member') setTab('feed'); }}
                  className={`text-[12.5px] font-semibold px-3 py-1 rounded-full capitalize transition-colors ${persona === p ? 'bg-[#1F3553] text-white' : 'text-[#6E6A62]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Avatar id={me} size={34} />
          </div>
        </div>
      </header>

      <main className="max-w-[820px] mx-auto px-4 py-6">
        {/* Admin: hidden-MVP notice + kill switch */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FBF4E7] border border-[#ECDFC6] rounded-2xl px-4 py-3 mb-4">
            <div className="text-[13px] text-[#9A6B1E]">
              <strong>Hidden preview.</strong> Only admins can see the Community board — it&apos;s not in members&apos; sidebar or reachable by them.
            </div>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#23201B] shrink-0 cursor-pointer">
              <span>Community {killed ? 'paused' : 'live'}</span>
              <span
                onClick={() => setKilled((k) => !k)}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors ${killed ? 'bg-[#C0524A]' : 'bg-[#4FA07C]'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${killed ? '' : 'translate-x-4'}`} />
              </span>
            </label>
          </div>
        )}

        {/* Kill switch active + member → paused screen */}
        {killed && !isAdmin ? (
          <div className={`${card} p-12 text-center`}>
            <div className="text-4xl mb-3">🛠️</div>
            <h2 className="text-xl font-semibold text-[#23201B]">Community is temporarily paused</h2>
            <p className="text-[#6E6A62] mt-1">An admin has paused the Community board. Please check back soon.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4">
              <button onClick={() => setTab('feed')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'feed' ? 'bg-[#1F3553] text-white' : 'text-[#6E6A62] hover:bg-[#F2EFE9]'}`}>Feed</button>
              {isAdmin && (
                <button onClick={() => setTab('moderation')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${tab === 'moderation' ? 'bg-[#1F3553] text-white' : 'text-[#6E6A62] hover:bg-[#F2EFE9]'}`}>
                  Moderation
                  {queue.length > 0 && <span className="text-[11px] font-bold bg-[#C0524A] text-white rounded-full px-1.5">{queue.length}</span>}
                </button>
              )}
            </div>

            {tab === 'feed' ? (
              <>
                {/* Composer */}
                <div className={`${card} p-4 mb-4`}>
                  <div className="flex gap-3">
                    <Avatar id={me} />
                    <div className="flex-1">
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={`Share something with your team, ${USERS[me].name.split(' ')[0]}…`}
                        rows={2}
                        className="w-full resize-none text-[14px] text-[#23201B] placeholder-[#A8A296] outline-none"
                      />
                      <div className="flex items-center justify-between gap-2 flex-wrap mt-2 pt-2 border-t border-[#F1EDE5]">
                        <div className="flex gap-1.5 flex-wrap">
                          {CATEGORIES.filter((c) => !c.adminOnly || isAdmin).map((c) => (
                            <button
                              key={c.key}
                              onClick={() => setComposerCat(c.key)}
                              className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${composerCat === c.key ? 'text-white border-transparent' : 'text-[#6E6A62] border-[#E8E4DC] hover:border-[#C9A05C]'}`}
                              style={composerCat === c.key ? { background: c.color } : undefined}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <button onClick={submitPost} disabled={!body.trim()} className="bg-[#C2914A] enabled:hover:bg-[#A8742F] disabled:opacity-50 transition-colors text-white text-sm font-semibold rounded-lg px-5 py-2">Post</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed */}
                <div className="space-y-4">
                  {feed.map((p) => (
                    <article key={p.id} className={card}>
                      {p.pinned && <div className="px-5 pt-3 text-[11px] font-bold uppercase tracking-[0.6px] text-[#A8742F]">📌 Pinned Announcement</div>}
                      <div className="p-5">
                        <div className="flex items-center gap-3">
                          <Avatar id={p.authorId} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[14px] text-[#23201B]">{USERS[p.authorId].name}</span>
                              <Badge category={p.category} />
                            </div>
                            <div className="text-[12px] text-[#9A958B]">{p.createdAt}</div>
                          </div>
                          <div className="relative">
                            <button onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="text-[#B0AB9F] hover:text-[#6E6A62] px-2 text-lg leading-none">⋯</button>
                            {menuFor === p.id && (
                              <div className="absolute right-0 top-7 z-20 w-40 bg-white border border-[#E8E4DC] rounded-xl shadow-lg py-1 text-sm">
                                <button onClick={() => { setReportFor(p.id); setMenuFor(null); }} className="w-full text-left px-3 py-2 text-[#23201B] hover:bg-[#F9F7F4]">Report</button>
                                {isAdmin && <button onClick={() => togglePin(p.id)} className="w-full text-left px-3 py-2 text-[#23201B] hover:bg-[#F9F7F4]">{p.pinned ? 'Unpin' : 'Pin'}</button>}
                                {isAdmin && <button onClick={() => removePost(p.id)} className="w-full text-left px-3 py-2 text-[#C0524A] hover:bg-red-50">Remove</button>}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-[14.5px] text-[#3A372F] leading-relaxed mt-3 whitespace-pre-wrap">{p.body}</p>

                        {/* Reactions */}
                        <div className="flex items-center gap-2 mt-4">
                          {REACTIONS.map((r) => {
                            const on = p.reactions[r.key].includes(me);
                            const n = p.reactions[r.key].length;
                            return (
                              <button key={r.key} onClick={() => toggleReaction(p.id, r.key)} className={`text-[13px] rounded-full border px-2.5 py-1 transition-colors ${on ? 'border-[#C9A05C] bg-[#FCF7EE] text-[#A8742F]' : 'border-[#E8E4DC] text-[#6E6A62] hover:border-[#C9A05C]'}`}>
                                {r.emoji} {n > 0 ? n : ''}
                              </button>
                            );
                          })}
                          <button onClick={() => setOpenComments((o) => ({ ...o, [p.id]: !o[p.id] }))} className="ml-auto text-[13px] font-semibold text-[#2B4E7E]">
                            💬 {p.comments.length} {p.comments.length === 1 ? 'comment' : 'comments'}
                          </button>
                        </div>

                        {/* Comments */}
                        {openComments[p.id] && (
                          <div className="mt-3 pt-3 border-t border-[#F1EDE5] space-y-3">
                            {p.comments.map((c) => (
                              <div key={c.id} className="flex gap-2.5">
                                <Avatar id={c.authorId} size={28} />
                                <div className="flex-1 bg-[#F7F5F1] rounded-xl px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12.5px] font-semibold text-[#23201B]">{USERS[c.authorId].name}</span>
                                    <span className="text-[11px] text-[#9A958B]">{c.createdAt}</span>
                                  </div>
                                  <p className="text-[13.5px] text-[#3A372F]">{c.body}</p>
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2.5">
                              <Avatar id={me} size={28} />
                              <div className="flex-1 flex gap-2">
                                <input
                                  value={commentDraft[p.id] || ''}
                                  onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') addComment(p.id); }}
                                  placeholder="Write a comment…"
                                  className="flex-1 border border-[#E8E4DC] rounded-full px-3 py-1.5 text-[13.5px] outline-none focus:border-[#C2914A]"
                                />
                                <button onClick={() => addComment(p.id)} className="text-[13px] font-semibold text-[#2B4E7E]">Send</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              /* Moderation queue (admin) */
              <div className="space-y-4">
                <p className="text-[13.5px] text-[#6E6A62]">Posts held by keyword-flagging or auto-hidden after 3+ member reports. Nothing here is visible to members until you approve it.</p>
                {queue.length === 0 ? (
                  <div className={`${card} p-10 text-center`}>
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-[#6E6A62]">The moderation queue is clear.</p>
                  </div>
                ) : queue.map((p) => (
                  <div key={p.id} className={`${card} p-5`}>
                    <div className="flex items-center gap-3">
                      <Avatar id={p.authorId} />
                      <div className="flex-1">
                        <div className="font-semibold text-[14px] text-[#23201B]">{USERS[p.authorId].name}</div>
                        <div className="text-[12px] text-[#9A958B]">{p.createdAt}</div>
                      </div>
                      {p.status === 'pending'
                        ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F8EFDF] text-[#9A6B1E]">Keyword: “{p.flaggedKeyword}”</span>
                        : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F6E3E1] text-[#9A3B33]">{p.reports.length} reports</span>}
                    </div>
                    <p className="text-[14px] text-[#3A372F] leading-relaxed mt-3 whitespace-pre-wrap">{p.body}</p>
                    {p.reports.length > 0 && (
                      <div className="text-[12px] text-[#8A857B] mt-2">Reasons: {p.reports.map((r) => r.reason).join(', ')}</div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => moderate(p.id, 'approve')} className="bg-[#4FA07C] hover:brightness-95 text-white text-sm font-semibold rounded-lg px-4 py-2">Approve</button>
                      <button onClick={() => moderate(p.id, 'reject')} className="bg-white border border-[#E8E4DC] text-[#6E6A62] hover:border-[#C0524A] hover:text-[#C0524A] text-sm font-semibold rounded-lg px-4 py-2">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Report modal */}
      {reportFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setReportFor(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-[#23201B] serif">Report this post</h3>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#1F3553] text-white text-[13.5px] font-medium px-4 py-2.5 rounded-full shadow-lg">{toast}</div>
      )}
    </div>
  );
}
