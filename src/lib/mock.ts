// Seeded demo data for the Apex Community Board (no backend — all client-side).

export type Persona = 'admin' | 'member';
export type Category = 'general' | 'wins' | 'tips' | 'questions' | 'announcement';
export type PostStatus = 'visible' | 'pending' | 'hidden' | 'rejected';
export type ReactionKey = 'like' | 'celebrate' | 'love';

export interface DemoUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: 'admin' | 'member';
}

export interface DemoComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface DemoReport {
  userId: string;
  reason: string;
}

export interface DemoPost {
  id: string;
  authorId: string;
  category: Category;
  body: string;
  createdAt: string;
  reactions: Record<ReactionKey, string[]>; // userIds who reacted
  comments: DemoComment[];
  status: PostStatus;
  reports: DemoReport[];
  flaggedKeyword?: string;
  pinned?: boolean;
}

export const USERS: Record<string, DemoUser> = {
  u_marcus: { id: 'u_marcus', name: 'Marcus Delgado', initials: 'MD', color: '#C2914A', role: 'admin' },
  u_sella: { id: 'u_sella', name: 'Sella Daniel', initials: 'SD', color: '#2B4E7E', role: 'member' },
  u_aisha: { id: 'u_aisha', name: 'Aisha Mensah', initials: 'AM', color: '#5B8BD0', role: 'member' },
  u_james: { id: 'u_james', name: 'James Lin', initials: 'JL', color: '#4FA07C', role: 'member' },
  u_renee: { id: 'u_renee', name: 'Renee Tran', initials: 'RT', color: '#9A8FA8', role: 'member' },
};

export const ADMIN_ID = 'u_marcus';
export const MEMBER_ID = 'u_sella';

// Preventive guardrail: posts containing these go to the moderation queue.
export const FLAGGED_KEYWORDS = [
  'guaranteed', 'get rich', 'scam', 'ponzi', 'pyramid', 'quick money', 'risk-free', 'lawsuit', 'rip-off',
];

export const CATEGORIES: { key: Category; label: string; color: string; adminOnly?: boolean }[] = [
  { key: 'general', label: 'General', color: '#5B8BD0' },
  { key: 'wins', label: 'Wins', color: '#4FA07C' },
  { key: 'tips', label: 'Tips', color: '#C2914A' },
  { key: 'questions', label: 'Questions', color: '#9A8FA8' },
  { key: 'announcement', label: 'Announcement', color: '#2B4E7E', adminOnly: true },
];

export const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { key: 'love', emoji: '❤️', label: 'Love' },
];

export const REPORT_REASONS = ['Inappropriate', 'Negativity', 'Spam', 'Misinformation', 'Other'];

export const SEED_POSTS: DemoPost[] = [
  {
    id: 'p1', authorId: 'u_marcus', category: 'announcement', pinned: true,
    body: '📣 Q3 Convention dates are locked in — Sept 18–20 in Austin. Trip qualifications reset Aug 1. Full details and the qualification tracker are in Company Resources. Let\'s make this our biggest turnout yet!',
    createdAt: '2h ago', status: 'visible',
    reactions: { like: ['u_aisha', 'u_james', 'u_renee'], celebrate: ['u_sella', 'u_aisha'], love: [] },
    comments: [
      { id: 'c1', authorId: 'u_aisha', body: 'Already booked my flight! 🙌', createdAt: '1h ago' },
    ],
    reports: [],
  },
  {
    id: 'p2', authorId: 'u_aisha', category: 'wins',
    body: 'Just helped the Johnson family close a coverage gap they didn\'t know they had — used the Fact Finder to show the exact number and it clicked immediately. Third policy this week!',
    createdAt: '4h ago', status: 'visible',
    reactions: { like: ['u_sella', 'u_james'], celebrate: ['u_marcus', 'u_renee', 'u_sella'], love: ['u_marcus'] },
    comments: [
      { id: 'c2', authorId: 'u_james', body: 'The Fact Finder is a game changer. Congrats!', createdAt: '3h ago' },
      { id: 'c3', authorId: 'u_renee', body: 'Love this. What state were they in?', createdAt: '2h ago' },
    ],
    reports: [],
  },
  {
    id: 'p3', authorId: 'u_james', category: 'tips',
    body: 'My best line for the "I already have insurance through work" objection: "That\'s a great start — does it go with you if you change jobs?" Opens the whole conversation every time.',
    createdAt: 'Yesterday', status: 'visible',
    reactions: { like: ['u_aisha', 'u_renee', 'u_sella', 'u_marcus'], celebrate: [], love: ['u_renee'] },
    comments: [],
    reports: [],
  },
  {
    id: 'p4', authorId: 'u_renee', category: 'questions',
    body: 'Anyone have a good approach for following up with a lead who went quiet after the first call? Don\'t want to be pushy but don\'t want to lose them.',
    createdAt: 'Yesterday', status: 'visible',
    reactions: { like: ['u_james'], celebrate: [], love: [] },
    comments: [
      { id: 'c4', authorId: 'u_aisha', body: 'A short value text (not a "just checking in") works best for me.', createdAt: 'Yesterday' },
    ],
    reports: [],
  },
  // Reported post — auto-hidden, awaiting admin review (moderation demo)
  {
    id: 'p5', authorId: 'u_sella', category: 'general',
    body: 'Honestly getting frustrated with how slow contracting has been lately. Feels like nobody upstream cares about helping new reps get going.',
    createdAt: 'Yesterday', status: 'hidden',
    reactions: { like: [], celebrate: [], love: [] },
    comments: [],
    reports: [
      { userId: 'u_aisha', reason: 'Negativity' },
      { userId: 'u_james', reason: 'Negativity' },
      { userId: 'u_renee', reason: 'Inappropriate' },
    ],
  },
  // Keyword-flagged post — held pending, never shown publicly (moderation demo)
  {
    id: 'p6', authorId: 'u_james', category: 'tips',
    body: 'New reps — this comp plan is basically guaranteed money if you just show up. Easiest income of my life, no risk at all.',
    createdAt: '3h ago', status: 'pending', flaggedKeyword: 'guaranteed',
    reactions: { like: [], celebrate: [], love: [] },
    comments: [],
    reports: [],
  },
];
