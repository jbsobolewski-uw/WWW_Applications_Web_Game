/**
 * Handles the boilerplate of fetching API data, finding the container,
 * and displaying loading/error states safely.
 */
async function fetchLeaderboardData<T>(
    url: string,
    containerId: string,
    loadingMessage: string,
    errorMessage: string
): Promise<{ data: T | null; container: HTMLElement | null }> {
    const container = document.getElementById(containerId);
    if (!container) return {data: null, container: null};

    container.innerHTML = `<p>${loadingMessage}</p>`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API request failed");

        const data: T = await response.json();
        return {data, container};
    } catch (error) {
        container.innerHTML = `<p>${errorMessage}</p>`;
        return {data: null, container};
    }
}

/**
 * Wraps dynamic table rows in standard leaderboard table HTML.
 */
function buildLeaderboardTable(headersHtml: string, rowsHtml: string): string {
    return `
        <table class="leaderboard-table">
            <thead>
                <tr>${headersHtml}</tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;
}

export {fetchLeaderboardData, buildLeaderboardTable}