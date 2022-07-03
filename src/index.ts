import { configureStore } from "@reduxjs/toolkit";
import createDebugger from "debug";
import createSagaMiddleware from "redux-saga";
import reducer, {
    applyToDevice,
    getDevices,
    pollDevices,
    pollDiscovery,
    saga
} from "./redux";
import { SwitchStatus } from "./redux/types";
import { createMqtt } from "./util/mqtt-client";

const debug = createDebugger("@ha:ps5");
const debugState = createDebugger("@ha:state");

async function run() {
    debug("Started");
    try {
        const sagaMiddleware = createSagaMiddleware();
        const store = configureStore({
            reducer,
            middleware: [sagaMiddleware]
        });
        store.subscribe(() => {
            debugState(JSON.stringify(store.getState(), null, 2));
        });
        sagaMiddleware.run(saga);
        const mqtt = await createMqtt();

        const setTopicRegEx = /^homeassistant\/switch\/(.*)\/set$/;
        const availabilityTopicRegEx = /^homeassistant\/switch\/(.*)\/availability$/;
        mqtt.on("message", (topic, payload) => {
            if (setTopicRegEx.test(topic)) {
                const matches = setTopicRegEx.exec(topic);
                if (!matches) {
                    return;
                }
                const homeAssistantId = matches[1];
                const devices = getDevices(store.getState());
                const device = devices.find(
                    (device) => device.homeAssistantId === homeAssistantId
                );
                if (!device) {
                    return;
                }
                const data = payload.toString();
                store.dispatch(applyToDevice(device, data as SwitchStatus));
            }
            else if (availabilityTopicRegEx.test(topic)) {
                const matches = setTopicRegEx.exec(topic);
                if (!matches) {
                    return;
                }
                const homeAssistantId = matches[1];
                const devices = getDevices(store.getState());
                if (devices.find(d => d.homeAssistantId === homeAssistantId) !== undefined) {
                    mqtt.publish(topic, "online", { qos: 0, retain: true });
                } else {
                    mqtt.publish(topic, "offline", { qos: 0, retain: true });
                }
            }
        });

        store.dispatch(pollDevices());
        store.dispatch(pollDiscovery());
    } catch (e) {
        debug(e);
    }
}

if (require.main === module) {
    run();
}

export default run;
