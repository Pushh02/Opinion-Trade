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

type order = {
    type: "sell" | "buy",
    payload: {
        token: string,
        symbol: string,
        quantity: number,
        price: number,
        stockType: string
    }
}

type getMarkets = {
    type: "get_all_markets",
}

type getMarket = {
    type: "get_market",
    payload: {
        marketSymbol: string
    }
}

type createCategory = {
    type: "create_category",
    payload: {
        token: string,
        title: string,
        icon: string,
        description: string
    }
}

export type requestPayload = signup | login | empty | createMarker | order | getMarket | getMarkets | createCategory;
