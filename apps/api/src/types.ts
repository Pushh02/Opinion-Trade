type login = {
    type: "login",
    payload: {
        email: string,
        password: string
    }
};

export type requestPayload = login
