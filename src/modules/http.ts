import axios from "axios";

async function executeRequest(requestType: "get" | "post", url: string, data: any, e: any) {
    if (e) e.target.disabled = true;
    // TODO possibly handle loading state here

    try {
        let response;

        if (requestType === "get") response = await axios.get("/api" + url);
        else response = await axios.post("/api" + url, data);

        if (response.data.error) {
            // TODO emit error notification
        }

        return response.data;
    } catch (error) {
        // TODO emit error notification
        return { error: `Something went wrong: ${error}` };
    } finally {
        if (e) e.target.disabled = false;
        // TODO possibly handle loading state here
    }
}

async function executeGet(url: string, e?: any) {
    return await executeRequest("get", url, null, e);
}

async function executePost(url: string, data: any, e?: any) {
    return await executeRequest("post", url, data, e);
}
function isValid(data: any) {
    return data && data.error === undefined;
}

export default {
    executeGet,
    executePost,
    isValid,
};
