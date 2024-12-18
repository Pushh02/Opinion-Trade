type signup = {
    type: "signup",
    payload: {
        username: string,
        email: string,
        password: string,
        role: string
    }
};

type login = {
    type: "login",
    payload: {
        username: string,
        password: string
    }
}

export type requestPayload = signup | login
