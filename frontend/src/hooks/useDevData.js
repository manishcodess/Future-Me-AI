import { useState, useEffect } from 'react';
import { ai } from '../services/aiService';

export function useDevData(showToast) {
  const [githubData, setGithubData] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [gfgData, setGfgData] = useState({ total: 110, score: 290 });
  const [dailyBrief, setDailyBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const CACHE_KEY = 'devpulse-github-cache-v2';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 15 * 60 * 1000) { // 15 mins cache
            setGithubData(data);
            return data;
          }
        }

        const username = "manishcodess";
        const profileRes = await fetch(`https://api.github.com/users/${username}`);
        if(!profileRes.ok) throw new Error('Github rate limit or error');
        const profile = await profileRes.json();
        
        const eventsRes = await fetch(`https://api.github.com/users/${username}/events`);
        const events = await eventsRes.json();
        
        if (events.message && events.message.includes("API rate limit")) {
          showToast("GitHub API rate limit exceeded! Showing cached/partial data.", "error");
          console.warn("GitHub rate limit hit:", events.message);
        }
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentCommits = (events.length ? events : [])
          .filter(e => e.type === "PushEvent" && new Date(e.created_at) > sevenDaysAgo)
          .reduce((total, e) => total + (e.payload?.commits?.length || 0), 0);
          
        const todayLocal = new Date().toLocaleDateString();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayLocal = yesterdayDate.toLocaleDateString();

        const todayCommits = (events.length ? events : [])
          .filter(e => e.type === "PushEvent" && new Date(e.created_at).toLocaleDateString() === todayLocal)
          .reduce((total, e) => total + (e.payload?.commits?.length || 0), 0);

        const yesterdayCommits = (events.length ? events : [])
          .filter(e => e.type === "PushEvent" && new Date(e.created_at).toLocaleDateString() === yesterdayLocal)
          .reduce((total, e) => total + (e.payload?.commits?.length || 0), 0);

          
        let totalCommits = '--', streak = '--', languages = [];
        try {
          const statsRes = await fetch(`/api/github/${username}/stats`);
          if (statsRes.ok) {
            const stats = await statsRes.json();
            totalCommits = stats.totalCommits;
            streak = stats.streak;
            languages = stats.languages;
          }
        } catch {
          console.warn("Please run 'node server.js' for extra GitHub stats");
        }
        
        const freshData = {
          username: profile.login,
          publicRepos: profile.public_repos,
          followers: profile.followers,
          weeklyCommits: recentCommits,
          todayCommits,
          yesterdayCommits,
          totalCommits: totalCommits,
          streak: streak,
          languages: languages,
          avatarUrl: profile.avatar_url
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: freshData, timestamp: Date.now() }));
        setGithubData(freshData);
        showToast("GitHub data loaded ✓");
        return freshData;
      } catch {
        setErrors(prev => ({...prev, github: true}));
        return null;
      }
    };

    const fetchLeetcodeData = async () => {
      try {
        const CACHE_KEY = 'devpulse-leetcode-cache';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 15 * 60 * 1000) { // 15 mins cache
            setLeetcodeData(data);
            return data;
          }
        }

        const username = "manishsharmacodes";
        const solvedRes = await fetch(`/api/leetcode/${username}`, { method: 'POST' });
        if (!solvedRes.ok) throw new Error("Leetcode API error");
        const solvedData = await solvedRes.json();
        
        if (solvedData.error) throw new Error("Leetcode user not found");

        const freshData = {
          total: solvedData.total || 0,
          easy: solvedData.easy || 0,
          medium: solvedData.medium || 0,
          hard: solvedData.hard || 0,
          streak: 0
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: freshData, timestamp: Date.now() }));
        setLeetcodeData(freshData);
        showToast("LeetCode data loaded ✓");
        return freshData;
      } catch {
        setErrors(prev => ({...prev, leetcode: true}));
        return null;
      }
    };

    const generateDailyBrief = async (ghData, lcData) => {
      try {
        const prompt = \`You are a good, helping AI developer coach for Manish. Based on his recent activity:
   - GitHub Commits Today: \${ghData?.todayCommits || 0}
   - GitHub Commits Yesterday: \${ghData?.yesterdayCommits || 0}
   - Total DSA Questions: \${lcData?.total ?? 'unknown'} on leetcode+110 on gfg
   when tell total dsa q tell sum of leetcode+gfg both
   Give a brief status report about his consistency. DO NOT suggest what he should do today or give him advice.
   ONLY tell him if he is "consistent", "improving", or "inconsistent" based on today and yesterday's stats. Mention the exact commit/DSA numbers for those two days.
   If he didn't do any GitHub commits or DSA questions in BOTH days,() i know u are tired but its imp time like this). 
    Max 40 words. No emojis.\`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
        });
        setDailyBrief(response.text);
        showToast("Daily brief generated ✓");
      } catch {
        setDailyBrief("Ready to level up your skills today? Let's focus on the big picture.");
      } finally {
        setBriefLoading(false);
      }
    };
    
    const initializeApp = async () => {
      const [ghData, lcData] = await Promise.all([
        fetchGithubData(),
        fetchLeetcodeData()
      ]);
      generateDailyBrief(ghData, lcData);
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { githubData, leetcodeData, gfgData, dailyBrief, briefLoading, errors };
}
