export {}; // Forces TS to treat this file as a module

interface GlobalRecord {
    rank: number;
    username: string;
    time: number;
    date: string;
}

async function loadGlobalLeaderboard(gameSlug: string, difficulty: number, containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "<p>Loading leaderboard...</p>";

    try {
        const response = await fetch(`/leaderboards/api/global/${gameSlug}/${difficulty}/`);
        if (!response.ok) throw new Error("Failed to fetch");

        const data: { leaderboard: GlobalRecord[] } = await response.json();

        if (data.leaderboard.length === 0) {
            container.innerHTML = "<p>No records yet. Be the first to win!</p>";
            return;
        }

        let html = `
            <table class="leaderboard-table">
                <thead>
                    <tr><th>Rank</th><th>Player</th><th>Time (s)</th><th>Date</th></tr>
                </thead>
                <tbody>
        `;

        data.leaderboard.forEach(record => {
            html += `
                <tr>
                    <td>#${record.rank}</td>
                    <td><strong>${record.username}</strong></td>
                    <td>${record.time.toFixed(2)}s</td>
                    <td>${record.date}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = "<p>Error loading leaderboard.</p>";
    }
}

// Expose the function globally to the browser window
declare global {
    interface Window {
        loadGlobalLeaderboard: typeof loadGlobalLeaderboard;
    }
}
window.loadGlobalLeaderboard = loadGlobalLeaderboard;