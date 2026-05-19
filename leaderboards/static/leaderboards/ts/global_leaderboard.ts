import {buildLeaderboardTable, fetchLeaderboardData} from './leaderboards_utils.js';

interface GlobalRecord {
    rank: number;
    username: string;
    time: number;
    date: string;
}

async function loadGlobalLeaderboard(gameSlug: string, difficulty: number, containerId: string): Promise<void> {
    const {data, container} = await fetchLeaderboardData<{ leaderboard: GlobalRecord[] }>(
        `/leaderboards/api/global/${gameSlug}/${difficulty}/`,
        containerId,
        "Loading leaderboard...",
        "Error loading leaderboard."
    );

    if (!data || !container) return;

    if (data.leaderboard.length === 0) {
        container.innerHTML = "<p>No records yet. Be the first to win!</p>";
        return;
    }

    const headers = "<th>Rank</th><th>Player</th><th>Time (s)</th><th>Date</th>";
    let rows = "";

    data.leaderboard.forEach((record: { rank: any; username: any; time: number; date: any; }) => {
        rows += `
            <tr>
                <td>#${record.rank}</td>
                <td><strong>${record.username}</strong></td>
                <td>${record.time.toFixed(2)}s</td>
                <td>${record.date}</td>
            </tr>
        `;
    });

    container.innerHTML = buildLeaderboardTable(headers, rows);
}

// Attach to window so inline HTML scripts can still call it
declare global {
    interface Window {
        loadGlobalLeaderboard: typeof loadGlobalLeaderboard;
    }
}

window.loadGlobalLeaderboard = loadGlobalLeaderboard;