export {}; // Forces TS to treat this file as a module

interface PersonalRecord {
    difficulty: number;
    best_time: number;
}

async function loadPersonalRecords(gameSlug: string, containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "<p>Loading your records...</p>";

    try {
        const response = await fetch(`/leaderboards/api/personal/${gameSlug}/`);
        if (!response.ok) throw new Error("Unauthorized or network error");

        const data: { personal_bests: PersonalRecord[] } = await response.json();

        if (data.personal_bests.length === 0) {
            container.innerHTML = "<p>You haven't won any games yet!</p>";
            return;
        }

        let html = `
            <table class="leaderboard-table">
                <thead>
                    <tr><th>Difficulty (Radius)</th><th>Your Best Time</th></tr>
                </thead>
                <tbody>
        `;

        data.personal_bests.forEach(record => {
            html += `
                <tr>
                    <td>Level ${record.difficulty}</td>
                    <td>${record.best_time.toFixed(2)}s</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = "<p>Please log in to see your personal records.</p>";
    }
}

// Expose the function globally to the browser window
declare global {
    interface Window {
        loadPersonalRecords: typeof loadPersonalRecords;
    }
}
window.loadPersonalRecords = loadPersonalRecords;