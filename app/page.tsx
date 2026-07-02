"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type Task = {
  id: string;
  subject: string;
  title: string;
  minutes: number;
  done: boolean;
  createdAt: string;
};

type Exam = {
  id: string;
  name: string;
  date: string;
};

type Rarity = "N" | "R" | "SR" | "SSR";

type SubjectStat = {
  totalMinutes: number;
};

type AchievementUnlocks = Record<string, string>;

type History = Record<string, number>;
type SubjectStats = Record<string, SubjectStat>;

type AchievementContext = {
  totalMinutes: number;
  doneTaskCount: number;
  subjectCount: number;
  subjectStats: SubjectStats;
  history: History;
  lastTaskMinutes: number;
  galleryOpenCount: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  rarity: Rarity;
  rewardSrc: string;
  secret?: boolean;
  condition: (ctx: AchievementContext) => boolean;
};

const TASK_KEY = "study-tasks-linked";
const EXAM_KEY = "study-exams-linked";
const REWARD_KEY = "study-unlocked-rewards";
const ACHIEVEMENT_KEY = "study-achievements";
const SUBJECT_KEY = "study-subject-stats";
const HISTORY_KEY = "study-history";
const assistantImages = [
  "/assistants/assistant01.png",
  "/assistants/assistant02.png",
  "/assistants/assistant03.png",
  "/assistants/assistant04.png",
  "/assistants/assistant05.png",
  "/assistants/assistant06.png",
  "/assistants/assistant07.png",
  "/assistants/assistant08.png",
  "/assistants/assistant09.png",
];

const initialExams: Exam[] = [];

function hasSubjectMinutes(c: AchievementContext, minutes: number) {
  return Object.values(c.subjectStats).some((s) => s.totalMinutes >= minutes);
}

