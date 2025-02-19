import { notifications } from "@mantine/notifications";

export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    error?: string;
}

export const handleMutationResponse = <T>(response: ApiResponse<T>): T => {
    const successMessage = response.message || "Action successful!";
    if (response.error) {
        notifications.show({
            title: "Error",
            message: response.error,
            color: "red",
        });
        throw new Error(response.error);
    }

    notifications.show({
        title: "Success",
        message: successMessage,
        color: "green",
    });

    return response.data || response as unknown as T;
};
