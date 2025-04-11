"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const redis_1 = require("redis");
class RedisManager {
    constructor() {
        this.client = (0, redis_1.createClient)();
        this.client.connect();
    }
    static getInstace() {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }
    publishMessage(channel, message) {
        this.client.publish(channel, JSON.stringify(message));
    }
    sendToApi(clientId, message) {
        this.client.publish(clientId, JSON.stringify(message));
    }
}
exports.RedisManager = RedisManager;
