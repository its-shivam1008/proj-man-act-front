import axios from "axios";
import { BASE_URL } from "./constants";

const api = axios.create({
  baseURL: BASE_URL,
});

// Add request interceptor to ensure token is always included
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const setBearerTokenForEveryAxiosCall = (token: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

export const removeBearerTokenForEveryAxiosCall = () => {
  delete api.defaults.headers.common["Authorization"];
};

export default api;
// test commit 
// import axios from "axios";
// import { BASE_URL } from "./constants";

// const api = axios.create({
//   baseURL: BASE_URL,
// });

// const token = localStorage.getItem("token");
// if (token) {
//   api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
// }

// export const setBearerTokenForEveryAxiosCall = (token: string) => {
//   if (token) {
//     api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//   }
// };

// export const removeBearerTokenForEveryAxiosCall = () => {
//   delete api.defaults.headers.common["Authorization"];
// };

// export default api;
