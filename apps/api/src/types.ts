type login = {
    type: "login" | "signup",
    payload: {
        username: string,
        email: string,
        password: string,
        role: string
    }
};

export type requestPayload = login
