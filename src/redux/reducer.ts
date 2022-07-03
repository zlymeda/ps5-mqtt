import { merge } from "lodash";
import type { AnyAction, State } from "./types";

const defaultState: State = {
    devices: {},
};

const reducer = (state = defaultState, action: AnyAction) => {
    switch (action.type) {
        case "ADD_DEVICE": {
            return merge({}, state, {
                devices: {
                    [action.payload.id]: action.payload,
                },
            });
        }

        case "UPDATE_HOME_ASSISTANT": {
            return merge({}, state, {
                devices: {
                    [action.payload.device.id]: {
                        status: action.payload.device.status,
                    },
                },
            });
        }

        case "TRANSITIONING": {
            return merge({}, state, {
                devices: {
                    [action.payload.id]: {
                        transitioning: action.payload.transitioning,
                    },
                },
            });
        }
    }

    return state;
};

export default reducer;
