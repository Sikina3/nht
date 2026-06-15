import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://nht.blocsland.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
    }

    return Promise.reject(error);
  },
);

interface LoginResponse {
  token: string;
  user: any;
}

interface RegisterPayload {
  nom: string;
  prenom: string;
  num_tel: string;
  mot_de_passe: string;
  [key: string]: any;
}

export const authService = {
  login: (phoneNumber: string, mot_de_passe: string) =>
    api.post<LoginResponse>("/users/login", {
      num_tel: phoneNumber,
      mot_de_passe,
    }),

  register: (userData: RegisterPayload) =>
    api.post("/users/register", userData),

  getUserByPhone: (phoneNumber: string) =>
    api.get(`/users/phone/${phoneNumber}`),
};

export default api;
