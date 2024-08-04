/**
 * Check if a http request is valid (doesn't contain an error)
 */
function httpIsValid(response) {
    return response && response.error === undefined;
}

export default {
    httpIsValid,
};
