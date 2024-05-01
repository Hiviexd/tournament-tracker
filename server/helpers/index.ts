import { IOsuAuthResponse } from '../../interfaces/OsuApi';

function setSession(session, response: IOsuAuthResponse) {
    const maxAge = new Date();
    maxAge.setDate(maxAge.getDate() + 7);
    session.cookie.maxAge = maxAge.getTime();
    // *1000 because maxAge is miliseconds, oauth is seconds
    session.expireDate = Date.now() + (response.expires_in * 1000);
    session.accessToken = response.access_token;
    session.refreshToken = response.refresh_token;
}

/** Just replaces () and [] */
export function escapeUsername(username: string) {
    username = username.trim();

    return username.replace(/[()[\]]/g, '\\$&');
}

const defaultErrorMessage = { error: 'Something went wrong!' };

export default {
    setSession,
    escapeUsername,
    defaultErrorMessage,
}