const achievements: Achievement[] = [
  {
    id: "first-study",
    title: "はじめの一歩",
    description: "初めてタスクを完了",
    rarity: "N",
    rewardSrc: "/rewards/first-study.png",
    condition: (c) => c.doneTaskCount >= 1,
  },
  {
    id: "study-30",
    title: "ウォームアップ",
    description: "累計30分勉強",
    rarity: "N",
    rewardSrc: "/rewards/study-30.png",
    condition: (c) => c.totalMinutes >= 30,
  },
  {
    id: "study-60",
    title: "集中モード",
    description: "累計60分勉強",
    rarity: "N",
    rewardSrc: "/rewards/study-60.png",
    condition: (c) => c.totalMinutes >= 60,
  },
  {
    id: "study-120",
    title: "助走完了",
    description: "累計120分勉強",
    rarity: "N",
    rewardSrc: "/rewards/study-120.png",
    condition: (c) => c.totalMinutes >= 120,
  },
  {
    id: "task-3",
    title: "三つ片付けた",
    description: "3タスク完了",
    rarity: "N",
    rewardSrc: "/rewards/task-3.png",
    condition: (c) => c.doneTaskCount >= 3,
  },
  {
    id: "subject-1",
    title: "専門家の卵",
    description: "1科目を学習",
    rarity: "N",
    rewardSrc: "/rewards/subject-1.png",
    condition: (c) => c.subjectCount >= 1,
  },
  {
    id: "study-180",
    title: "今日けっこう強い",
    description: "累計180分勉強",
    rarity: "R",
    rewardSrc: "/rewards/study-180.png",
    condition: (c) => c.totalMinutes >= 180,
  },
  {
    id: "study-300",
    title: "勉強戦士",
    description: "累計300分勉強",
    rarity: "R",
    rewardSrc: "/rewards/study-300.png",
    condition: (c) => c.totalMinutes >= 300,
  },
  {
    id: "study-600",
    title: "10時間突破",
    description: "累計10時間勉強",
    rarity: "R",
    rewardSrc: "/rewards/study-600.png",
    condition: (c) => c.totalMinutes >= 600,
  },
  {
    id: "task-5",
    title: "タスク処理班",
    description: "5タスク完了",
    rarity: "R",
    rewardSrc: "/rewards/task-5.png",
    condition: (c) => c.doneTaskCount >= 5,
  },
  {
    id: "task-10",
    title: "小さな山を越えた",
    description: "10タスク完了",
    rarity: "R",
    rewardSrc: "/rewards/task-10.png",
    condition: (c) => c.doneTaskCount >= 10,
  },
  {
    id: "subject-2",
    title: "二刀流",
    description: "2科目以上学習",
    rarity: "R",
    rewardSrc: "/rewards/subject-2.png",
    condition: (c) => c.subjectCount >= 2,
  },
  {
    id: "subject-3",
    title: "三刀流",
    description: "3科目以上学習",
    rarity: "R",
    rewardSrc: "/rewards/subject-3.png",
    condition: (c) => c.subjectCount >= 3,
  },
  {
    id: "subject-60",
    title: "得意科目の芽",
    description: "1科目で累計60分勉強",
    rarity: "R",
    rewardSrc: "/rewards/level-3.png",
    condition: (c) => hasSubjectMinutes(c, 60),
  },
  {
    id: "subject-300",
    title: "ひとつ育ってきた",
    description: "1科目で累計300分勉強",
    rarity: "R",
    rewardSrc: "/rewards/level-5.png",
    condition: (c) => hasSubjectMinutes(c, 300),
  },
  {
    id: "study-1200",
    title: "積み上げる者",
    description: "累計20時間勉強",
    rarity: "SR",
    rewardSrc: "/rewards/study-1200.png",
    condition: (c) => c.totalMinutes >= 1200,
  },
  {
    id: "study-1800",
    title: "さらに積み上げる者",
    description: "累計30時間勉強",
    rarity: "SR",
    rewardSrc: "/rewards/study-1800.png",
    condition: (c) => c.totalMinutes >= 1800,
  },
  {
    id: "study-3000",
    title: "50時間の壁",
    description: "累計50時間勉強",
    rarity: "SR",
    rewardSrc: "/rewards/study-3000.png",
    condition: (c) => c.totalMinutes >= 3000,
  },
  {
    id: "task-20",
    title: "習慣の芽生え",
    description: "20タスク完了",
    rarity: "SR",
    rewardSrc: "/rewards/task-20.png",
    condition: (c) => c.doneTaskCount >= 20,
  },
  {
    id: "task-30",
    title: "習慣の気配",
    description: "30タスク完了",
    rarity: "SR",
    rewardSrc: "/rewards/task-30.png",
    condition: (c) => c.doneTaskCount >= 30,
  },
  {
    id: "task-50",
    title: "タスクハンター",
    description: "50タスク完了",
    rarity: "SR",
    rewardSrc: "/rewards/task-50.png",
    condition: (c) => c.doneTaskCount >= 50,
  },
  {
    id: "task-70",
    title: "タスクの鬼",
    description: "70タスク完了",
    rarity: "SR",
    rewardSrc: "/rewards/task-70.png",
    condition: (c) => c.doneTaskCount >= 70,
  },
  {
    id: "subject-600",
    title: "推し科目",
    description: "1科目で累計10時間勉強",
    rarity: "SR",
    rewardSrc: "/rewards/level-10.png",
    condition: (c) => hasSubjectMinutes(c, 600),
  },
  {
    id: "secret-night",
    title: "夜更かしさん",
    description: "0時〜4時にタスクを1つ完了した",
    rarity: "SR",
    rewardSrc: "/rewards/secret-night.png",
    secret: true,
    condition: () => {
      const h = new Date().getHours();
      return h >= 0 && h < 4;
    },
  },
  {
    id: "secret-early",
    title: "早起きは三文の徳",
    description: "5時〜7時にタスクを1つ完了した",
    rarity: "SR",
    rewardSrc: "/rewards/secret-early.png",
    secret: true,
    condition: () => {
      const h = new Date().getHours();
      return h >= 5 && h < 7;
    },
  },
  {
  id: "collector",
  title: "コレクター",
  description: "ギャラリーを20回開いた",
  rarity: "R",
  rewardSrc: "/rewards/collector.png",
  condition: (c) => c.galleryOpenCount >= 20,
},
  {
  id: "imaginary-time",
  title: "そんなことしてる場合？",
  description: "マイナス時間を記録",
  rarity: "SSR",
  rewardSrc: "/rewards/imaginary-time.png",
  condition: (c) => c.lastTaskMinutes < 0,
},
];

