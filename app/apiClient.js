import axios from "axios";

const apiClient = axios.create();

apiClient.interceptors.request.use(config => {
    config.withCredentials = true;
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    error => {
        if (error.response) {
            throw {
                status: error.response.status,
                message: error.response.data?.message || error.response.statusText || 'Error del servidor',
                data: error.response.data,
            };
        } else if (error.request) {
            console.error('No Response error:', error.request);
            throw {message: 'No response from server'};
        } else {
            console.error('Request Setup error:', error.message);
            throw {message: error.message || 'Unknown error'};
        }
    }
);

export default apiClient;