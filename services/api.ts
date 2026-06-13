import axios from "axios";

const api = axios.create({
  baseURL: "https://nht.blocsland.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const authService = {
  login: async (phoneNumber: string, mot_de_passe: string) => {
    return api.post("/users/login", { num_tel: phoneNumber, mot_de_passe });
  },
  register: async (userData: any) => {
    return api.post("/users/register", userData);
  },
  getUserByPhone: async (phoneNumber: string) => {
    return api.get(`/users/phone/${phoneNumber}`);
  },
};

export default api;