const rewardItems = achievements.map((achievement) => ({
  id: achievement.id,
  title: achievement.title,
  src: achievement.rewardSrc,
}));

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return crypto.randomUUID();
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeAchievementUnlocks(value: unknown): AchievementUnlocks {
  const now = new Date().toISOString();

  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.filter((id): id is string => typeof id === "string").map((id) => [id, now])
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([id, unlockedAt]) => typeof id === "string" && typeof unlockedAt === "string")
      .map(([id, unlockedAt]) => [id, unlockedAt as string]);

    return Object.fromEntries(entries);
  }

  return {};
}

function loadAchievementUnlocks(): AchievementUnlocks {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(ACHIEVEMENT_KEY);
  if (!raw) return {};

  try {
    return normalizeAchievementUnlocks(JSON.parse(raw));
  } catch {
    return {};
  }
}

function formatDateTime(value?: string) {
  if (!value) return "日時不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m}分`;
}

function rarityClass(rarity: Rarity) {
  return {
    N: "border-gray-300 bg-gray-50 text-gray-700",
    R: "border-blue-300 bg-blue-50 text-blue-700",
    SR: "border-purple-300 bg-purple-50 text-purple-700",
    SSR: "border-yellow-400 bg-yellow-50 text-yellow-700",
  }[rarity];
}

