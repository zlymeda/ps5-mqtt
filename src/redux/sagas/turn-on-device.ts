import createDebugger from "debug";
import { merge } from "lodash";
import { put } from "redux-saga/effects";
import sh from "shelljs";
import { setTransitioning, updateHomeAssistant } from "../action-creators";
import type { ApplyToDeviceAction } from "../types";

const debug = createDebugger("@ha:ps5:turnOnDevice");

function* turnOnDevice(action: ApplyToDeviceAction) {
    if(action.payload.mode !== 'AWAKE') {
        return;
    }

    yield put(
        setTransitioning(
            merge({}, action.payload.device, { transitioning: true })
        )
    );
    yield put(
        updateHomeAssistant(
            merge({}, action.payload.device, { status: "AWAKE" })
        )
    );
    debug(
        sh.exec(
            `playactor wake --ip ${action.payload.device.address.address}`, 
            { silent: true }
        )
    );
}

export { turnOnDevice };

