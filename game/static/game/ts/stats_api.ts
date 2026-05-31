// stats_api.ts — thin client for the game record API

export interface RecordPayload {
    difficulty: number;
    time_seconds: number;
    is_win: boolean;
}

export interface RecordResponse {
    id: number;
    username: string;
    difficulty: number;
    time_seconds: number;
    is_win: boolean;
    played_at: string;
}

/**
 * Read the CSRF token Django injects into cookies.
 * Requires SESSION_COOKIE_SAMESITE != 'Strict', which is Django's default.
 */
function getCsrfToken(): string {
    const match = document.cookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('csrftoken='));
    return match ? match.split('=')[1] ?? '' : '';
}

/**
 * Submit a finished game record to the server.
 * Silently swallows network/auth errors so a failed save never
 * disrupts the in-browser game state.
 */
export async function submitRecord(payload: RecordPayload): Promise<RecordResponse | null> {
    try {
        const response = await fetch('/game/api/add_record/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 401 || response.status === 302) {
            // User is not logged in — do nothing, unauthenticated play is fine
            return null;
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({})) as Record<string, unknown>;
            console.warn('[HexSweeper] Record not saved:', err['error'] ?? response.statusText);
            return null;
        }

        return (await response.json()) as RecordResponse;
    } catch (e) {
        console.warn('[HexSweeper] Record submission failed (network error):', e);
        return null;
    }
}