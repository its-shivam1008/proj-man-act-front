import axios from "axios";
import { BASE_URL } from "./constants";

const api = axios.create({
  baseURL: BASE_URL,
});

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