export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  const [assistant, setAssistant] = useState(assistantImages[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [unlockedRewardIds, setUnlockedRewardIds] = useState<string[]>([]);
  const [achievementUnlocks, setAchievementUnlocks] = useState<AchievementUnlocks>({});
  const [subjectStats, setSubjectStats] = useState<SubjectStats>({});
  const [history, setHistory] = useState<History>({});
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [galleryOpenCount, setGalleryOpenCount] = useState(0);
  const [notice, setNotice] = useState<Achievement | null>(null);
  const [noticeQueue, setNoticeQueue] = useState<Achievement[]>([]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [completedFlashId, setCompletedFlashId] = useState<string | null>(null);

  const newTaskRef = useRef<HTMLDivElement | null>(null);
  const newTaskSubjectInputRef = useRef<HTMLInputElement | null>(null);

  const [sampleConfirming, setSampleConfirming] = useState(false);
  const [resetConfirming, setResetConfirming] = useState(false);

  function clearConfirming() {
    setSampleConfirming(false);
    setResetConfirming(false);
  }

  useEffect(() => {
    setAssistant(
      assistantImages[Math.floor(Math.random() * assistantImages.length)]
    );

    setTasks(load<Task[]>(TASK_KEY, []));
    setExams(load<Exam[]>(EXAM_KEY, initialExams));
    setUnlockedRewardIds(load<string[]>(REWARD_KEY, []));
    setAchievementUnlocks(loadAchievementUnlocks());
    setSubjectStats(load<SubjectStats>(SUBJECT_KEY, {}));
    setHistory(load<History>(HISTORY_KEY, {}));

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    save(TASK_KEY, tasks);
  }, [hydrated, tasks]);

  useEffect(() => {
    if (!hydrated) return;
    save(EXAM_KEY, exams);
  }, [hydrated, exams]);

  useEffect(() => {
    if (!hydrated) return;
    save(REWARD_KEY, unlockedRewardIds);
  }, [hydrated, unlockedRewardIds]);

  useEffect(() => {
    if (!hydrated) return;
    save(ACHIEVEMENT_KEY, achievementUnlocks);
  }, [hydrated, achievementUnlocks]);

  useEffect(() => {
    if (!hydrated) return;
    save(SUBJECT_KEY, subjectStats);
  }, [hydrated, subjectStats]);

  useEffect(() => {
    if (!hydrated) return;
    save(HISTORY_KEY, history);
  }, [hydrated, history]);

  const doneTasks = tasks.filter((t) => t.done);
  const totalMinutes = doneTasks.reduce((sum, t) => sum + (t.minutes || 0), 0);

  const unlockedAchievementIds = Object.keys(achievementUnlocks);

  const context: AchievementContext = {
    totalMinutes,
    doneTaskCount: doneTasks.length,
    subjectCount: new Set(doneTasks.map((t) => t.subject || "未分類")).size,
    subjectStats,
    history,
    galleryOpenCount,
    lastTaskMinutes: doneTasks.length > 0 ? doneTasks[doneTasks.length - 1].minutes || 0 : 0,
  };

  useEffect(() => {
    if (!hydrated) return;

    const newly = achievements.filter(
      (a) => !achievementUnlocks[a.id] && a.condition(context)
    );

    if (newly.length === 0) return;

    const unlockedAt = new Date().toISOString();

    setAchievementUnlocks((prev) => {
      const next = { ...prev };
      newly.forEach((a) => {
        if (!next[a.id]) next[a.id] = unlockedAt;
      });
      return next;
    });

    setUnlockedRewardIds((prev) => [
      ...prev,
      ...newly.map((a) => a.id).filter((id) => !prev.includes(id)),
    ]);

    setNoticeQueue((prev) => [...prev, ...newly]);

    setNotice((prev) => {
      if (prev) return prev;
      return newly[0];
    });
  }, [hydrated, tasks, subjectStats, history, achievementUnlocks]);

  function closeNotice() {
    setNoticeQueue((prev) => {
      const next = prev.slice(1);
      setNotice(next[0] ?? null);
      return next;
    });
  }

  useEffect(() => {
    if (!hydrated || !newTaskId) return;

    newTaskRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      newTaskSubjectInputRef.current?.focus();
    }, 250);
  }, [hydrated, newTaskId, tasks.length]);

  function addTask() {
    clearConfirming();

    const id = uid();

    setTasks((prev) => [
      ...prev,
      {
        id,
        subject: "",
        title: "",
        minutes: 0,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    setNewTaskId(id);
  }

  function applyStudyDiff(subject: string, day: string, diff: number) {
    if (diff === 0) return;

    const subjectKey = subject || "未分類";

    setSubjectStats((prev) => {
      const next = { ...prev };
      const old = next[subjectKey] ?? { totalMinutes: 0 };
      const newTotalMinutes = Math.max(0, old.totalMinutes + diff);

      if (newTotalMinutes <= 0) {
        delete next[subjectKey];
      } else {
        next[subjectKey] = { totalMinutes: newTotalMinutes };
      }

      return next;
    });

    setHistory((prev) => {
      const nextValue = Math.max(0, (prev[day] ?? 0) + diff);
      const next = { ...prev };

      if (nextValue <= 0) {
        delete next[day];
      } else {
        next[day] = nextValue;
      }

      return next;
    });
  }

  function updateTask(id: string, patch: Partial<Task>) {
    clearConfirming();

    const before = tasks.find((t) => t.id === id);
    if (!before) return;

    const after = { ...before, ...patch };

    setTasks((prev) => prev.map((t) => (t.id === id ? after : t)));

    const beforeSubject = before.subject || "未分類";
    const afterSubject = after.subject || "未分類";

    const beforeMinutes = before.done ? before.minutes || 0 : 0;
    const afterMinutes = after.done ? after.minutes || 0 : 0;

    const beforeDay = before.createdAt.slice(0, 10);
    const afterDay = after.createdAt.slice(0, 10);

    if (beforeSubject === afterSubject && beforeDay === afterDay) {
      applyStudyDiff(afterSubject, afterDay, afterMinutes - beforeMinutes);
      return;
    }

    applyStudyDiff(beforeSubject, beforeDay, -beforeMinutes);
    applyStudyDiff(afterSubject, afterDay, afterMinutes);
  }

  function deleteTask(id: string) {
    clearConfirming();

    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    if (target.done) {
      const subject = target.subject || "未分類";
      const day = target.createdAt.slice(0, 10);
      const minutes = target.minutes || 0;
      applyStudyDiff(subject, day, -minutes);
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function addExam() {
    clearConfirming();

    setExams((prev) => [
      ...prev,
      {
        id: uid(),
        name: "",
        date: todayKey(),
      },
    ]);
  }

  function resetData() {
    if (!resetConfirming) {
      setResetConfirming(true);
      setSampleConfirming(false);
      return;
    }

    clearConfirming();

    localStorage.removeItem(TASK_KEY);
    localStorage.removeItem(EXAM_KEY);
    localStorage.removeItem(REWARD_KEY);
    localStorage.removeItem(ACHIEVEMENT_KEY);
    localStorage.removeItem(SUBJECT_KEY);
    localStorage.removeItem(HISTORY_KEY);

    setTasks([]);
    setExams(initialExams);
    setUnlockedRewardIds([]);
    setAchievementUnlocks({});
    setSubjectStats({});
    setHistory({});
    setNotice(null);
    setNoticeQueue([]);
    setSelectedRewardId(null);
  }

  function exportData() {
    const data = {
      tasks,
      exams,
      unlockedRewardIds,
      achievementUnlocks,
      subjectStats,
      history,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `study-data-backup-${todayKey()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function importData(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const raw = String(reader.result ?? "");
        if (!raw.trim()) {
          alert("ファイルが空です");
          return;
        }

        const data = JSON.parse(raw);

        const nextTasks = Array.isArray(data.tasks) ? data.tasks : [];
        const nextExams = Array.isArray(data.exams) ? data.exams : initialExams;
        const nextUnlockedRewardIds = Array.isArray(data.unlockedRewardIds)
          ? data.unlockedRewardIds
          : [];
        const nextAchievementUnlocks = normalizeAchievementUnlocks(data.achievementUnlocks ?? data.unlockedAchievementIds);
        const nextSubjectStats = rebuildSubjectStats(nextTasks);
        const nextHistory = rebuildHistory(nextTasks);

        setTasks(nextTasks);
        setExams(nextExams);
        setUnlockedRewardIds(nextUnlockedRewardIds);
        setAchievementUnlocks(nextAchievementUnlocks);
        setSubjectStats(nextSubjectStats);
        setHistory(nextHistory);

        save(TASK_KEY, nextTasks);
        save(EXAM_KEY, nextExams);
        save(REWARD_KEY, nextUnlockedRewardIds);
        save(ACHIEVEMENT_KEY, nextAchievementUnlocks);
        save(SUBJECT_KEY, nextSubjectStats);
        save(HISTORY_KEY, nextHistory);

        setNotice(null);
        setNoticeQueue([]);
        setSelectedRewardId(null);

        alert("データを読み込みました");
      } catch (error) {
        console.error(error);
        alert("バックアップファイルの読み込みに失敗しました");
      }
    };

    reader.onerror = () => {
      alert("ファイルを読み込めませんでした");
    };

    reader.readAsText(file);
  }

  function rebuildSubjectStats(sourceTasks: Task[]): SubjectStats {
    const next: SubjectStats = {};

    sourceTasks.forEach((task) => {
      if (!task.done) return;

      const subject = task.subject || "未分類";
      const minutes = task.minutes || 0;
      if (minutes <= 0) return;

      next[subject] = {
        totalMinutes: (next[subject]?.totalMinutes ?? 0) + minutes,
      };
    });

    return next;
  }

  function rebuildHistory(sourceTasks: Task[]): History {
    const next: History = {};

    sourceTasks.forEach((task) => {
      if (!task.done) return;

      const day = task.createdAt.slice(0, 10);
      const minutes = task.minutes || 0;
      if (minutes <= 0) return;

      next[day] = (next[day] ?? 0) + minutes;
    });

    return next;
  }

  function sampleData() {
    if (!sampleConfirming) {
      setSampleConfirming(true);
      setResetConfirming(false);
      return;
    }

    clearConfirming();

    const now = new Date().toISOString();

    const sampleTasks: Task[] = [
      {
        id: uid(),
        subject: "数学",
        title: "数検1級 過去問",
        minutes: 12000,
        done: true,
        createdAt: now,
      },
      {
        id: uid(),
        subject: "英語",
        title: "東大英語 長文",
        minutes: 800,
        done: true,
        createdAt: now,
      },
      {
        id: uid(),
        subject: "化学",
        title: "有機化学 復習",
        minutes: 800,
        done: true,
        createdAt: now,
      },
      {
        id: uid(),
        subject: "世界史",
        title: "通史復習",
        minutes: 500,
        done: true,
        createdAt: now,
      },
      {
        id: uid(),
        subject: "色彩",
        title: "UC級 復習",
        minutes: 500,
        done: true,
        createdAt: now,
      },
      {
        id: uid(),
        subject: "危険物",
        title: "乙種 暗記",
        minutes: 500,
        done: true,
        createdAt: now,
      },
    ];

    const sampleSubjectStats = rebuildSubjectStats(sampleTasks);
    const sampleHistory = rebuildHistory(sampleTasks);

    setTasks(sampleTasks);
    setExams([
      {
        id: uid(),
        name: "数検1級一次",
        date: "2026-10-25",
      },
      {
        id: uid(),
        name: "TOEIC",
        date: "2026-12-07",
      },
    ]);
    setSubjectStats(sampleSubjectStats);
    setHistory(sampleHistory);
    const nowUnlockedAt = new Date().toISOString();
    setAchievementUnlocks(
      Object.fromEntries(achievements.map((a) => [a.id, nowUnlockedAt]))
    );
    setUnlockedRewardIds(achievements.map((a) => a.id));
    setNotice(null);
    setNoticeQueue([]);
  }

  function reorder(targetId: string) {
    clearConfirming();

    if (!draggingId || draggingId === targetId) return;

    setTasks((prev) => {
      const copy = [...prev];
      const from = copy.findIndex((t) => t.id === draggingId);
      const to = copy.findIndex((t) => t.id === targetId);

      if (from === -1 || to === -1) return prev;

      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);

      return copy;
    });

    setDraggingId(null);
  }

  function flashCompletedTask(id: string) {
    setCompletedFlashId(id);
    window.setTimeout(() => {
      setCompletedFlashId((current) => (current === id ? null : current));
    }, 900);
  }

  function focusTaskField(taskId: string, field: string) {
    const selector = `[data-task-id="${taskId}"][data-field="${field}"]`;
    const target = document.querySelector<HTMLElement>(selector);
    target?.focus();
  }

  function handleTaskInputKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    taskId: string,
    field: "subject" | "title" | "minutes"
  ) {
    if (e.key !== "Enter") return;

    e.preventDefault();

    if (field === "subject") {
      focusTaskField(taskId, "title");
      return;
    }

    if (field === "title") {
      focusTaskField(taskId, "minutes");
      return;
    }

    focusTaskField(taskId, "done");
  }

  const subjectSuggestions = Array.from(
    new Set(
      [
        ...Object.keys(subjectStats),
        ...tasks.map((task) => task.subject.trim()).filter(Boolean),
      ].sort((a, b) => a.localeCompare(b, "ja"))
    )
  );

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done === b.done) return 0;
    return a.done ? 1 : -1;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="overflow-hidden rounded-3xl bg-white shadow">
            <img
              src={assistant}
              alt="学習アシスタント"
              className="h-[430px] w-full object-cover"
            />
            <div className="p-4">
              <h1 className="text-xl font-bold">学習アシスタント</h1>
              <p className="text-sm text-slate-500">
                あなたの学習アシスタントです。勉強をサポートします。
              </p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-4 shadow">
            <h2 className="font-bold">学習ステータス</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p>総勉強時間：{formatMinutes(totalMinutes)}</p>
              <p>完了タスク：{doneTasks.length}</p>
              <p>学習科目：{context.subjectCount}</p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-4 shadow">
            <h2 className="font-bold">追加ボタン</h2>

            {sampleConfirming && (
              <div className="mt-3 rounded-2xl border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
                サンプルデータを投入すると、現在のデータがテスト用データに置き換わります。
                実行する場合だけ、もう一度ボタンを押してください。
              </div>
            )}

            {resetConfirming && (
              <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                データ初期化を実行すると、タスク・試験・実績・ご褒美・学習履歴がすべて消えます。
                実行する場合だけ、もう一度ボタンを押してください。
              </div>
            )}

            <div className="mt-3 grid gap-2">
              <button
                onClick={addTask}
                className="rounded-xl bg-slate-900 p-2 text-white"
              >
                タスク追加
              </button>

              <button
                onClick={sampleData}
                className={`rounded-xl p-2 text-white ${
                  sampleConfirming ? "bg-orange-600" : "bg-blue-600"
                }`}
              >
                {sampleConfirming ? "もう一度押すと投入" : "サンプルデータ投入"}
              </button>

              <button
                onClick={exportData}
                className="rounded-xl bg-emerald-600 p-2 text-white"
              >
                データを書き出す
              </button>

              <label className="cursor-pointer rounded-xl bg-purple-600 p-2 text-center text-white">
                データを読み込む
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    importData(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>

              <button
                onClick={resetData}
                className={`rounded-xl p-2 text-white ${
                  resetConfirming ? "bg-red-700" : "bg-red-500"
                }`}
              >
                {resetConfirming ? "もう一度押すと初期化" : "データ初期化"}
              </button>
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-5 shadow">
            <h2 className="text-xl font-bold">タスク</h2>

            <datalist id="subject-suggestions">
              {subjectSuggestions.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>

            <div className="mt-4 space-y-3">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  ref={task.id === newTaskId ? newTaskRef : null}
                  draggable
                  onDragStart={() => setDraggingId(task.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => reorder(task.id)}
                 className={`grid gap-2 rounded-2xl border p-3 transition-all duration-300 md:grid-cols-[1fr_2fr_100px_96px_60px] ${
                  task.done
                  ? "border-emerald-400 bg-emerald-50 shadow-lg ring-2 ring-emerald-200"
                  : "bg-white"
                 } ${task.id === completedFlashId ? "animate-flash" : ""}`}
                >
                  <input
                    ref={task.id === newTaskId ? newTaskSubjectInputRef : null}
                    data-task-id={task.id}
                    data-field="subject"
                    list="subject-suggestions"
                    value={task.subject}
                    onChange={(e) =>
                      updateTask(task.id, { subject: e.target.value })
                    }
                    onKeyDown={(e) =>
                      handleTaskInputKeyDown(e, task.id, "subject")
                    }
                    placeholder="科目"
                    className="rounded-xl border p-2"
                  />

                  <input
                    data-task-id={task.id}
                    data-field="title"
                    value={task.title}
                    onChange={(e) =>
                      updateTask(task.id, { title: e.target.value })
                    }
                    onKeyDown={(e) =>
                      handleTaskInputKeyDown(e, task.id, "title")
                    }
                    placeholder="タスク名"
                    className="rounded-xl border p-2"
                  />

                  <input
                    data-task-id={task.id}
                    data-field="minutes"
                    type="number"
                    value={task.minutes || ""}
                   onChange={(e) =>
                    updateTask(task.id, {
                     minutes: Math.max(-1, Number(e.target.value)),
                    })
                    }
                    onKeyDown={(e) =>
                      handleTaskInputKeyDown(e, task.id, "minutes")
                    }
                    placeholder="分"
                    className="rounded-xl border p-2"
                  />

                  <label
  data-task-id={task.id}
  data-field="done"
  className={`flex min-h-[42px] cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm font-bold transition ${
    task.done
      ? "border-emerald-400 bg-emerald-100 text-emerald-700"
      : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
  }`}
>
  <input
    type="checkbox"
    checked={task.done}
    onChange={(e) => {
      updateTask(task.id, { done: e.target.checked });
      if (e.target.checked) flashCompletedTask(task.id);
    }}
    className="sr-only"
  />
  {task.done ? "記録済み" : "記録"}
</label>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="rounded-xl bg-slate-100 text-sm"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow">
            <h2 className="text-xl font-bold">科目別学習時間</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(Object.entries(subjectStats) as [string, SubjectStat][]).map(([subject, stat]) => (
                <div key={subject} className="rounded-2xl border p-3">
                  <b>{subject}</b>
                  <p className="mt-1 text-sm text-slate-500">
                    累計 {formatMinutes(stat.totalMinutes)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">試験</h2>
              <button
                onClick={addExam}
                className="rounded-xl bg-slate-900 px-3 py-2 text-white"
              >
                試験追加
              </button>
            </div>

            <div className="space-y-3">
              {exams.map((exam) => {
                const days = Math.ceil(
                  (new Date(exam.date).getTime() - Date.now()) /
                    1000 /
                    60 /
                    60 /
                    24
                );

                return (
                  <div
                    key={exam.id}
                    className="grid gap-2 rounded-2xl border p-3 md:grid-cols-[1fr_160px_100px_60px]"
                  >
                    <input
                      value={exam.name}
                      onChange={(e) => {
                        clearConfirming();
                        setExams((prev) =>
                          prev.map((x) =>
                            x.id === exam.id
                              ? { ...x, name: e.target.value }
                              : x
                          )
                        );
                      }}
                      placeholder="試験名"
                      className="rounded-xl border p-2"
                    />

                    <input
                      type="date"
                      value={exam.date}
                      onChange={(e) => {
                        clearConfirming();
                        setExams((prev) =>
                          prev.map((x) =>
                            x.id === exam.id
                              ? { ...x, date: e.target.value }
                              : x
                          )
                        );
                      }}
                      className="rounded-xl border p-2"
                    />

                    <span
                      className={`rounded-xl p-2 text-center text-sm ${
                        days <= 7
                          ? "bg-red-100 text-red-700"
                          : days <= 30
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100"
                      }`}
                    >
                      あと{days}日
                    </span>

                    <button
                      onClick={() => {
                        clearConfirming();
                        setExams((prev) => prev.filter((x) => x.id !== exam.id));
                      }}
                      className="rounded-xl bg-slate-100 text-sm"
                    >
                      削除
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow">
            <h2 className="text-xl font-bold">実績</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {achievements.map((a) => {
                const unlocked = Boolean(achievementUnlocks[a.id]);

                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl border p-4 ${rarityClass(a.rarity)} ${
                      unlocked ? "" : "opacity-50"
                    }`}
                  >
                    <b>{a.secret && !unlocked ? "？？？" : a.title}</b>
                    <span>{a.secret && !unlocked ? "secret" : a.rarity}</span>

                    <p className="text-sm">
                      {a.secret && !unlocked ? "条件不明" : a.description}
                    </p>
                    <p className="mt-2 text-xs">
                      {unlocked
                        ? `${formatDateTime(achievementUnlocks[a.id])}に獲得`
                        : "未解除"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow">
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl font-bold">ご褒美ギャラリー</h2>
              <p className="text-sm text-slate-500">
                {unlockedRewardIds.length}/{rewardItems.length}　
                {Math.round(
                  (unlockedRewardIds.length / rewardItems.length) * 100
                )}
                %
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-6 lg:grid-cols-10">
              {rewardItems.map((reward) => {
                const unlocked = unlockedRewardIds.includes(reward.id);

                return (
                  <button
                    key={reward.id}
                    onClick={() => {
                      clearConfirming();
                      if (unlocked) {
                        setGalleryOpenCount((count) => count + 1);
                        setSelectedRewardId(reward.id);
                      }
                  }}
                    className="aspect-square overflow-hidden rounded-2xl border bg-slate-100"
                    title={reward.title}
                  >
                    {unlocked ? (
                      <img
                        src={reward.src}
                        alt={reward.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl text-slate-400">
                        ?
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow">
            <h2 className="text-xl font-bold">学習カレンダー</h2>
            <div className="mt-4 grid grid-cols-14 gap-1">
              {Array.from({ length: 70 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 69 + i);
                const key = date.toISOString().slice(0, 10);
                const min = history[key] ?? 0;

                const color =
                  min === 0
                    ? "bg-slate-100"
                    : min < 30
                    ? "bg-green-100"
                    : min < 60
                    ? "bg-green-300"
                    : min < 120
                    ? "bg-green-500"
                    : "bg-green-700";

                return (
                  <div
                    key={key}
                    title={`${key} ${min}分`}
                    className={`aspect-square rounded ${color}`}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {selectedRewardId && (() => {
        const achievement = achievements.find((a) => a.id === selectedRewardId);
        if (!achievement) return null;

        return (
          <div
            onClick={() => setSelectedRewardId(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <img
                src={achievement.rewardSrc}
                alt={achievement.title}
                className="max-h-[60vh] w-full object-contain bg-slate-100"
              />

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-900">
                    {achievement.title}
                  </h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${rarityClass(
                      achievement.rarity
                    )}`}
                  >
                    {achievement.rarity}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-bold text-slate-900">解除条件</p>
                  <p className="mt-1">{achievement.description}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-bold text-slate-900">獲得日時</p>
                  <p className="mt-1">
                    {formatDateTime(achievementUnlocks[achievement.id])}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedRewardId(null)}
                  className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white text-center shadow-2xl">
            <div className="bg-gradient-to-br from-yellow-100 via-white to-purple-100 p-6">
              <p className="text-xs font-black tracking-[0.25em] text-yellow-600">
                ACHIEVEMENT UNLOCKED
              </p>

              <div className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                {notice.rarity} 実績解除
              </div>

              <h2 className="mt-4 text-2xl font-black text-slate-900">
                {notice.title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {notice.description}
              </p>

              <div className="mx-auto mt-5 h-56 w-56 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl">
                <img
                  src={notice.rewardSrc}
                  alt={notice.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-purple-700">
                新しいご褒美画像が解放されました！
              </p>

              <button
                onClick={closeNotice}
                className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white"
              >
                {noticeQueue.length > 1 ? "次の実績へ" : "受け取る"}
              </button>

              {noticeQueue.length > 1 && (
                <p className="mt-2 text-xs text-slate-500">
                  残り {noticeQueue.length - 1} 件
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
