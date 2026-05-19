import {buildLeaderboardTable, fetchLeaderboardData} from './leaderboards_utils.js';

interface PersonalRecord {
    difficulty: number;
    best_time: number;
}

async function loadPersonalRecords(gameSlug: string, containerId: string): Promise<void> {
    const {data, container} = await fetchLeaderboardData<{ personal_bests: PersonalRecord[] }>(
        `/leaderboards/api/personal/${gameSlug}/`,
        containerId,
        "Loading your records...",
        "Please log in to see your personal records."
    );

    if (!data || !container) return;

    if (data.personal_bests.length === 0) {
        container.innerHTML = "<p>You haven't won any games yet!</p>";
        return;
    }

    const headers = "<th>Difficulty (Radius)</th><th>Your Best Time</th>";
    let rows = "";

    data.personal_bests.forEach((record: { difficulty: any; best_time: number; }) => {
        rows += `
            <tr>
                <td>Level ${record.difficulty}</td>
                <td>${record.best_time.toFixed(2)}s</td>
            </tr>
        `;
    });

    container.innerHTML = buildLeaderboardTable(headers, rows);
}

// Attach to window so inline HTML scripts can still call it
declare global {
    interface Window {
        loadPersonalRecords: typeof loadPersonalRecords;
    }
}

window.loadPersonalRecords = loadPersonalRecords;