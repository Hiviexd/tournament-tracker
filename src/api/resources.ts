import axios from "axios";
import { ResourceQueryParams, IResource } from "../../interfaces/Resource";

export const getResources = async (params?: ResourceQueryParams) => {
    const response = await axios.get("/api/resources", { params });
    return response.data;
};

export const createResource = async (resourceData: Partial<IResource>) => {
    const response = await axios.post("/api/resources/create", resourceData);
    return response.data;
};

export const updateResource = async (resourceId: string, resourceData: Partial<IResource>) => {
    const response = await axios.post(`/api/resources/${resourceId}/edit`, resourceData);
    return response.data;
};
