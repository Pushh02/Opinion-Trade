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

type createMarker = {
    type: "createMarket",
    payload: {
        token: string;
        symbol: string,
        description: string,
        endTime: Date,
        sourceOfTruth: string,
        status: string,
    }
}

type empty = {
    type: "empty",
    payload: {}
}

export type requestPayload = signup | login | empty | createMarker
